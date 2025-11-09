// awakening/awakening.js
// Space + optional click advance, constant hint in HTML,
// instant reveal now defers the callback to the *next* advance,
// choices/form block space/click, must cover three topics,
// corrected 1-on-1 sequence and gated Shrine/Who lines.

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
  // intro -> name -> dialogue -> oneOnOne -> attuneLead -> result -> exit
  let state = "intro";
  let typing = false;
  let typeTimer = null;
  let currentFull = "";
  let shown = "";
  let introIndex = 0;
  let playerName = "";
  let yuanyuanRevealed = false;

  // NEW: defer callbacks after instant reveal
  let pendingAfter = null;

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
    pendingAfter = (typeof done === "function") ? done : null; // store for later
    elText.classList.add("show");
    elText.textContent = "";
    let i = 0;
    (function step(){
      if (i >= str.length){
        typing = false;
        // If user *didn't* instant reveal, run callback now
        if (pendingAfter){
          const cb = pendingAfter;
          pendingAfter = null;
          cb();
        }
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
    // IMPORTANT: do NOT run the callback now.
    // Leave pendingAfter set; it will run on the *next* advance.
    return true;
  }

  function runPendingIfAny(){
    if (!pendingAfter) return false;
    const cb = pendingAfter;
    pendingAfter = null;
    cb();
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
    if (instantReveal()) return;          // first press: reveal
    if (runPendingIfAny()) return;        // second press: run after
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

  // ---------- Dialogue Hub ----------
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
        explainShrineThenOfferRemaining();
        break;

      case "who":
        asked.who = true;
        revealYuanyuan(offerRemainingChoices);
        break;

      case "replyOneOnOne":
        oneOnOne_ThatStrange();
        break;

      case "continue":
        proceedIfAllCovered();
        break;
    }
  }

  function lineDanger(){
    typeText("\"You don't remember? This place is very dangerous, it's very close to the Shrine, tightly guarded by the Void.\"", ()=>{
      offerRemainingChoices();
    });
  }

  function offerRemainingChoices(){
    if (allCovered()){ startOneOnOne(); return; }
    const opts = [];
    if (!asked.shrine) opts.push({ text: "\"What Shrine? What's the Void?\"", key: "shrine" });
    if (!asked.who)    opts.push({ text: "\"Who are you?\"", key: "who" });
    setChoices(opts);
  }

  function explainShrineThenOfferRemaining(){
    typeText("\"The Shrine is where the Void gathers strength. We shouldn't stay—this path isn't safe.\"", ()=>{
      offerRemainingChoices();
    });
  }

  function revealYuanyuan(cb){
    yuanyuanRevealed = true;
    typeText("\"...Oh—right. I haven't introduced myself. They call me Yuanyuan... 源緣.\"", ()=>{
      if (cb) cb();
    });
  }

  function allCovered(){ return asked.remember && asked.shrine && asked.who; }

  // ---------- 1-on-1 Sequence ----------
  function startOneOnOne(){
    state = "oneOnOne";
    typeText("\"You don't know about the Shrine? Do you even live here? Have you ever heard of the Void?\"", ()=>{
      setChoices([{ text: "\"I somehow know a little bit, but I don't really know why I am here.\"", key: "replyOneOnOne" }]);
    });
  }

  function oneOnOne_ThatStrange(){
    elChoices.innerHTML = "";
    typeText("\"That's strange. But it's okay, if you're just a traveller, why don't I help you navigate this place? I've been here for quite some time. But let us get out of this place first!\"", ()=>{
      beginAttuneLead();
    });
  }

  function proceedIfAllCovered(){
    if (!allCovered()){ offerRemainingChoices(); return; }
    startOneOnOne();
  }

  // ---------- Attunement & Result ----------
  function beginAttuneLead(){
    state = "attuneLead";
    typeText("\"Your Qi is still forming. Let me attune you to the flow of Lingjie...\"\n\n(Resonance stirring...)", ()=>{
      state = "result";
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
    if (isFormOpen()) return false;
    if (choicesVisible() && (state==="dialogue" || state==="oneOnOne")) return false;
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

    // First try to reveal; if not revealing, try to run pending callback; else advance state.
    if (instantReveal()) return;
    if (runPendingIfAny()) return;

    switch(state){
      case "intro":       advanceIntro(); break;
      case "name":        /* ignore; submit form */ break;
      case "dialogue":    /* buttons only */ break;
      case "oneOnOne":    /* buttons only */ break;
      case "attuneLead":  /* wait; will switch to 'result' after typing */ break;
      case "result":      showResult(); break;
      case "exit":        exitScene(); break;
    }
  });

  // Click (like prologue). Ignored when form/choices visible.
  window.addEventListener("click", (e)=>{
    if (e.target.closest(".name-form") || e.target.closest(".choice")) return;
    if (!canAdvanceByKeyOrClick()) return;

    if (instantReveal()) return;
    if (runPendingIfAny()) return;

    switch(state){
      case "intro":       advanceIntro(); break;
      case "name":        /* ignore */ break;
      case "dialogue":    /* buttons only */ break;
      case "oneOnOne":    /* buttons only */ break;
      case "attuneLead":  /* wait */ break;
      case "result":      showResult(); break;
      case "exit":        exitScene(); break;
    }
  });

  // ---------- Start ----------
  startIntro();
})();
