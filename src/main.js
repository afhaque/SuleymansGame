import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: document.body,
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 400 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [TitleScene, CharacterSelectScene, GameScene]
};

const game = new Phaser.Game(config);
