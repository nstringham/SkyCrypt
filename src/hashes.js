const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const util = require("util");

const hashedDirectories = ["css"];

function getFileHash(filename) {
  return new Promise((resolve, reject) => {
    const md5sum = crypto.createHash("md5");

    const s = fs.createReadStream(filename);

    s.on("data", function (data) {
      md5sum.update(data);
    });

    s.on("end", function () {
      const hash = md5sum.digest("hex");
      resolve(hash);
    });
  });
}

function getFileHashes() {
  const directoryPromises = hashedDirectories.map(async (directory) => {
    const readdirPromise = util.promisify(fs.readdir);

    const fileNames = await readdirPromise(path.join(__dirname, "../public/resources", directory));

    const filePromises = fileNames.map((filename) =>
      getFileHash(path.join(__dirname, "../public/resources", directory, filename))
    );

    const fileHashes = await Promise.all(filePromises);

    const hashesObject = {};

    for (let i = 0; i < fileNames.length; i++) {
      hashesObject[fileNames[i]] = fileHashes[i];
    }

    return hashesObject;
  });

  return Promise.all(directoryPromises).then((directories) => {
    const directoriesObject = {};

    for (let i = 0; i < hashedDirectories.length; i++) {
      directoriesObject[hashedDirectories[i]] = directories[i];
    }

    return directoriesObject;
  });
}

module.exports = {
  hashedDirectories,
  getFileHash,
  getFileHashes,
};
