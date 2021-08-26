const cluster = require("cluster");
const axios = require("axios");
const sanitize = require("mongo-sanitize");
require("axios-debug-log");

const retry = require("async-retry");

const constants = require("./constants");
const credentials = require("./../credentials.json");

const Hypixel = axios.create({
  baseURL: "https://api.hypixel.net/",
});

/**
 * converts a string to a number if it can be converted
 * @param {string} key
 * @returns {string|number}
 */
function getKey(key) {
  const intKey = new Number(key);

  if (!isNaN(intKey)) {
    return intKey;
  }

  return key;
}

module.exports = {
  /**
   * @deprecated use optional chaining instead
   *
   * @param {any} obj an object
   * @param  {...(string|number)} keys a path
   * @returns {boolean} if the path exists on the object
   */
  hasPath: (obj, ...keys) => {
    if (obj == null) {
      return false;
    }

    let loc = obj;

    for (let i = 0; i < keys.length; i++) {
      loc = loc[getKey(keys[i])];

      if (loc === undefined) {
        return false;
      }
    }

    return true;
  },

  /**
   * @deprecated use optional chaining instead
   *
   * @param {any} obj an object
   * @param  {...(string|number)} keys a path
   * @returns {any} the value at the path on the object
   */
  getPath: (obj, ...keys) => {
    if (obj == null) {
      return undefined;
    }

    let loc = obj;

    for (let i = 0; i < keys.length; i++) {
      loc = loc[getKey(keys[i])];

      if (loc === undefined) {
        return undefined;
      }
    }

    return loc;
  },

  /**
   * @deprecated because it's inefficient
   *
   * sets value at path on object
   * @param {any} obj an object
   * @param {any} value a value
   * @param  {...(string|number)} keys a path
   */
  setPath: (obj, value, ...keys) => {
    let i;
    let loc = obj || {};

    for (i = 0; i < keys.length - 1; i++) {
      if (loc[keys[i]] == undefined) {
        loc[keys[i]] = {};
      }

      loc = loc[keys[i]];
    }

    loc[keys[i]] = value;
  },

  getId: (item) => {
    return item?.tag?.ExtraAttributes?.id ?? "";
  },

  resolveUsernameOrUuid: async (uuid, db, cacheOnly = false) => {
    let user = null;

    uuid = uuid.replace(/-/g, "");

    const isUuid = uuid.length == 32;

    if (isUuid) {
      user = await db.collection("usernames").findOne({ uuid: sanitize(uuid) });
    } else {
      const playerObjects = await db
        .collection("usernames")
        .find({ $text: { $search: sanitize(uuid) } })
        .toArray();

      for (const doc of playerObjects) {
        if (doc.username.toLowerCase() == uuid.toLowerCase()) {
          user = doc;
        }
      }
    }

    const defaultAlexSkin =
      "https://textures.minecraft.net/texture/3b60a1f6d562f52aaebbf1434f1de147933a3affe0e764fa49ea057536623cd3";

    /** @type {{model:"default"|"slim"; skinurl:string; capeurl?:string;}} */
    const skin_data = {
      skinurl: defaultAlexSkin,
      model: "slim",
    };

    if (user?.skinurl != undefined) {
      skin_data.skinurl = user.skinurl;
      skin_data.model = user.model;

      if (user?.capeurl != undefined) {
        skin_data.capeurl = user.capeurl;
      }
    }

    if (cacheOnly === false && (user == undefined || +new Date() - user.date > 7200 * 1000)) {
      let profileRequest = axios(`https://api.ashcon.app/mojang/v1/user/${uuid}`, { timeout: 5000 });

      profileRequest
        .then(async (response) => {
          try {
            const { data } = response;

            data.id = data.uuid.replace(/-/g, "");

            let updateDoc = {
              username: data.username,
              date: +new Date(),
            };

            if (data.textures?.skin != undefined) {
              skin_data.skinurl = data.textures.skin.url;
              skin_data.model = data.textures.slim ? "slim" : "default";
            }

            if (data.textures?.cape != undefined) {
              skin_data.capeurl = data.textures.cape.url;
            }

            updateDoc = Object.assign(updateDoc, skin_data);

            await db.collection("usernames").updateOne({ uuid: data.id }, { $set: updateDoc }, { upsert: true });

            const playerObjects = await db.collection("usernames").find({ $text: { $search: data.username } });

            for await (const doc of playerObjects) {
              if (doc.uuid == data.id) {
                continue;
              }

              if (doc.username.toLowerCase() == data.username.toLowerCase()) {
                await db.collection("usernames").deleteOne({ _id: doc._id });

                module.exports.resolveUsernameOrUuid(doc.uuid, db).catch(console.error);
              }
            }
          } catch (e) {
            console.error(e);
          }
        })
        .catch(async (err) => {
          if (user) {
            await db.collection("usernames").updateOne({ uuid: user.uuid }, { $set: { date: +new Date() } });
          }

          console.error(err);
        });

      if (!user) {
        try {
          let { data } = await profileRequest;

          data.id = data.uuid.replace(/-/g, "");

          if (data.textures?.skin != undefined) {
            skin_data.skinurl = data.textures.skin.url;
            skin_data.model = data.textures.slim ? "slim" : "default";
          }

          if (data.textures?.cape != undefined) {
            skin_data.capeurl = data.textures.cape.url;
          }

          return { uuid: data.id, display_name: data.username, skin_data };
        } catch (e) {
          if (isUuid) {
            return { uuid, display_name: uuid, skin_data };
          } else {
            throw e?.response?.data?.reason ?? "Failed resolving username.";
          }
        }
      }
    }

    if (user) {
      return { uuid: user.uuid, display_name: user.username, emoji: user.emoji, skin_data };
    } else {
      return { uuid, display_name: uuid, skin_data };
    }
  },

  getGuild: async (uuid, db, cacheOnly = false) => {
    uuid = sanitize(uuid);
    const guildMember = await db.collection("guildMembers").findOne({ uuid });

    let guildObject = null;

    if (cacheOnly && guildMember == undefined) {
      return null;
    }

    if (guildMember != undefined && guildMember.gid !== null) {
      guildObject = await db.collection("guilds").findOne({ gid: sanitize(guildMember.gid) });
    }

    if (
      cacheOnly ||
      (guildMember != undefined &&
        guildMember.gid !== null &&
        (guildObject == undefined || Date.now() - guildMember.last_updated < 7200 * 1000))
    ) {
      if (guildMember.gid !== null) {
        const guildObject = await db.collection("guilds").findOne({ gid: sanitize(guildMember.gid) });

        if (guildObject == undefined) {
          return null;
        }

        guildObject.level = module.exports.getGuildLevel(guildObject.exp);
        guildObject.gmUser = guildObject.gm
          ? await module.exports.resolveUsernameOrUuid(guildObject.gm, db, cacheOnly)
          : "None";
        guildObject.rank = guildMember.rank;

        return guildObject;
      }

      return null;
    } else {
      if (guildMember == undefined || Date.now() - guildMember.last_updated > 7200 * 1000) {
        try {
          const guildResponse = await Hypixel.get("guild", {
            params: { player: uuid, key: credentials.hypixel_api_key },
          });

          const { guild } = guildResponse.data;

          let gm;

          if (guild && guild !== null) {
            for (const member of guild.members) {
              if (["guild master", "guildmaster"].includes(member.rank.toLowerCase())) {
                gm = member.uuid;
              }
            }

            for (const member of guild.members) {
              if (!gm && guild.ranks.find((a) => a.name.toLowerCase() == member.rank.toLowerCase()) == undefined) {
                gm = member.uuid;
              }

              await db
                .collection("guildMembers")
                .updateOne(
                  { uuid: member.uuid },
                  { $set: { gid: guild._id, rank: member.rank, last_updated: new Date() } },
                  { upsert: true }
                );
            }

            const guildMembers = await db.collection("guildMembers").find({ gid: guild._id }).toArray();

            for (const member of guildMembers) {
              if (guild.members.find((a) => a.uuid == member.uuid) == undefined) {
                await db
                  .collection("guildMembers")
                  .updateOne({ uuid: member.uuid }, { $set: { gid: null, last_updated: new Date() } });
              }
            }

            const guildObject = await db.collection("guilds").findOneAndUpdate(
              { gid: guild._id },
              {
                $set: {
                  name: guild.name,
                  tag: guild.tag,
                  exp: guild.exp,
                  created: guild.created,
                  gm,
                  members: guild.members.length,
                  last_updated: new Date(),
                },
              },
              { returnOriginal: false, upsert: true }
            );

            guildObject.value.level = module.exports.getGuildLevel(guildObject.value.exp);
            guildObject.value.gmUser = await module.exports.resolveUsernameOrUuid(guildObject.value.gm, db);
            guildObject.value.rank = guild.members.find((a) => a.uuid == uuid).rank;

            return guildObject.value;
          } else {
            await db
              .collection("guildMembers")
              .findOneAndUpdate({ uuid }, { $set: { gid: null, last_updated: new Date() } }, { upsert: true });
          }

          return null;
        } catch (e) {
          console.error(e);
          return null;
        }
      } else {
        return null;
      }
    }
  },

  getGuildLevel: (xp) => {
    let level = 0;

    while (true) {
      const xpNeeded = constants.guild_xp[Math.min(constants.guild_xp.length - 1, level)];

      if (xp > xpNeeded) {
        xp -= xpNeeded;
        level++;
      } else {
        return level;
      }
    }
  },

  /**
   * Convert Minecraft lore to HTML
   * @param {string} text minecraft lore with color and formatting codes
   * @returns {string} HTML
   */
  renderLore: (text) => {
    let output = "";

    /**
     * @typedef {"0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"a"|"b"|"c"|"d"|"e"|"f"} ColorCode
     * @typedef {"k"|"l"|"m"|"n"|"o"} FormatCode
     */

    /** @type {ColorCode|null} */
    let color = null;
    /** @type {Set<FormatCode>} */
    let formats = new Set();

    for (let part of text.match(/(§[0-9a-fk-or])*[^§]*/g)) {
      while (part.charAt(0) === "§") {
        const code = part.charAt(1);

        if (/[0-9a-f]/.test(code)) {
          color = code;
        } else if (/[k-o]/.test(code)) {
          formats.add(code);
        } else if (code === "r") {
          color = null;
          formats.clear();
        }

        part = part.substring(2);
      }

      if (part.length === 0) continue;

      output += "<span";

      if (color !== null) {
        output += ` style='color: var(--§${color});'`;
      }

      if (formats.size > 0) {
        output += ` class='${Array.from(formats, (x) => "§" + x).join(" ")}'`;
      }

      output += `>${part}</span>`;
    }

    const matchingEnchants = constants.special_enchants.filter((a) => output.includes(a));

    for (const enchantment of matchingEnchants) {
      if (enchantment == "Power 6" || (enchantment == "Power 7" && text.startsWith("§8Breaking"))) {
        continue;
      }
      output = output.replace(enchantment, `<span style='color: var(--§6)'>${enchantment}</span>`);
    }

    return output;
  },

  /**
   * Get Minecraft lore without the color and formatting codes
   * @param {string} text lore with color codes
   * @returns {string} lore without color codes
   */
  getRawLore: (text) => {
    return text.replace(/§[0-9a-fk-or]/g, "");
  },

  /**
   * @param {string} word
   * @returns {string}
   * @example
   * // returns "Hello world"
   * capitalizeFirstLetter("hello world");
   */
  capitalizeFirstLetter: (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  },

  /**
   * @param {string} word
   * @returns {string}
   * @example
   * // returns "Hello World"
   * capitalizeFirstLetter("hello world");
   */
  titleCase: (string) => {
    let split = string.toLowerCase().split(" ");

    for (let i = 0; i < split.length; i++) {
      split[i] = split[i].charAt(0).toUpperCase() + split[i].substring(1);
    }

    return split.join(" ");
  },

  /**
   * checks whether a string should be proceeded by a or by an
   * @param {string} string
   * @returns {"a"|"an"}
   * @example
   * // returns "a"
   * aOrAn("cat");
   * @example
   * // returns "an"
   * aOrAn("egg");
   */
  aOrAn: (string) => {
    return ["a", "e", "i", "o", "u"].includes(string.charAt(0).toLowerCase()) ? "an" : "a";
  },

  /**
   * returns a object with they key sorted
   * @param {object} obj
   * @returns {object}
   */
  sortObject: (obj) => {
    return Object.keys(obj)
      .sort()
      .reduce(function (res, key) {
        res[key] = obj[key];
        return res;
      }, {});
  },

  getPrice: (orderSummary) => {
    orderSummary = orderSummary.slice(0, Math.ceil(orderSummary.length / 2));

    const orders = [];

    const totalVolume = orderSummary.map((a) => a.amount).reduce((a, b) => a + b, 0);
    const volumeTop2 = Math.ceil(totalVolume * 0.02);

    let volume = 0;

    for (const order of orderSummary) {
      const cappedAmount = Math.min(order.amount, volumeTop2 - volume);

      orders.push([order.pricePerUnit, cappedAmount]);

      volume += cappedAmount;

      if (volume >= volumeTop2) {
        break;
      }
    }

    const totalWeight = orders.reduce((sum, value) => sum + value[1], 0);

    return orders.reduce((mean, value) => mean + (value[0] * value[1]) / totalWeight, 0);
  },

  getPrices: (product) => {
    return {
      buyPrice: module.exports.getPrice(product.buy_summary),
      sellPrice: module.exports.getPrice(product.sell_summary),
    };
  },

  /**
   * @param {number} number the number to be formatted
   * @param {boolean} floor rounds down if true up if false
   * @param {number} rounding //TODO figure out what this does
   */
  formatNumber: (number, floor, rounding = 10) => {
    if (number < 1000) {
      return Math.floor(number);
    } else if (number < 10000) {
      if (floor) {
        return (Math.floor((number / 1000) * rounding) / rounding).toFixed(rounding.toString().length - 1) + "K";
      } else {
        return (Math.ceil((number / 1000) * rounding) / rounding).toFixed(rounding.toString().length - 1) + "K";
      }
    } else if (number < 1000000) {
      if (floor) {
        return Math.floor(number / 1000) + "K";
      } else {
        return Math.ceil(number / 1000) + "K";
      }
    } else if (number < 1000000000) {
      if (floor) {
        return (Math.floor((number / 1000 / 1000) * rounding) / rounding).toFixed(rounding.toString().length - 1) + "M";
      } else {
        return (Math.ceil((number / 1000 / 1000) * rounding) / rounding).toFixed(rounding.toString().length - 1) + "M";
      }
    } else if (floor) {
      return (
        (Math.floor((number / 1000 / 1000 / 1000) * rounding * 10) / (rounding * 10)).toFixed(
          rounding.toString().length
        ) + "B"
      );
    } else {
      return (
        (Math.ceil((number / 1000 / 1000 / 1000) * rounding * 10) / (rounding * 10)).toFixed(
          rounding.toString().length
        ) + "B"
      );
    }
  },

  /**
   * calculates the letter grade of a dungeon Run
   * @param {{score_exploration:number,score_speed:number,score_skill:number,score_bonus:number}} data dungeon run
   * @returns {"S+"|"S"|"A"|"B"|"C"|"D"} letter grade
   */
  calcDungeonGrade: (data) => {
    const total_score = data.score_exploration + data.score_speed + data.score_skill + data.score_bonus;
    if (total_score <= 99) {
      return "D";
    } else if (total_score <= 159) {
      return "C";
    } else if (total_score <= 229) {
      return "B";
    } else if (total_score <= 269) {
      return "A";
    } else if (total_score <= 299) {
      return "S";
    } else {
      return "S+";
    }
  },

  parseRank: (player) => {
    const output = {
      rankText: null,
      rankColor: null,
      plusText: null,
      plusColor: null,
    };

    const rankName = player.prefix
      ? module.exports.getRawLore(player.prefix).replace(/\[|\]/g, "")
      : player.rank && player.rank != "NORMAL"
      ? player.rank
      : player.monthlyPackageRank && player.monthlyPackageRank != "NONE"
      ? player.monthlyPackageRank
      : player.newPackageRank
      ? player.newPackageRank
      : player.packageRank
      ? player.packageRank
      : "NONE";

    if (constants.ranks[rankName]) {
      const { tag, color, plus, plusColor } = constants.ranks[rankName];
      output.rankText = tag;

      if (rankName == "SUPERSTAR") {
        output.rankColor = constants.color_names[player.monthlyRankColor] ?? color;
      } else {
        output.rankColor = color;
      }

      if (plus) {
        output.plusText = plus;

        if (rankName == "SUPERSTAR" || rankName == "MVP_PLUS") {
          output.plusColor = constants.color_names[player.rankPlusColor] ?? plusColor;
        } else {
          output.plusColor = plusColor;
        }
      }
    }

    return output;
  },

  renderRank: ({ rankText, rankColor, plusText, plusColor }) => {
    if (rankText === null) {
      return "";
    } else {
      return /*html*/ `
        <div class="rank-tag nice-colors-dark">
            <div class="rank-name" style="background-color: var(--§${rankColor})">${rankText}</div>
            ${
              plusText
                ? /*html*/ `<div class="rank-plus" style="background-color: var(--§${plusColor})">${plusText}</div>`
                : ""
            }
        </div>
      `;
    }
  },

  updateRank: async (uuid, db) => {
    let rank = {
      rankText: null,
      rankColor: null,
      plusText: null,
      plusColor: null,
      socials: {},
      achievements: {},
      claimed_items: {},
    };

    try {
      const response = await retry(async () => {
        return await Hypixel.get("player", {
          params: {
            key: credentials.hypixel_api_key,
            uuid,
          },
        });
      });

      const player = response.data.player;

      rank = Object.assign(rank, module.exports.parseRank(player));

      if (player?.socialMedia?.links != undefined) {
        rank.socials = player.socialMedia.links;
      }

      if (player?.achievements != undefined) {
        rank.achievements = player.achievements;
      }

      let claimable = {
        claimed_potato_talisman: "Potato Talisman",
        claimed_potato_basket: "Potato Basket",
        claim_potato_war_silver_medal: "Silver Medal (Potato War)",
        claim_potato_war_crown: "Crown (Potato War)",
        skyblock_free_cookie: "Free Booster Cookie",
        scorpius_bribe_96: "Scorpius Bribe (Year 96)",
        scorpius_bribe_120: "Scorpius Bribe (Year 120)",
        scorpius_bribe_144: "Scorpius Bribe (Year 144)",
      };

      for (const item in claimable) {
        if (player?.[item]) {
          rank.claimed_items[claimable[item]] = player[item];
        }
      }
    } catch (e) {
      console.error(e);
    }

    rank.last_updated = new Date();

    await db.collection("hypixelPlayers").updateOne({ uuid: sanitize(uuid) }, { $set: rank }, { upsert: true });

    return rank;
  },

  getRank: async (uuid, db, cacheOnly = false) => {
    uuid = sanitize(uuid);

    let hypixelPlayer = await db.collection("hypixelPlayers").findOne({ uuid });

    let updateRank;

    if (cacheOnly === false && (hypixelPlayer == undefined || +new Date() - hypixelPlayer.last_updated > 3600 * 1000)) {
      updateRank = module.exports.updateRank(uuid, db);
    }

    if (cacheOnly === false && hypixelPlayer == undefined) {
      hypixelPlayer = await updateRank;
    }

    if (hypixelPlayer == undefined) {
      hypixelPlayer = { achievements: {} };
    }

    return hypixelPlayer;
  },

  fetchMembers: async (profileId, db, returnUuid = false) => {
    let output = [];
    profileId = sanitize(profileId);

    const members = await db.collection("members").find({ profile_id: profileId }).toArray();

    if (members.length == 0) {
      let profileResponse = await Hypixel.get("skyblock/profile", {
        params: { key: credentials.hypixel_api_key, profile: profileId },
      });

      let memberPromises = [];

      for (const member in profileResponse.data.profile.members) {
        memberPromises.push(module.exports.resolveUsernameOrUuid(member, db));
      }

      let profileMembers = await Promise.all(memberPromises);

      for (const profileMember of profileMembers) {
        await db
          .collection("members")
          .replaceOne(
            { profile_id: profileId, uuid: profileMember.uuid },
            { profile_id: profileId, uuid: profileMember.uuid, username: profileMember.display_name },
            { upsert: true }
          );
      }

      if (returnUuid) {
        output = profileMembers;
      } else {
        output = profileMembers.map((a) => a.display_name);
      }
    } else {
      if (returnUuid) {
        output = members.map((a) => {
          return { uuid: a.uuid, display_name: a.username };
        });
      } else {
        output = members.map((a) => a.username);
      }
    }

    return output;
  },

  getClusterId: (fullName = false) => {
    if (fullName) {
      return cluster.isWorker ? `worker${cluster.worker.id}` : "master";
    }

    return cluster.isWorker ? `w${cluster.worker.id}` : "m";
  },

  generateDebugId: (endpointName = "unknown") => {
    return (
      module.exports.getClusterId() +
      "/" +
      endpointName +
      "_" +
      new Date().getTime() +
      "." +
      Math.floor(Math.random() * 9000 + 1000)
    );
  },

  generateUUID: () => {
    let u = "",
      i = 0;
    while (i++ < 36) {
      let c = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"[i - 1],
        r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      u += c == "-" || c == "4" ? c : v.toString(16);
    }
    return u;
  },

  /**
   * @typedef {{slot_type:string,slot_number:number,gem_type:string,gem_tier:string,lore:string}} Gem
   */

  /**
   * @param  {{[key:string]:string}} gems item.ExtraAttributes.gems
   * @param  {string} [rarity] item rarity, ex: MYTHIC
   *
   * @returns {Gem[]} array of gem objects
   */
  parseItemGems: (gems, rarity) => {
    /** @type {Gem[]} */
    const parsed = [];
    for (const [key, value] of Object.entries(gems)) {
      if (key.startsWith("UNIVERSAL_")) {
        if (key.endsWith("_gem")) {
          continue;
        }
        parsed.push({
          slot_type: "UNIVERSAL",
          slot_number: +key.split("_")[1],
          gem_type: gems[`${key}_gem`],
          gem_tier: value,
        });
      } else {
        parsed.push({
          slot_type: key.split("_")[0],
          slot_number: +key.split("_")[1],
          gem_type: key.split("_")[0],
          gem_tier: value,
        });
      }
    }

    parsed.forEach((gem) => {
      gem.lore = module.exports.generateGemLore(gem.gem_type, gem.gem_tier, rarity);
    });

    return parsed;
  },

  /**
   * @param  {string} type gem name, ex: RUBY
   * @param  {string} tier gem tier, ex: PERFECT
   * @param  {string} [rarity] item rarity, ex: MYTHIC
   *
   * @returns {string} formatted gem string
   *
   * @example
   * // returns "§cPerfect Ruby §7(§c+25❤§7)"
   * generateGemLore("RUBY", "PERFECT", "MYTHIC");
   */
  generateGemLore: (type, tier, rarity) => {
    const lore = [];
    const stats = [];

    // Gem color
    const color = `§${constants.gemstones[type.toUpperCase()].color}`;

    // Gem stats
    if (rarity) {
      const gemstone_stats = constants.gemstones[type.toUpperCase()]?.stats?.[tier.toUpperCase()];
      if (gemstone_stats) {
        Object.keys(gemstone_stats).forEach((stat) => {
          const stat_value = gemstone_stats[stat][module.exports.rarityNameToInt(rarity)];

          if (stat_value && stat_value !== -1) {
            stats.push(["§", constants.stats_colors[stat], "+", stat_value, constants.stats_symbols[stat]].join(""));
          } else {
            stats.push("§c§oMISSING VALUE§r");
          }
        });
      }
    }

    // Final lore
    lore.push(color, module.exports.titleCase(tier), " ", module.exports.titleCase(type));

    if (stats.length) {
      lore.push("§7 (", stats.join("§7, "), "§7)");
    }

    return lore.join("");
  },

  rarityNameToInt: (string) => {
    return constants.rarities.indexOf(string.toLowerCase());
  },
};
