import Phaser from "phaser";

import PlayScene from "./PlayScene";
import PreloadScene from "./PreloadScene";

export function initGame(parent) {
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: 0.85 * window.innerHeight + 26,
    pixelArt: true,
    transparent: true,
    physics: {
      default: "arcade",
      arcade: {
        debug: true,
      },
    },
    scene: [PreloadScene, PlayScene],
    parent,
  };
  new Phaser.Game(config);
}
