// awakening/awakening.js
// Space + optional click advance (like prologue), robust callbacks on instant reveal,
// constant hint, choices/form block space/click, all three topics required before progress,
// guaranteed Yuanyuan reveal.

(() => {
  "use strict";

  // ---------- Config ----------
  const TYPE_SPEED = 28;
  const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"];
  const ANIMALS  = ["Wolf", "Fox", "Bear", "Bird", "Serpent"];
  const ELEMENT_BG = {
    Wood:  "linear-gradient(120deg,#0f1f12,#132516,#0f1f12)",
    Fire:  "linear-gradient(120deg,#2a0e0e,#3a1310,#2a0e0e)",
    Earth: "linear-gradient(120deg,#19160e,#241f12,#19160e)",
    Metal: "linear-gradient(120deg,#0e1419,#121b24,#0e1419)",
    Water: "linear-gradient(120deg,#0b1621,#0f1d2b,#0b1621)"
  };

  // ---------- DOM ----------
  const elText    = document.getElementById("text");
  const elChoices = document.getElementById("choices");
  const elForm    = document.getElementById("nameForm");
  const elInput   = document.getElementById("playerName");
  const elBg      = document.getElementById("bg");

  // ---------- State ----------
  // intro -> name -> dialogue -> attuneLead -> result -> exit
  let state = "intro";
  let typing = false;
  let typeTimer = null;
  let currentFull = "";
  let shown = "";
  let afterCallback = null; // <-- NEW: run this even if we instant-reveal
  let introIndex = 0;
  let playerName = "";
  let yuanyuanRevealed = false;
  const asked = { remember: false, shrine: false, who: false };

  const introLines = [
    "-- The world is quiet. Leaves whisper overhead. --",
    "A soft light hovers nearby.",
    "\"Are you alive? Are you awake?\""
  ];

  // ---------- Utils ----------
  function clearTimer(){ if (typeTimer) clearTimeout(typeTimer); typeTimer = null; }

  function typeText(str, done){
    clearTimer();
    typing = true;
    currentFull = str;
    shown = "";
    afterCallback = (typeof done === "function") ? done : null;
    elText.classList.add("show");
    elText.textContent = "";
    let i = 0;
    (function step(){
      if (i >= str.length){
        typing = false;
        const cb = afterCallback; afterCallback = null;
        if (cb) cb();
        return;
      }
      shown += str[i++];
      elText.textContent = shown;
      typeTimer = setTimeout(step, TYPE_SPEED);
    })();
  }

  function instantReveal(){
    if (!typing) return false;
    clearTimer();
    typing = false;
    elText.textContent = currentFull;
    // IMPORTANT: also run the pending post-line callback now.
    const cb = afterCallback; afterCallback = null;
    if (cb) cb();
    return true;
  }

  function isFormOpen(){ return elForm && elForm.style.display === "flex"; }
  function choicesVisible(){ return elChoices && elChoices.children.length > 0; }

  function setChoices(list){
    elChoices.innerHTML = "";
    list.forEach(opt=>{
      const b = document.createElement("button");
      b.className = "choice";
      b.type = "button";
      b.textContent = opt.text;
      b.addEventListener("click", (e)=>{ e.stopPropagation(); handleChoice(opt.key); });
      elChoices.appendChild(b);
    });
  }

  // ---------- Intro ----------
  function startIntro(){
    state = "intro";
    introIndex = 0;
    typeText(introLines[0]);
  }

  function advanceIntro(){
    if (instantReveal()) return;
    introIndex++;
    if (introIndex < introLines.length){
      elText.classList.remove("show");
      setTimeout(()=> typeText(introLines[introIndex]), 80);
    } else {
      state = "name";
      askName();
    }
  }

  function askName(){
    typeText("\"What's your name?\"", ()=>{
      elForm.style.display = "flex";
      elInput.value = "";
      elInput.focus();
    });
  }

  elForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const val = (elInput.value || "").trim();
    playerName = val || "Traveller";
    elForm.style.display = "none";
    startDialogue();
  });

  // ---------- Dialogue ----------
  function startDialogue(){
    state = "dialogue";
    typeText("\"Why are you here, sleeping under the tree?\"", ()=>{
      setChoices([{ text: "\"...I don't remember.\"", key: "remember" }]);
    });
  }

  function handleChoice(key){
    elChoices.innerHTML = "";
    switch(key){
      case "remember":
        asked.remember = true;
        lineDanger();
        break;

      case "shrine":
        asked.shrine = true;
        afterTopicBranch();
        break;

      case "who":
        asked.who = true;
        revealYuanyuan(afterTopicBranch);
        break;

      case "continue":
        proceedIfAllCovered();
        break;
    }
  }

  function lineDanger(){
    typeText("\"You don't remember? This place is very dangerous, it's very close to the Shrine, tightly guarded by the Void.\"", ()=>{
      const opts = [];
      if (!asked.shrine) opts.push({ text: "\"What Shrine? What's the Void?\"", key: "shrine" });
      if (!asked.who)    opts.push({ text: "\"Who are you?\"", key: "who" });
      setChoices(opts);
    });
  }

  function afterTopicBranch(){
    if (allCovered()){ readyToLeave(); return; }
    typeText("\"The Shrine is where the Void gathers strength. We shouldn't stay—this path isn't safe.\"", ()=>{
      const opts = [];
      if (!asked.who)    opts.push({ text: "\"Who are you?\"", key: "who" });
      if (!asked.shrine) opts.push({ text: "\"What Shrine? What's the Void?\"", key: "shrine" });
      if (opts.length === 0) opts.push({ text: "\"Let's go.\"", key: "continue" });
      setChoices(opts);
    });
  }

  function revealYuanyuan(cb){
    yuanyuanRevealed = true;
    typeText("\"...Oh—right. I haven't introduced myself. They call me Yuanyuan... 源緣.\"", ()=>{ if (cb) cb(); });
  }

  function allCovered(){ return asked.remember && asked.shrine && asked.who; }

  function readyToLeave(){
    if (!yuanyuanRevealed){
      revealYuanyuan(()=> lineOfferHelp());
    } else {
      lineOfferHelp();
    }
  }

  function lineOfferHelp(){
    typeText("\"That's strange. But it's okay—if you're just a traveller, why don't I help you navigate this place? I've been here for quite some time. But let us get out of this place first!\"", ()=>{
      setChoices([{ text: "\"Alright.\"", key: "continue" }]);
    });
  }

  function proceedIfAllCovered(){
    if (!allCovered()){ afterTopicBranch(); return; }
    elChoices.innerHTML = "";
    beginAttuneLead();
  }

  // ---------- Attunement & Result ----------
  function beginAttuneLead(){
    state = "attuneLead";
    typeText("\"Your Qi is still forming. Let me attune you to the flow of Lingjie...\"\n\n(Resonance stirring...)", ()=>{
      state = "result";
      // Space/click will move to showResult
    });
  }

  function showResult(){
    const element = ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)];
    const animal  = ANIMALS[Math.floor(Math.random()*ANIMALS.length)];
    if (ELEMENT_BG[element]) elBg.style.background = ELEMENT_BG[element];

    typeText("-- Resonance stirs through the leaves and stone. --\n\nYou are now a " + element + " " + animal + ".", ()=>{
      state = "exit";
    });
  }

  function exitScene(){
    window.location.href = "../index.html";
  }

  // ---------- Input (Space + guarded click) ----------
  function canAdvanceByKeyOrClick(){
    if (isFormOpen()) return false;           // must submit form
    if (choicesVisible() && state==="dialogue") return false; // must click a choice
    return true;
  }

  // Space
  let lastKey = 0;
  window.addEventListener("keydown", (e)=>{
    if (e.code !== "Space") return;
    const now = Date.now();
    if (now - lastKey < 60) return; // debounce
    lastKey = now;

    if (!canAdvanceByKeyOrClick()) return;

    if (instantReveal()) return;

    switch(state){
      case "intro":       advanceIntro(); break;
      case "name":        /* do nothing */ break;
      case "dialogue":    /* choices only */ break;
      case "attuneLead":  /* wait for typing; when done state becomes 'result' */ break;
      case "result":      showResult(); break;
      case "exit":        exitScene(); break;
    }
  });

  // Click (for consistency with prologue): ignored when form/choices visible
  window.addEventListener("click", (e)=>{
    if (e.target.closest(".name-form") || e.target.closest(".choice")) return;
    if (!canAdvanceByKeyOrClick()) return;
    if (instantReveal()) return;

    switch(state){
      case "intro":       advanceIntro(); break;
      case "name":        /* do nothing */ break;
      case "dialogue":    /* choices only */ break;
      case "attuneLead":  /* wait */ break;
      case "result":      showResult(); break;
      case "exit":        exitScene(); break;
    }
  });

  // ---------- Start ----------
  startIntro();
})();
