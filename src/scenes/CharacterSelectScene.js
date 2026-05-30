import Phaser from 'phaser';

const ROBOTS = [
  { name: 'Arlo', color: 0xB0BEC5, desc: 'Fast & nimble!' },
  { name: 'Vero', color: 0x546E7A, desc: 'Strong & steady!' },
  { name: 'Novo', color: 0x42A5F5, desc: 'Big & bouncy!' }
];

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2C3E50, 0x2C3E50, 0x1a1a2e, 0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    // Stars
    for (let i = 0; i < 50; i++) {
      bg.fillStyle(0xFFFFFF, Math.random() * 0.8 + 0.2);
      bg.fillCircle(Math.random() * width, Math.random() * height * 0.6, Math.random() * 2 + 0.5);
    }

    // Title
    this.add.text(width / 2, 60, 'Choose Your Robot!', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#B8860B',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Robot cards
    const cardWidth = 180;
    const startX = width / 2 - (ROBOTS.length * cardWidth) / 2 + cardWidth / 2;

    ROBOTS.forEach((robot, i) => {
      const cx = startX + i * cardWidth;
      const cy = 280;

      // Card background
      const card = this.add.graphics();
      card.fillStyle(0x34495E, 1);
      card.fillRoundedRect(cx - 75, cy - 120, 150, 280, 15);
      card.lineStyle(3, robot.color);
      card.strokeRoundedRect(cx - 75, cy - 120, 150, 280, 15);

      // Draw robot (larger version)
      this.drawRobotLarge(cx, cy, robot.color);

      // Name
      this.add.text(cx, cy + 90, robot.name, {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);

      // Description
      this.add.text(cx, cy + 115, robot.desc, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#AAAAAA'
      }).setOrigin(0.5);

      // Hit area for selection
      const hitArea = this.add.rectangle(cx, cy + 20, 150, 280)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerover', () => {
        card.clear();
        card.fillStyle(0x44596E, 1);
        card.fillRoundedRect(cx - 75, cy - 120, 150, 280, 15);
        card.lineStyle(4, 0xFFD700);
        card.strokeRoundedRect(cx - 75, cy - 120, 150, 280, 15);
      });

      hitArea.on('pointerout', () => {
        card.clear();
        card.fillStyle(0x34495E, 1);
        card.fillRoundedRect(cx - 75, cy - 120, 150, 280, 15);
        card.lineStyle(3, robot.color);
        card.strokeRoundedRect(cx - 75, cy - 120, 150, 280, 15);
      });

      hitArea.on('pointerdown', () => {
        this.scene.start('GameScene', { robot });
      });
    });

    // Keyboard shortcuts
    this.add.text(width / 2, height - 40, 'Press 1, 2, or 3 to pick!', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888'
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-ONE', () => this.scene.start('GameScene', { robot: ROBOTS[0] }));
    this.input.keyboard.on('keydown-TWO', () => this.scene.start('GameScene', { robot: ROBOTS[1] }));
    this.input.keyboard.on('keydown-THREE', () => this.scene.start('GameScene', { robot: ROBOTS[2] }));
  }

  drawRobotLarge(x, y, color) {
    const g = this.add.graphics();

    // Body
    g.fillStyle(color, 1);
    g.fillRoundedRect(x - 30, y - 25, 60, 65, 8);

    // Head
    g.fillRoundedRect(x - 22, y - 60, 44, 35, 12);

    // Eyes
    g.fillStyle(0xFFEB3B, 1);
    g.fillCircle(x - 8, y - 45, 6);
    g.fillCircle(x + 8, y - 45, 6);

    // Pupils
    g.fillStyle(0x333333, 1);
    g.fillCircle(x - 7, y - 45, 3);
    g.fillCircle(x + 9, y - 45, 3);

    // Mouth (smile)
    g.lineStyle(2, 0x333333);
    g.beginPath();
    g.arc(x, y - 33, 8, 0, Math.PI, false);
    g.strokePath();

    // Arms
    g.fillStyle(color, 1);
    g.fillRoundedRect(x - 42, y - 18, 12, 42, 4);
    g.fillRoundedRect(x + 30, y - 18, 12, 42, 4);

    // Hands
    g.fillStyle(0x999999, 1);
    g.fillCircle(x - 36, y + 28, 6);
    g.fillCircle(x + 36, y + 28, 6);

    // Legs
    g.fillStyle(color, 1);
    g.fillRoundedRect(x - 20, y + 40, 16, 28, 4);
    g.fillRoundedRect(x + 4, y + 40, 16, 28, 4);

    // Feet
    g.fillStyle(0x666666, 1);
    g.fillRoundedRect(x - 24, y + 64, 22, 8, 3);
    g.fillRoundedRect(x + 2, y + 64, 22, 8, 3);

    // Antenna
    g.lineStyle(3, color);
    g.lineBetween(x, y - 60, x, y - 75);
    g.fillStyle(0xFF5252, 1);
    g.fillCircle(x, y - 75, 5);

    // Chest panel
    g.fillStyle(0x333333, 0.4);
    g.fillRoundedRect(x - 15, y - 15, 30, 20, 4);
    g.fillStyle(0x4CAF50, 1);
    g.fillCircle(x - 5, y - 5, 3);
    g.fillStyle(0xFF5252, 1);
    g.fillCircle(x + 5, y - 5, 3);
    g.fillStyle(0xFFEB3B, 1);
    g.fillCircle(x, y + 2, 3);
  }
}
