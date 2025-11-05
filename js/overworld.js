import { openPanel, showPrompt, hidePrompt, Els } from "./ui.js";

// Simple rectangles as places
const WORLD_W = 1000, WORLD_H = 600;
const viewW = Math.min(1100, window.innerWidth - 20);
const viewH = 520;

const places = {
  battle:   { x: 150, y: 150, w: 220, h: 120, label: "Battle Arena", panel: "#battlePanel" },
  upgrades: { x: 680, y: 140, w: 210, h: 120, label: "Dojo (Upgrades)", panel: "#upgradesPanel" },
  evolve:   { x: 160, y: 420, w: 220, h: 120, label: "Ascension Shrine", panel: "#evolvePanel" },
  codex:    { x: 700, y: 420, w: 210, h: 120, label: "Library (Codex)", panel: "#codexPanel" },
};

export function initWorld() {
  const PhaserRef = window.Phaser;
  const scene = new (class WorldScene extends PhaserRef.Scene {
    constructor(){ super("world"); }
    preload(){}
    create(){
      // background grid
      this.cameras.main.setBackgroundColor("#0c1222");
      const g = this.add.graphics();
      g.fillStyle(0x1a2140, 1).fillRect(0,0,WORLD_W,WORLD_H);
      g.lineStyle(1, 0x2a335c, 0.4);
      for (let x=0; x<=WORLD_W; x+=50) g.strokeLineShape(new PhaserRef.Geom.Line(x,0,x,WORLD_H));
      for (let y=0; y<=WORLD_H; y+=50) g.strokeLineShape(new PhaserRef.Geom.Line(0,y,WORLD_W,y));
      // places
      Object.values(places).forEach(p=>{
        g.fillStyle(0x2b365f, 1).fillRect(p.x, p.y, p.w, p.h);
        g.lineStyle(2, 0x88b4ff, 1).strokeRect(p.x, p.y, p.w, p.h);
        this.add.text(p.x+12, p.y+8, p.label, { fontFamily:"sans-serif", fontSize: "16px", color:"#cfe6ff" });
      });

      // player
      this.player = this.add.rectangle(500, 300, 20, 20, 0x9fe0ff);
      this.physics.add.existing(this.player);
      this.player.body.setCollideWorldBounds(true).setSize(20,20);

      // controls
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys('W,A,S,D,E');
      this.physics.world.setBounds(0,0,WORLD_W,WORLD_H);
      this.cameras.main.setBounds(0,0,WORLD_W,WORLD_H).startFollow(this.player, true, 0.12, 0.12);
    }
    update(){
      const spd = 180, b = this.player.body; b.setVelocity(0);
      const c = this.cursors, k = this.keys;
      if (c.left.isDown || k.A.isDown) b.setVelocityX(-spd);
      else if (c.right.isDown || k.D.isDown) b.setVelocityX(spd);
      if (c.up.isDown || k.W.isDown) b.setVelocityY(-spd);
      else if (c.down.isDown || k.S.isDown) b.setVelocityY(spd);

      const px = this.player.x, py = this.player.y;
      let inZone = null;
      for (const [key,p] of Object.entries(places)) {
        if (px>p.x && px<p.x+p.w && py>p.y && py<p.y+p.h) { inZone = key; break; }
      }

      if (inZone === "battle")   showPrompt("Press [E] to enter the Battle Arena");
      else if (inZone === "upgrades") showPrompt("Press [E] to enter the Dojo (Upgrades)");
      else if (inZone === "evolve")   showPrompt("Press [E] to enter the Ascension Shrine");
      else if (inZone === "codex")    showPrompt("Press [E] to open the Codex Library");
      else hidePrompt();

      if (PhaserRef.Input.Keyboard.JustDown(k.E) && inZone) {
        const sel = places[inZone].panel;
        openPanel(document.querySelector(sel));
      }
    }
  })();

  new PhaserRef.Game({
    type: PhaserRef.AUTO,
    width: viewW,
    height: viewH,
    parent: "game-root",
    physics: { default: "arcade", arcade: { gravity: { y:0 }, debug:false } },
    scene: [scene],
  });
}
