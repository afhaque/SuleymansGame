import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Sky gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x4682B4, 0x4682B4, 1);
    bg.fillRect(0, 0, width, height);

    // Clouds
    this.drawCloud(150, 100);
    this.drawCloud(500, 60);
    this.drawCloud(700, 140);

    // Ground
    bg.fillStyle(0x4CAF50);
    bg.fillRect(0, height - 80, width, 80);
    bg.fillStyle(0x388E3C);
    bg.fillRect(0, height - 80, width, 8);

    // Title text
    this.add.text(width / 2, 140, "Suleyman's", {
      fontSize: '52px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#B8860B',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 210, 'Robot Adventure', {
      fontSize: '44px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 5
    }).setOrigin(0.5);

    // Draw the three robots on title screen
    this.drawRobot(250, 380, 0xB0BEC5, 'Arlo');   // Silver
    this.drawRobot(400, 380, 0x546E7A, 'Vero');   // Dark grey
    this.drawRobot(550, 380, 0x42A5F5, 'Novo');   // Blue

    // Play button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xFF6B35, 1);
    btnBg.fillRoundedRect(width / 2 - 100, height - 140, 200, 50, 12);
    btnBg.lineStyle(3, 0xE55A2B);
    btnBg.strokeRoundedRect(width / 2 - 100, height - 140, 200, 50, 12);

    const playText = this.add.text(width / 2, height - 115, 'PLAY!', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Make button interactive
    const hitArea = this.add.rectangle(width / 2, height - 115, 200, 50)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xFF8C5A, 1);
      btnBg.fillRoundedRect(width / 2 - 100, height - 140, 200, 50, 12);
      btnBg.lineStyle(3, 0xE55A2B);
      btnBg.strokeRoundedRect(width / 2 - 100, height - 140, 200, 50, 12);
    });

    hitArea.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xFF6B35, 1);
      btnBg.fillRoundedRect(width / 2 - 100, height - 140, 200, 50, 12);
      btnBg.lineStyle(3, 0xE55A2B);
      btnBg.strokeRoundedRect(width / 2 - 100, height - 140, 200, 50, 12);
    });

    hitArea.on('pointerdown', () => {
      this.scene.start('CharacterSelectScene');
    });

    // Also allow spacebar or any key
    this.input.keyboard.on('keydown', () => {
      this.scene.start('CharacterSelectScene');
    });
  }

  drawCloud(x, y) {
    const g = this.add.graphics();
    g.fillStyle(0xFFFFFF, 0.8);
    g.fillCircle(x, y, 30);
    g.fillCircle(x + 30, y - 10, 25);
    g.fillCircle(x + 60, y, 30);
    g.fillCircle(x + 30, y + 5, 28);
  }

  drawRobot(x, y, color, name) {
    const g = this.add.graphics();

    // Body
    g.fillStyle(color, 1);
    g.fillRoundedRect(x - 20, y - 20, 40, 45, 5);

    // Head
    g.fillRoundedRect(x - 15, y - 45, 30, 25, 8);

    // Eyes
    g.fillStyle(0xFFEB3B, 1);
    g.fillCircle(x - 6, y - 35, 4);
    g.fillCircle(x + 6, y - 35, 4);

    // Pupils
    g.fillStyle(0x333333, 1);
    g.fillCircle(x - 5, y - 35, 2);
    g.fillCircle(x + 7, y - 35, 2);

    // Arms
    g.fillStyle(color, 1);
    g.fillRoundedRect(x - 28, y - 15, 8, 30, 3);
    g.fillRoundedRect(x + 20, y - 15, 8, 30, 3);

    // Legs
    g.fillRoundedRect(x - 14, y + 25, 10, 20, 3);
    g.fillRoundedRect(x + 4, y + 25, 10, 20, 3);

    // Antenna
    g.lineStyle(2, color);
    g.lineBetween(x, y - 45, x, y - 55);
    g.fillStyle(0xFF5252, 1);
    g.fillCircle(x, y - 55, 3);

    // Name label
    this.add.text(x, y + 55, name, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 3
    }).setOrigin(0.5);
  }
}
