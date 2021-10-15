import Phaser from "phaser";
import { THEMES } from "../js/preload";

class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    console.log(THEMES);
    this.load.audio("jump", require("./assets/jump.m4a"));
    this.load.audio("hit", require("./assets/hit.m4a"));
    this.load.audio("reach", require("./assets/reach.m4a"));

    this.load.image("ground", require("./assets/ground.png"));
    this.load.image("dino-idle", require("./assets/dino-idle.png"));
    this.load.image("dino-hurt", require("./assets/dino-hurt.png"));
    this.load.image("restart", require("./assets/restart.png"));
    this.load.image("game-over", require("./assets/game-over.png"));
    this.load.image("cloud", require("./assets/cloud.png"));

    this.load.spritesheet("star", require("./assets/stars.png"), {
      frameWidth: 9,
      frameHeight: 9,
    });

    this.load.spritesheet("moon", require("./assets/moon.png"), {
      frameWidth: 20,
      frameHeight: 40,
    });

    this.load.spritesheet("dino", require("./assets/dino-run.png"), {
      frameWidth: 88,
      frameHeight: 94,
    });

    this.load.spritesheet("dino-down", require("./assets/dino-down.png"), {
      frameWidth: 118,
      frameHeight: 94,
    });

    this.load.spritesheet("enemy-bird", require("./assets/enemy-bird.png"), {
      frameWidth: 92,
      frameHeight: 77,
    });

    this.load.image("obsticle-1", require("./assets/cactuses_small_1.png"));
    this.load.image("obsticle-2", require("./assets/cactuses_small_2.png"));
    this.load.image("obsticle-3", require("./assets/cactuses_small_3.png"));
    this.load.image("obsticle-4", require("./assets/cactuses_big_1.png"));
    this.load.image("obsticle-5", require("./assets/cactuses_big_2.png"));
    this.load.image("obsticle-6", require("./assets/cactuses_big_3.png"));
  }

  create() {
    this.scene.start("PlayScene");
  }
}

export default PreloadScene;
