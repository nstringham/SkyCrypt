// @ts-ignore
import * as skinview3d from "../js/skinview3d.bundle.js";

const playerModel = document.getElementById("player_model") as HTMLElement;

const skinViewer: any = new skinview3d.SkinViewer({
  width: playerModel.offsetWidth,
  height: playerModel.offsetHeight,
  model: calculated.skin_data.model,
  skin: "/texture/" + calculated.skin_data.skinurl.split("/").pop(),
  cape:
    calculated.skin_data.capeurl != undefined
      ? "/texture/" + calculated.skin_data.capeurl.split("/").pop()
      : "/cape/" + calculated.display_name,
});

playerModel.appendChild(skinViewer.canvas);

skinViewer.camera.position.set(-18, -3, 58);

const controls = skinview3d.createOrbitControls(skinViewer);

skinViewer.canvas.removeAttribute("tabindex");

controls.enableZoom = false;
controls.enablePan = false;

/**
 * the average Z rotation of the arms
 */
const basicArmRotationZ = Math.PI * 0.02;

/**
 * the average X rotation of the cape
 */
const basicCapeRotationX = Math.PI * 0.06;

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  skinViewer.animations.add((player: any, time: number) => {
    // Multiply by animation's natural speed
    time *= 2;

    // Arm swing
    const armRotation = Math.cos(time) * 0.03 + basicArmRotationZ;
    player.skin.leftArm.rotation.z = armRotation;
    player.skin.rightArm.rotation.z = armRotation * -1;

    // Cape wave
    player.cape.rotation.x = Math.sin(time) * 0.01 + basicCapeRotationX;
  });
} else {
  skinViewer.playerObject.skin.leftArm.rotation.z = basicArmRotationZ;
  skinViewer.playerObject.skin.rightArm.rotation.z = basicArmRotationZ * -1;
  skinViewer.playerObject.cape.rotation.x = basicCapeRotationX;
}

function resize() {
  if (playerModel && skinViewer) {
    if (playerModel.offsetWidth / playerModel.offsetHeight < 0.6) {
      skinViewer.setSize(playerModel.offsetWidth, playerModel.offsetWidth * 2);
      console.log("a");
    } else {
      skinViewer.setSize(playerModel.offsetHeight / 2, playerModel.offsetHeight);
      console.log("b");
    }
  }
}

resize();

window.addEventListener("resize", resize);

console.log("done");
