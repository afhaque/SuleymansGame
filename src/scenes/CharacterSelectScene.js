import Phaser from 'phaser';

const ROBOTS = [
  { name: 'Arlo', color: 0xB0BEC5, desc: 'Fast & nimble!' },
  { name: 'Vero', color: 0x546E7A, desc: 'Strong & steady!' },
  { name: 'Novo', color: 0x42A5F5, desc: 'Big & bouncy!' }
];

const CARD_WIDTH = 180;

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.selectedIndex = 0;
    this.canNavigate = true;

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

    // Build robot cards
    const startX = width / 2 - (ROBOTS.length * CARD_WIDTH) / 2 + CARD_WIDTH / 2;
    this.cards = [];

    ROBOTS.forEach((robot, i) => {
      const cx = startX + i * CARD_WIDTH;
      const cy = 280;

      const card = this.add.graphics();
      this.cards.push({ card, cx, cy, robot });

      this.drawRobotLarge(cx, cy, robot.color);

      this.add.text(cx, cy + 90, robot.name, {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);

      this.add.text(cx, cy + 115, robot.desc, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#AAAAAA'
      }).setOrigin(0.5);

      // Click/touch to select
      const hitArea = this.add.rectangle(cx, cy + 20, 150, 280)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerover', () => {
        this.selectedIndex = i;
        this.updateHighlight();
      });

      hitArea.on('pointerdown', () => {
        this.confirmSelection();
      });
    });

    this.updateHighlight();

    // Help text
    this.add.text(width / 2, height - 40, 'D-pad or arrows to pick, A or Space to confirm!', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888'
    }).setOrigin(0.5);

    // Keyboard: arrows to navigate, space/enter to confirm, 1/2/3 direct
    this.input.keyboard.on('keydown-LEFT', () => this.navigate(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.navigate(1));
    this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
    this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());
    this.input.keyboard.on('keydown-ONE', () => { this.selectedIndex = 0; this.confirmSelection(); });
    this.input.keyboard.on('keydown-TWO', () => { this.selectedIndex = 1; this.confirmSelection(); });
    this.input.keyboard.on('keydown-THREE', () => { this.selectedIndex = 2; this.confirmSelection(); });

    // Gamepad: A button to confirm
    this.input.gamepad.on('down', (pad, button) => {
      // A button (index 0) or B button (index 1) to confirm
      if (button.index === 0 || button.index === 1) {
        this.confirmSelection();
      }
    });
  }

  update() {
    // Poll gamepad for d-pad / left stick navigation
    const pad = this.input.gamepad.pad1;
    if (!pad) return;

    if (this.canNavigate) {
      if (pad.left || pad.leftStick.x < -0.5) {
        this.navigate(-1);
        this.canNavigate = false;
        this.time.delayedCall(250, () => { this.canNavigate = true; });
      } else if (pad.right || pad.leftStick.x > 0.5) {
        this.navigate(1);
        this.canNavigate = false;
        this.time.delayedCall(250, () => { this.canNavigate = true; });
      }
    }
  }

  navigate(dir) {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, ROBOTS.length);
    this.updateHighlight();
  }

  updateHighlight() {
    this.cards.forEach(({ card, cx, cy, robot }, i) => {
      card.clear();
      if (i === this.selectedIndex) {
        card.fillStyle(0x44596E, 1);
        card.fillRoundedRect(cx - 75, cy - 120, 150, 280, 15);
        card.lineStyle(4, 0xFFD700);
        card.strokeRoundedRect(cx - 75, cy - 120, 150, 280, 15);
      } else {
        card.fillStyle(0x34495E, 1);
        card.fillRoundedRect(cx - 75, cy - 120, 150, 280, 15);
        card.lineStyle(3, robot.color);
        card.strokeRoundedRect(cx - 75, cy - 120, 150, 280, 15);
      }
    });
  }

  confirmSelection() {
    this.scene.start('GameScene', { robot: ROBOTS[this.selectedIndex] });
  }

  drawRobotLarge(x, y, color) {
    const g = this.add.graphics();

    g.fillStyle(color, 1);
    g.fillRoundedRect(x - 30, y - 25, 60, 65, 8);
    g.fillRoundedRect(x - 22, y - 60, 44, 35, 12);

    g.fillStyle(0xFFEB3B, 1);
    g.fillCircle(x - 8, y - 45, 6);
    g.fillCircle(x + 8, y - 45, 6);

    g.fillStyle(0x333333, 1);
    g.fillCircle(x - 7, y - 45, 3);
    g.fillCircle(x + 9, y - 45, 3);

    g.lineStyle(2, 0x333333);
    g.beginPath();
    g.arc(x, y - 33, 8, 0, Math.PI, false);
    g.strokePath();

    g.fillStyle(color, 1);
    g.fillRoundedRect(x - 42, y - 18, 12, 42, 4);
    g.fillRoundedRect(x + 30, y - 18, 12, 42, 4);

    g.fillStyle(0x999999, 1);
    g.fillCircle(x - 36, y + 28, 6);
    g.fillCircle(x + 36, y + 28, 6);

    g.fillStyle(color, 1);
    g.fillRoundedRect(x - 20, y + 40, 16, 28, 4);
    g.fillRoundedRect(x + 4, y + 40, 16, 28, 4);

    g.fillStyle(0x666666, 1);
    g.fillRoundedRect(x - 24, y + 64, 22, 8, 3);
    g.fillRoundedRect(x + 2, y + 64, 22, 8, 3);

    g.lineStyle(3, color);
    g.lineBetween(x, y - 60, x, y - 75);
    g.fillStyle(0xFF5252, 1);
    g.fillCircle(x, y - 75, 5);

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
