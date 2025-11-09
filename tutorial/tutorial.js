// Simple open-field tutorial: WASD to move, approach marker -> Yuanyuan speaks,
// enemy appears; approach enemy to see name; press V near enemy to "battle"
// (redirect to index.html).

(() => {
  "use strict";

  // ---------- DOM ----------
  const field = document.getElementById("field");
  const player = document.getElementById("player");
  const enemy = document.getElementById("enemy");
  const enemyLabel = document.getElementById("enemyLabel");
  const hint = document.getElementById("hint");
  const dialogue = document.getElementById("dialogue");
  const text = document.getElementById("text");

  // ---------- Persisted data from Awakening ----------
  const element = (localStorage.getItem("ip.element") || "Fire");
  const animal  = (localStorage.getItem("ip.animal")  || "Wolf");
  enemyLabel.textContent = element + " Lymph";

  // ---------- Scene state ----------
  const bounds = { w: window.innerWidth, h: window.innerHeight };
  const start = { x: bounds.w/2, y: bounds.h*0.58 };
  let pos = { x: start.x, y: start.y };
  const speed = 160; // px/s

  let keys = { w:false, a:false, s:false, d:false };
  let spotted = false;         // after moving enough, Yuanyuan line + reveal enemy
  let enemyVisible = false;
  let canBattle = false;       // when close enough to enemy
  let typing = false, timer = null, full="", shown="", pending=null;

  // ---------- Helpers ----------
  const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));
  function dist(ax,ay,bx,by){ const dx=ax-bx, dy=ay-by; return Math.hypot(dx,dy); }

  function setPlayerPosition(){
    player.style.left = `${pos.x}px`;
    player.style.top  = `${pos.y}px`;
  }
  setPlayerPosition();

  const enemyPos = { x: bounds.w/2, y: bounds.h*0.18 };
  enemy.style.left = `${enemyPos.x}px`;
  enemy.style.top  = `${enemyPos.y}px`;

  function showHint(s){ hint.innerHTML = s; }

  // typewriter (same behavior as fixed awakening: reveal first, then advance)
  function typeLine(str, done){
    clearTimeout(timer);
    typing = true; full=str; shown=""; pending = (typeof done==="function") ? done : null;
    dialogue.classList.remove("hidden");
    text.textContent = "";
    let i=0;
    (function step(){
      if(i>=str.length){
        typing=false;
        if(pending){ const cb=pending; pending=null; cb(); }
        return;
      }
      shown += str[i++];
      text.textContent = shown;
      timer = setTimeout(step, 24);
    })();
  }
  function instantReveal(){
    if(!typing) return false;
    clearTimeout(timer);
    typing=false;
    text.textContent = full;
    // do NOT auto-run pending; it runs on next advance (space/click)
    return true;
  }
  function runPending(){ if(!pending) return false; const cb=pending; pending=null; cb(); return true; }

  function hideDialogue(){ dialogue.classList.add("hidden"); text.textContent=""; }

  // ---------- Movement ----------
  let last = performance.now();
  function loop(now){
    const dt = (now - last)/1000; last = now;

    // Movement (disabled when dialogue visible)
    if (dialogue.classList.contains("hidden")){
      let vx=0, vy=0;
      if(keys.w) vy -= 1;
      if(keys.s) vy += 1;
      if(keys.a) vx -= 1;
      if(keys.d) vx += 1;
      if(vx || vy){
        const inv = 1/Math.hypot(vx||1, vy||1);
        pos.x += vx*speed*inv*dt;
        pos.y += vy*speed*inv*dt;
        pos.x = clamp(pos.x, 24, bounds.w-24);
        pos.y = clamp(pos.y, 24, bounds.h-24);
        setPlayerPosition();
      }
    }

    // Trigger “spotted” after moving ~120px from start (any direction)
    if(!spotted && dist(pos.x,pos.y,start.x,start.y) > 120){
      spotted = true;
      showHint("Move close to the enemy to see its name. Press <b>V</b> to enter battle.");
      enemy.classList.remove("hidden");
      enemyVisible = true;
      typeLine("Oh no, we got spotted! There’s nowhere to run—let’s fight it!", ()=>{ /* wait for player */ });
    }

    // Show enemy label & enable battle when close enough
    if(enemyVisible){
      const d = dist(pos.x,pos.y,enemyPos.x,enemyPos.y);
      if(d < 90){
        enemyLabel.classList.remove("hidden");
        canBattle = true;
      }else{
        enemyLabel.classList.add("hidden");
        canBattle = false;
      }
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- Input ----------
  window.addEventListener("keydown",(e)=>{
    if(e.repeat) return;

    if(e.code==="KeyW") keys.w = true;
    if(e.code==="KeyA") keys.a = true;
    if(e.code==="KeyS") keys.s = true;
    if(e.code==="KeyD") keys.d = true;

    if(e.code==="Space"){
      // advance dialogue (same rule as awakening)
      if(instantReveal()) return;
      if(runPending()) return;
      // if dialogue finished, hide it so WASD works
      if(!dialogue.classList.contains("hidden")) hideDialogue();
    }

    if(e.code==="KeyV"){
      if(canBattle){
        // fade out then go to index.html as requested
        const fade = document.getElementById("fade");
        fade.style.animation = "fadeOut .5s ease forwards";
        setTimeout(()=>{ window.location.href = "../index.html"; }, 520);
      }
    }
  });

  window.addEventListener("keyup",(e)=>{
    if(e.code==="KeyW") keys.w = false;
    if(e.code==="KeyA") keys.a = false;
    if(e.code==="KeyS") keys.s = false;
    if(e.code==="KeyD") keys.d = false;
  });

  // Initial hint
  showHint('Use <b>W A S D</b> to move.');
})();
