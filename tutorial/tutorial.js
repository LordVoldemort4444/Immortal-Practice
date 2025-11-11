// Tutorial: Path of Resonance (walking + space-advanced dialogue)
// - Space/click fast-skip preserved (instant reveal → advance smoothly)
// - Quest instruction shown as text; no visible world marker
// - First line exactly as specified (no teaser)
// - Redirect to ../index.html only when: dialogue finished AND player overlaps the (invisible) marker

(() => {
  "use strict";

  // ---------- DOM ----------
  const playerEl   = document.getElementById("player");
  const markerEl   = document.getElementById("marker");
  const distanceEl = document.getElementById("distance");
  const dialogueEl = document.getElementById("dialogue");
  const textEl     = document.getElementById("text");
  const fadeEl     = document.getElementById("fade");

  // ---------- Saved profile ----------
  const element = localStorage.getItem("ip.element") || "Wood";
  const animal  = localStorage.getItem("ip.animal")  || "Wolf";

  // Element chart
  const EREL = {
    Wood:  { strong:"Earth", weak:"Fire"  },
    Fire:  { strong:"Metal", weak:"Earth" },
    Earth: { strong:"Water", weak:"Metal" },
    Metal: { strong:"Wood",  weak:"Water" },
    Water: { strong:"Fire",  weak:"Wood"  }
  };
  const animalStat = {
    Wolf:    { hi:"Attack",    lo:"Resonance" },
    Fox:     { hi:"Speed",     lo:"Defense"   },
    Bear:    { hi:"HP",        lo:"Speed"     },
    Bird:    { hi:"Resonance", lo:"HP"        },
    Serpent: { hi:"Defense",   lo:"Attack"    },
  };

  const elemStrong = EREL[element]?.strong || "—";
  const elemWeak   = EREL[element]?.weak   || "—";
  const hiStat     = (animalStat[animal]||{}).hi || "—";
  const loStat     = (animalStat[animal]||{}).lo || "—";

  // ---------- Dialogue lines (first line EXACT) ----------
  const L = [
    `As a spirit before you awaken, you really do contain a lot of resonance to this land! You are a ${element} ${animal}.`,
    `Your elemental type defines your elemental moves.`,
    `Each element is weak to one element, and is also strong to one element.`,
    `This means that you deal more damage to one element, but also loses more health to another element.`,
    `You can refer to the chart after the tutorial to know more about elemental resonance.`,
    `Your animal type defines your animalistic moves.`,
    `Each animal has an advantageous stat and a disadvantageous stat.`,
    `This means that one specific stat has a higher base stat than other animals, and another specific stat has a lower base stat than other animals.`,
    `You can refer to the table after the tutorial to know more about animal types.`,
    `You have a ${element} type. This means you are weak to ${elemWeak}, and strong against ${elemStrong}.`,
    `You are a ${animal}. This means you have a higher ${hiStat}, and lower ${loStat}.`,
    `Take a look at your current stats.`,
    `HP refers to the amount of hitpoints you have. You will faint and teleport to the nearest portal if you lose all HP.`,
    `Attack affects how much damage you deal.`,
    `Defense affects how much damage you receive.`,
    `Speed affects how fast you attack and defend.`,
    `Resonance affects the Qi and your elemental reactions.`,
    `Stats increase naturally as your character is upgraded.`
  ];

  // ---------- Positions & movement ----------
  const bounds = { w: window.innerWidth, h: window.innerHeight };
  let pos = { x: bounds.w * 0.16, y: bounds.h * 0.72 };
  const speed = 160; // px/s
  let keys = { w:false, a:false, s:false, d:false };

  function setPlayerPosition(){
    playerEl.style.left = `${pos.x}px`;
    playerEl.style.top  = `${pos.y}px`;
  }
  setPlayerPosition();

  function elCenter(el){
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  }

  function isOverlap(aEl, bEl){
    const a = aEl.getBoundingClientRect();
    const b = bEl.getBoundingClientRect();
    return (a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top);
  }

  // Distance (visual only)
  function updateDistance(){
    const pc = elCenter(playerEl);
    const mc = elCenter(markerEl);
    const d  = Math.hypot(mc.x - pc.x, mc.y - pc.y);
    distanceEl.innerHTML = `Distance to destination: <b>${Math.max(0, Math.round(d))} m</b>`;
  }
  updateDistance();

  // ---------- Typewriter with fast-skip ----------
  let typing=false, t=null, full="", shown="", pending=null, idx=0;

  function typeLine(s, cb){
    clearTimeout(t);
    typing=true; full=s; shown=""; pending=(typeof cb==="function")?cb:null;
    textEl.textContent=""; let i=0;
    (function step(){
      if(i>=s.length){ typing=false; return; } // pending runs on user press
      shown += s[i++]; textEl.textContent = shown;
      t=setTimeout(step, 18);
    })();
  }

  // Fast-skip flow:
  // 1) typing -> reveal
  // 2) else if pending -> run & immediately advance
  // 3) else -> advance
  function onAdvancePress(){
    if(typing){
      clearTimeout(t); typing=false; textEl.textContent = full; return;
    }
    if(pending){
      const cb = pending; pending=null; cb();
      advanceDialogue(); // immediate step
      return;
    }
    advanceDialogue();
  }

  function showCurrent(){
    typeLine(L[idx], ()=>{/* stored; executed on press */});
  }

  let reachedMarker = false;
  let dialogueFinished = false;

  function advanceDialogue(){
    if (idx < L.length - 1){
      idx++;
      showCurrent();
    } else {
      dialogueFinished = true;
      tryFinish();
    }
  }

  function tryFinish(){
    if (reachedMarker && dialogueFinished){
      fadeEl.style.animation = "fadeOut .5s ease forwards";
      setTimeout(()=>{ window.location.href = "../index.html"; }, 520);
    }
  }

  // ---------- Loop ----------
  let last = performance.now();
  function loop(now){
    const dt = (now - last)/1000; last = now;

    let vx=0, vy=0;
    if(keys.w) vy -= 1;
    if(keys.s) vy += 1;
    if(keys.a) vx -= 1;
    if(keys.d) vx += 1; 
    if(vx || vy){
      const inv = 1/Math.hypot(vx||1, vy||1);
      pos.x += vx*speed*inv*dt;
      pos.y += vy*speed*inv*dt;
      pos.x = Math.max(12, Math.min(bounds.w-12, pos.x));
      pos.y = Math.max(12, Math.min(bounds.h-12, pos.y));
      setPlayerPosition();
    }

    updateDistance();

    const overlap = isOverlap(playerEl, markerEl);
    if (overlap && !reachedMarker){
      reachedMarker = true;
      tryFinish();
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- Inputs ----------
  window.addEventListener("keydown",(e)=>{
    if(e.repeat) return;

    if(e.code==="KeyW") keys.w = true;
    if(e.code==="KeyA") keys.a = true;
    if(e.code==="KeyS") keys.s = true;
    if(e.code==="KeyD") keys.d = true;

    if(e.code==="Space"){
      onAdvancePress();
    }
  });

  window.addEventListener("keyup",(e)=>{
    if(e.code==="KeyW") keys.w = false;
    if(e.code==="KeyA") keys.a = false;
    if(e.code==="KeyS") keys.s = false;
    if(e.code==="KeyD") keys.d = false;
  });

  // Clicking the dialogue panel acts like Space
  dialogueEl.addEventListener("click", onAdvancePress);

  // ---------- Start ----------
  showCurrent();
})();
