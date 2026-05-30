import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.robotData = data.robot || { name: 'Arlo', color: 0xB0BEC5 };
    this.score = 0;
  }

  create() {
    const { width, height } = this.scale;

    // Sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xB0E0FF, 0xB0E0FF, 1);
    sky.fillRect(0, 0, width, height);

    // Clouds (decorative, behind everything)
    this.drawCloud(100, 50);
    this.drawCloud(350, 80);
    this.drawCloud(600, 40);
    this.drawCloud(750, 100);

    // Hills in background
    const hills = this.add.graphics();
    hills.fillStyle(0x81C784, 1);
    this.drawHill(hills, 0, height - 80, 200, 80);
    this.drawHill(hills, 180, height - 80, 250, 100);
    this.drawHill(hills, 400, height - 80, 200, 70);
    this.drawHill(hills, 600, height - 80, 300, 90);

    // Create player texture
    this.createRobotTexture('player', this.robotData.color, 32, 48);

    // Create platform texture
    this.createPlatformTexture('platform', 0x8D6E63, 128, 24);
    this.createPlatformTexture('platform-small', 0x8D6E63, 80, 24);
    this.createGroundTexture('ground', 0x4CAF50, 800, 48);

    // Create collectible texture
    this.createGearTexture('gear', 0xFFD700, 20);

    // Platforms (static group)
    this.platforms = this.physics.add.staticGroup();

    // Ground
    this.platforms.create(400, height - 24, 'ground');

    // Floating platforms
    this.platforms.create(150, 440, 'platform');
    this.platforms.create(450, 380, 'platform');
    this.platforms.create(700, 440, 'platform-small');
    this.platforms.create(300, 300, 'platform-small');
    this.platforms.create(600, 280, 'platform');
    this.platforms.create(150, 220, 'platform');
    this.platforms.create(450, 180, 'platform-small');
    this.platforms.create(700, 160, 'platform');

    // Player
    this.player = this.physics.add.sprite(100, height - 100, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.15);

    // Collider
    this.physics.add.collider(this.player, this.platforms);

    // Collectibles
    this.gears = this.physics.add.group();
    const gearPositions = [
      { x: 150, y: 400 }, { x: 450, y: 340 }, { x: 700, y: 400 },
      { x: 300, y: 260 }, { x: 600, y: 240 }, { x: 150, y: 180 },
      { x: 450, y: 140 }, { x: 700, y: 120 },
      { x: 250, y: 500 }, { x: 550, y: 500 }
    ];

    gearPositions.forEach(pos => {
      const gear = this.gears.create(pos.x, pos.y, 'gear');
      gear.setBounce(0.4);
      gear.setCollideWorldBounds(true);
      gear.body.setAllowGravity(false);
    });

    this.physics.add.collider(this.gears, this.platforms);
    this.physics.add.overlap(this.player, this.gears, this.collectGear, null, this);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Score display
    this.scoreText = this.add.text(16, 16, 'Gears: 0', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#333333',
      strokeThickness: 4
    }).setScrollFactor(0);

    // Character name display
    this.add.text(width - 16, 16, this.robotData.name, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 3
    }).setOrigin(1, 0).setScrollFactor(0);

    // Floating animation for gears
    this.gears.getChildren().forEach((gear) => {
      this.tweens.add({
        targets: gear,
        y: gear.y - 8,
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Win message container (hidden initially)
    this.winGroup = this.add.group();
  }

  update() {
    const speed = 200;
    const jumpSpeed = -350;

    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump - only when touching ground
    const onGround = this.player.body.touching.down || this.player.body.blocked.down;
    if ((this.cursors.up.isDown || this.spaceBar.isDown) && onGround) {
      this.player.setVelocityY(jumpSpeed);
    }
  }

  collectGear(player, gear) {
    gear.destroy();
    this.score += 1;
    this.scoreText.setText(`Gears: ${this.score}`);

    // Celebration particles effect
    this.showCollectEffect(gear.x, gear.y);

    // Check if all collected
    if (this.gears.countActive() === 0) {
      this.showWinMessage();
    }
  }

  showCollectEffect(x, y) {
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(x, y, 4, 0xFFD700);
      this.tweens.add({
        targets: particle,
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 80,
        alpha: 0,
        scale: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  showWinMessage() {
    const { width, height } = this.scale;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, width, height);

    this.add.text(width / 2, height / 2 - 40, 'You got all the gears!', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#333333',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, 'Great job, Suleyman!', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 4
    }).setOrigin(0.5);

    const restartText = this.add.text(width / 2, height / 2 + 80, 'Press SPACE to play again!', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#AAAAAA'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.restart();
    });

    // Also allow click to restart
    this.input.once('pointerdown', () => {
      this.scene.restart();
    });
  }

  drawCloud(x, y) {
    const g = this.add.graphics();
    g.fillStyle(0xFFFFFF, 0.7);
    g.fillCircle(x, y, 25);
    g.fillCircle(x + 25, y - 8, 20);
    g.fillCircle(x + 50, y, 25);
    g.fillCircle(x + 25, y + 5, 22);
  }

  drawHill(graphics, x, baseY, w, h) {
    graphics.beginPath();
    graphics.moveTo(x, baseY);
    for (let i = 0; i <= w; i++) {
      const progress = i / w;
      const hillY = baseY - Math.sin(progress * Math.PI) * h;
      graphics.lineTo(x + i, hillY);
    }
    graphics.lineTo(x + w, baseY);
    graphics.closePath();
    graphics.fillPath();
  }

  createRobotTexture(key, color, w, h) {
    const g = this.add.graphics();

    // Body
    g.fillStyle(color, 1);
    g.fillRoundedRect(4, 14, w - 8, h - 22, 4);

    // Head
    g.fillRoundedRect(6, 2, w - 12, 14, 6);

    // Eyes
    g.fillStyle(0xFFEB3B, 1);
    g.fillCircle(w / 2 - 4, 8, 3);
    g.fillCircle(w / 2 + 4, 8, 3);

    // Pupils
    g.fillStyle(0x333333, 1);
    g.fillCircle(w / 2 - 3, 8, 1.5);
    g.fillCircle(w / 2 + 5, 8, 1.5);

    // Antenna
    g.lineStyle(2, color);
    g.lineBetween(w / 2, 2, w / 2, 0);
    g.fillStyle(0xFF5252, 1);
    g.fillCircle(w / 2, 0, 2);

    // Legs
    g.fillStyle(color, 1);
    g.fillRect(8, h - 8, 6, 8);
    g.fillRect(w - 14, h - 8, 6, 8);

    // Chest panel
    g.fillStyle(0x333333, 0.4);
    g.fillRect(w / 2 - 5, 20, 10, 8);
    g.fillStyle(0x4CAF50, 1);
    g.fillCircle(w / 2 - 2, 24, 2);
    g.fillStyle(0xFF5252, 1);
    g.fillCircle(w / 2 + 3, 24, 2);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  createPlatformTexture(key, color, w, h) {
    const g = this.add.graphics();

    // Grass top
    g.fillStyle(0x4CAF50, 1);
    g.fillRect(0, 0, w, 6);

    // Dirt body
    g.fillStyle(color, 1);
    g.fillRect(0, 6, w, h - 6);

    // Darker bottom edge
    g.fillStyle(0x6D4C41, 1);
    g.fillRect(0, h - 3, w, 3);

    // Some texture dots
    g.fillStyle(0x795548, 0.5);
    for (let i = 0; i < 6; i++) {
      g.fillCircle(10 + i * (w / 6), h / 2 + 4, 2);
    }

    g.generateTexture(key, w, h);
    g.destroy();
  }

  createGroundTexture(key, color, w, h) {
    const g = this.add.graphics();

    // Grass top
    g.fillStyle(0x4CAF50, 1);
    g.fillRect(0, 0, w, 8);
    g.fillStyle(0x388E3C, 1);
    g.fillRect(0, 0, w, 4);

    // Dirt
    g.fillStyle(0x8D6E63, 1);
    g.fillRect(0, 8, w, h - 8);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  createGearTexture(key, color, size) {
    const g = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // Outer glow
    g.fillStyle(0xFFF176, 0.4);
    g.fillCircle(cx, cy, size / 2);

    // Gear body
    g.fillStyle(color, 1);
    g.fillCircle(cx, cy, size / 2 - 2);

    // Inner circle
    g.fillStyle(0xFFB300, 1);
    g.fillCircle(cx, cy, size / 4);

    // Star/sparkle
    g.fillStyle(0xFFFFFF, 0.8);
    g.fillCircle(cx - 2, cy - 2, 2);

    g.generateTexture(key, size, size);
    g.destroy();
  }
}
