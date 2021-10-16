import Phaser from "phaser";
import { THEMES, DINO_COLOR } from "../js/preload";

class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.audio("jump", require("./assets/jump.m4a"));
    this.load.audio("hit", require("./assets/hit.m4a"));
    this.load.audio("reach", require("./assets/reach.m4a"));

    THEMES.forEach((t) => {
      this.load.image(`ground-${t.id}`, t.ground);
      this.load.image(`obstacle-${t.id}-1`, t.obstacle1);
      this.load.image(`obstacle-${t.id}-2`, t.obstacle2);
      this.load.image(`obstacle-${t.id}-3`, t.obstacle3);
      this.load.image(`obstacle-${t.id}-4`, t.obstacle4);
    });

    this.load.image("dino-idle", DINO_COLOR.idle);
    this.load.image("dino-hurt", DINO_COLOR.hurt);
    this.load.image("restart", require("./assets/restart.png"));
    this.load.image("game-over", require("./assets/game-over.png"));
    this.load.image("cloud", require("./assets/cloud.png"));

    this.load.spritesheet("dino", DINO_COLOR.spriteRun, {
      frameWidth: 109,
      frameHeight: 94,
    });

    this.load.spritesheet("dino-down", DINO_COLOR.spriteDown, {
      frameWidth: 159,
      frameHeight: 94,
    });

    this.load.spritesheet("enemy-bird", require("./assets/enemy-bird.png"), {
      frameWidth: 92,
      frameHeight: 71,
    });
  }

  create() {
    this.scene.start("PlayScene");
  }
}

export default PreloadScene;
