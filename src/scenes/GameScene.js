import Phaser from 'phaser';

const PLATFORM_SLOTS = [
  { x: 150, y: 440, size: 'platform' },
  { x: 450, y: 380, size: 'platform' },
  { x: 700, y: 440, size: 'platform-small' },
  { x: 300, y: 300, size: 'platform-small' },
  { x: 600, y: 280, size: 'platform' },
  { x: 150, y: 220, size: 'platform' },
  { x: 450, y: 180, size: 'platform-small' },
  { x: 700, y: 160, size: 'platform' }
];

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.robotData = data.robot || { name: 'Arlo', color: 0xB0BEC5 };
    this.score = 0;
    this.health = 3;
    this.isInvincible = false;
    this.gameOver = false;
    this.laserCharges = 2;
    this.maxLaserCharges = 2;
    this.laserRecharging = false;
    this.facingRight = true;
  }

  create() {
    const { width, height } = this.scale;

    // Sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xB0E0FF, 0xB0E0FF, 1);
    sky.fillRect(0, 0, width, height);

    // Clouds
    this.drawCloud(100, 50);
    this.drawCloud(350, 80);
    this.drawCloud(600, 40);
    this.drawCloud(750, 100);

    // Hills
    const hills = this.add.graphics();
    hills.fillStyle(0x81C784, 1);
    this.drawHill(hills, 0, height - 80, 200, 80);
    this.drawHill(hills, 180, height - 80, 250, 100);
    this.drawHill(hills, 400, height - 80, 200, 70);
    this.drawHill(hills, 600, height - 80, 300, 90);

    // Create textures
    this.createRobotTexture('player', this.robotData.color, 32, 48);
    this.createPlatformTexture('platform', 0x8D6E63, 128, 24);
    this.createPlatformTexture('platform-small', 0x8D6E63, 80, 24);
    this.createGroundTexture('ground', 0x4CAF50, 800, 48);
    this.createGearTexture('gear', 0xFFD700, 20);
    this.createEnemyTexture('enemy', 24);
    this.createLaserTexture('laser', 24, 6);

    // Ground (permanent)
    this.ground = this.physics.add.staticGroup();
    this.ground.create(400, height - 24, 'ground');

    // Floating platforms (these will disappear/reappear)
    this.platforms = this.physics.add.staticGroup();
    this.floatingPlatforms = [];
    PLATFORM_SLOTS.forEach(slot => {
      const plat = this.platforms.create(slot.x, slot.y, slot.size);
      this.floatingPlatforms.push({ sprite: plat, slot, visible: true });
    });

    // Platform disappear/reappear timer
    this.time.addEvent({
      delay: 3000,
      callback: this.cyclePlatforms,
      callbackScope: this,
      loop: true
    });

    // Player
    this.player = this.physics.add.sprite(100, height - 100, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.15);

    // Colliders
    this.physics.add.collider(this.player, this.ground);
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

    this.physics.add.collider(this.gears, this.ground);
    this.physics.add.collider(this.gears, this.platforms);
    this.physics.add.overlap(this.player, this.gears, this.collectGear, null, this);

    // Enemies
    this.enemies = this.physics.add.group();
    this.spawnEnemies();
    this.physics.add.collider(this.enemies, this.ground);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

    // Lasers
    this.lasers = this.physics.add.group();
    this.physics.add.overlap(this.lasers, this.enemies, this.freezeEnemy, null, this);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    // Keyboard X to shoot
    this.xKey.on('down', () => { if (!this.gameOver) this.shootLaser(); });

    // Gamepad X button to shoot
    this.input.gamepad.on('down', (pad, button) => {
      if (this.gameOver) return;
      // X button is index 2 on standard gamepad mapping
      if (button.index === 2) this.shootLaser();
    });

    // HUD
    this.scoreText = this.add.text(16, 16, 'Gears: 0', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#333333',
      strokeThickness: 4
    }).setScrollFactor(0);

    this.healthIcons = [];
    for (let i = 0; i < 3; i++) {
      const heart = this.add.circle(width - 40 - i * 35, 28, 12, 0xFF5252);
      heart.setScrollFactor(0);
      this.healthIcons.push(heart);
    }

    this.add.text(width - 16, 50, this.robotData.name, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 3
    }).setOrigin(1, 0).setScrollFactor(0);

    // Laser HUD
    this.laserLabel = this.add.text(16, 48, 'LASER', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#00E5FF',
      stroke: '#333333',
      strokeThickness: 2
    }).setScrollFactor(0);

    this.laserIcons = [];
    for (let i = 0; i < this.maxLaserCharges; i++) {
      const icon = this.add.rectangle(70 + i * 22, 55, 16, 8, 0x00E5FF);
      icon.setScrollFactor(0);
      this.laserIcons.push(icon);
    }

    // Recharge bar (hidden until recharging)
    this.rechargeBarBg = this.add.rectangle(16 + 50, 72, 100, 6, 0x333333).setOrigin(0, 0.5).setScrollFactor(0);
    this.rechargeBarFill = this.add.rectangle(16 + 50, 72, 0, 6, 0x00E5FF).setOrigin(0, 0.5).setScrollFactor(0);
    this.rechargeText = this.add.text(16, 66, 'RECHARGING', {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#00E5FF',
      stroke: '#333333',
      strokeThickness: 2
    }).setScrollFactor(0).setAlpha(0);
    this.rechargeBarBg.setAlpha(0);
    this.rechargeBarFill.setAlpha(0);

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
  }

  update() {
    if (this.gameOver) return;

    const speed = 200;
    const jumpSpeed = -350;
    const pad = this.input.gamepad.pad1;

    // Horizontal movement
    const goLeft = this.cursors.left.isDown || (pad && (pad.left || pad.leftStick.x < -0.3));
    const goRight = this.cursors.right.isDown || (pad && (pad.right || pad.leftStick.x > 0.3));

    if (goLeft) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      this.facingRight = false;
    } else if (goRight) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      this.facingRight = true;
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    const onGround = this.player.body.touching.down || this.player.body.blocked.down;
    const padJump = pad && (pad.A || pad.up || pad.leftStick.y < -0.5);
    if ((this.cursors.up.isDown || this.spaceBar.isDown || padJump) && onGround) {
      this.player.setVelocityY(jumpSpeed);
    }

    // Enemy patrol AI (skip frozen enemies)
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.getData('frozen')) return;
      if (enemy.x <= enemy.getData('leftBound')) {
        enemy.setVelocityX(enemy.getData('speed'));
      } else if (enemy.x >= enemy.getData('rightBound')) {
        enemy.setVelocityX(-enemy.getData('speed'));
      }
    });
  }

  spawnEnemies() {
    const enemyDefs = [
      { x: 400, y: 520, left: 300, right: 500, spd: 60 },
      { x: 600, y: 250, left: 540, right: 660, spd: 50 },
      { x: 200, y: 190, left: 100, right: 280, spd: 45 },
      { x: 500, y: 350, left: 400, right: 520, spd: 55 },
    ];

    enemyDefs.forEach(def => {
      const enemy = this.enemies.create(def.x, def.y, 'enemy');
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true);
      enemy.body.setAllowGravity(true);
      enemy.setData('leftBound', def.left);
      enemy.setData('rightBound', def.right);
      enemy.setData('speed', def.spd);
      enemy.setData('frozen', false);
      enemy.setVelocityX(def.spd);
    });
  }

  shootLaser() {
    if (this.laserCharges <= 0 || this.laserRecharging) return;

    this.laserCharges -= 1;
    this.updateLaserHUD();

    // Create laser projectile
    const dir = this.facingRight ? 1 : -1;
    const offsetX = dir * 20;
    const laser = this.lasers.create(this.player.x + offsetX, this.player.y, 'laser');
    laser.body.setAllowGravity(false);
    laser.setVelocityX(dir * 500);
    if (dir < 0) laser.setFlipX(true);

    // Destroy laser after 1 second if it doesn't hit anything
    this.time.delayedCall(1000, () => {
      if (laser.active) laser.destroy();
    });

    // Start recharge if out of charges
    if (this.laserCharges === 0) {
      this.startRecharge();
    }
  }

  freezeEnemy(laser, enemy) {
    laser.destroy();

    if (enemy.getData('frozen')) return;

    // Freeze the enemy
    enemy.setData('frozen', true);
    enemy.setVelocityX(0);
    enemy.setTint(0x00E5FF);

    // Freeze effect — ice particles
    for (let i = 0; i < 6; i++) {
      const particle = this.add.circle(
        enemy.x + (Math.random() - 0.5) * 20,
        enemy.y + (Math.random() - 0.5) * 20,
        3, 0x00E5FF
      );
      this.tweens.add({
        targets: particle,
        y: particle.y - 30,
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }

    // Unfreeze after 8 seconds
    this.time.delayedCall(8000, () => {
      if (enemy.active) {
        enemy.setData('frozen', false);
        enemy.clearTint();
        enemy.setVelocityX(enemy.getData('speed'));
      }
    });
  }

  startRecharge() {
    this.laserRecharging = true;
    this.rechargeText.setAlpha(1);
    this.rechargeBarBg.setAlpha(1);
    this.rechargeBarFill.setAlpha(1);
    this.rechargeBarFill.width = 0;

    // Animate the recharge bar over 5 seconds
    this.tweens.add({
      targets: this.rechargeBarFill,
      width: 100,
      duration: 5000,
      ease: 'Linear',
      onComplete: () => {
        this.laserCharges = this.maxLaserCharges;
        this.laserRecharging = false;
        this.rechargeText.setAlpha(0);
        this.rechargeBarBg.setAlpha(0);
        this.rechargeBarFill.setAlpha(0);
        this.updateLaserHUD();
      }
    });

    // Flash the recharge text
    this.tweens.add({
      targets: this.rechargeText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: 9
    });
  }

  updateLaserHUD() {
    this.laserIcons.forEach((icon, i) => {
      icon.setFillStyle(i < this.laserCharges ? 0x00E5FF : 0x333333);
    });
  }

  cyclePlatforms() {
    if (this.gameOver) return;

    // Pick 2-3 random platforms to toggle
    const count = Phaser.Math.Between(2, 3);
    const indices = Phaser.Utils.Array.Shuffle(
      Array.from({ length: this.floatingPlatforms.length }, (_, i) => i)
    ).slice(0, count);

    indices.forEach(i => {
      const p = this.floatingPlatforms[i];
      if (p.visible) {
        // Fade out and disable
        this.tweens.add({
          targets: p.sprite,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            p.sprite.disableBody(true, true);
            p.visible = false;
          }
        });
      } else {
        // Re-enable at a new random Y within a range, or same spot
        const newY = p.slot.y + Phaser.Math.Between(-40, 40);
        const clampedY = Phaser.Math.Clamp(newY, 140, 460);
        p.sprite.enableBody(true, p.slot.x, clampedY, true, true);
        p.sprite.setAlpha(0);
        p.sprite.refreshBody();
        p.visible = true;
        this.tweens.add({
          targets: p.sprite,
          alpha: 1,
          duration: 400
        });
      }
    });
  }

  hitEnemy(player, enemy) {
    if (this.isInvincible || this.gameOver) return;

    this.health -= 1;
    this.updateHealthDisplay();

    // Knockback
    const knockDir = player.x < enemy.x ? -1 : 1;
    player.setVelocityX(knockDir * 250);
    player.setVelocityY(-200);

    // Invincibility frames
    this.isInvincible = true;
    this.tweens.add({
      targets: player,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        player.setAlpha(1);
        this.isInvincible = false;
      }
    });

    // Screen shake
    this.cameras.main.shake(200, 0.01);

    if (this.health <= 0) {
      this.showGameOver();
    }
  }

  updateHealthDisplay() {
    this.healthIcons.forEach((icon, i) => {
      icon.setFillStyle(i < this.health ? 0xFF5252 : 0x333333);
    });
  }

  collectGear(player, gear) {
    gear.destroy();
    this.score += 1;
    this.scoreText.setText(`Gears: ${this.score}`);
    this.showCollectEffect(gear.x, gear.y);

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

  showGameOver() {
    this.gameOver = true;
    this.player.setVelocityX(0);
    this.physics.pause();

    const { width, height } = this.scale;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);

    this.add.text(width / 2, height / 2 - 40, 'Oh no!', {
      fontSize: '42px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#FF5252',
      stroke: '#333333',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 10, `You collected ${this.score} gears!`, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.showRestartPrompt(height);
  }

  showWinMessage() {
    this.gameOver = true;
    this.player.setVelocityX(0);

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

    this.showRestartPrompt(height);
  }

  showRestartPrompt(height) {
    const { width } = this.scale;

    const restartText = this.add.text(width / 2, height / 2 + 80, 'Press any button to play again!', {
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

    // Keyboard restart
    this.input.keyboard.once('keydown', () => {
      this.scene.restart();
    });

    // Click/touch restart
    this.input.once('pointerdown', () => {
      this.scene.restart();
    });

    // Gamepad restart — any button
    this.input.gamepad.once('down', () => {
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
    g.fillStyle(color, 1);
    g.fillRoundedRect(4, 14, w - 8, h - 22, 4);
    g.fillRoundedRect(6, 2, w - 12, 14, 6);
    g.fillStyle(0xFFEB3B, 1);
    g.fillCircle(w / 2 - 4, 8, 3);
    g.fillCircle(w / 2 + 4, 8, 3);
    g.fillStyle(0x333333, 1);
    g.fillCircle(w / 2 - 3, 8, 1.5);
    g.fillCircle(w / 2 + 5, 8, 1.5);
    g.lineStyle(2, color);
    g.lineBetween(w / 2, 2, w / 2, 0);
    g.fillStyle(0xFF5252, 1);
    g.fillCircle(w / 2, 0, 2);
    g.fillStyle(color, 1);
    g.fillRect(8, h - 8, 6, 8);
    g.fillRect(w - 14, h - 8, 6, 8);
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
    g.fillStyle(0x4CAF50, 1);
    g.fillRect(0, 0, w, 6);
    g.fillStyle(color, 1);
    g.fillRect(0, 6, w, h - 6);
    g.fillStyle(0x6D4C41, 1);
    g.fillRect(0, h - 3, w, 3);
    g.fillStyle(0x795548, 0.5);
    for (let i = 0; i < 6; i++) {
      g.fillCircle(10 + i * (w / 6), h / 2 + 4, 2);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  createGroundTexture(key, color, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x4CAF50, 1);
    g.fillRect(0, 0, w, 8);
    g.fillStyle(0x388E3C, 1);
    g.fillRect(0, 0, w, 4);
    g.fillStyle(0x8D6E63, 1);
    g.fillRect(0, 8, w, h - 8);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  createGearTexture(key, color, size) {
    const g = this.add.graphics();
    const cx = size / 2;
    const cy = size / 2;
    g.fillStyle(0xFFF176, 0.4);
    g.fillCircle(cx, cy, size / 2);
    g.fillStyle(color, 1);
    g.fillCircle(cx, cy, size / 2 - 2);
    g.fillStyle(0xFFB300, 1);
    g.fillCircle(cx, cy, size / 4);
    g.fillStyle(0xFFFFFF, 0.8);
    g.fillCircle(cx - 2, cy - 2, 2);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  createEnemyTexture(key, size) {
    const g = this.add.graphics();
    // Spiky bug body
    g.fillStyle(0x9C27B0, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 2);
    // Angry eyes
    g.fillStyle(0xFF1744, 1);
    g.fillCircle(size / 2 - 4, size / 2 - 3, 3);
    g.fillCircle(size / 2 + 4, size / 2 - 3, 3);
    // Pupils
    g.fillStyle(0x000000, 1);
    g.fillCircle(size / 2 - 3, size / 2 - 3, 1.5);
    g.fillCircle(size / 2 + 5, size / 2 - 3, 1.5);
    // Spikes
    g.fillStyle(0x7B1FA2, 1);
    g.fillTriangle(size / 2, 0, size / 2 - 4, 6, size / 2 + 4, 6);
    g.fillTriangle(0, size / 2, 6, size / 2 - 4, 6, size / 2 + 4);
    g.fillTriangle(size, size / 2, size - 6, size / 2 - 4, size - 6, size / 2 + 4);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  createLaserTexture(key, w, h) {
    const g = this.add.graphics();
    // Glow
    g.fillStyle(0x00E5FF, 0.3);
    g.fillRoundedRect(0, 0, w, h, 3);
    // Core beam
    g.fillStyle(0x00E5FF, 1);
    g.fillRoundedRect(2, 1, w - 4, h - 2, 2);
    // Bright center
    g.fillStyle(0xFFFFFF, 0.8);
    g.fillRoundedRect(4, 2, w - 8, h - 4, 1);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
