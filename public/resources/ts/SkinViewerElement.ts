// @ts-ignore
import * as skinview3d from "../js/skinview3d.bundle.js";

export class SkinViewerElement extends HTMLElement {
  readonly skinViewer: any;
  readonly resizeObserver: ResizeObserver;

  constructor() {
    super();

    this.skinViewer = new skinview3d.SkinViewer({
      width: this.offsetWidth,
      height: this.offsetHeight,
      model: calculated.skin_data.model,
      skin: "/texture/" + calculated.skin_data.skinurl.split("/").pop(),
      cape:
        calculated.skin_data.capeurl != undefined
          ? "/texture/" + calculated.skin_data.capeurl.split("/").pop()
          : "/cape/" + calculated.display_name,
    });

    this.attachShadow({ mode: "open" });
    this.shadowRoot?.appendChild(this.skinViewer.canvas);

    this.skinViewer.camera.position.set(-18, -3, 58);

    const controls = skinview3d.createOrbitControls(this.skinViewer);

    this.skinViewer.canvas.removeAttribute("tabindex");

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
      this.skinViewer.animations.add((player: any, time: number) => {
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
      this.skinViewer.playerObject.skin.leftArm.rotation.z = basicArmRotationZ;
      this.skinViewer.playerObject.skin.rightArm.rotation.z = basicArmRotationZ * -1;
      this.skinViewer.playerObject.cape.rotation.x = basicCapeRotationX;
    }

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this);

    const styleElement = document.createElement("style");

    styleElement.textContent = /*css*/ `
      :host {
        display: grid;
        place-items: center;
      }
    `;

    this.shadowRoot?.appendChild(styleElement);
  }

  private resize() {
    if (this.offsetWidth / this.offsetHeight < 0.5) {
      this.skinViewer.setSize(this.offsetWidth, this.offsetWidth * 2);
    } else {
      this.skinViewer.setSize(this.offsetHeight / 2, this.offsetHeight);
    }
  }
}

window.customElements.define("skin-viewer", SkinViewerElement);
