// awakening/awakening.js
// Space-only advance, robust state machine, no hint override, buttons required for choices,
// must cover all three topics before progress, guaranteed Yuanyuan reveal.

(() => {
  "use strict";

  // ---------------- Config ----------------
  const TYPE_SPEED = 28; // ms per character
  const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"];
  const ANIMALS  = ["Wolf", "Fox", "Bear", "Bird", "Serpent"];
  const ELEMENT_BG = {
    Wood:  "linear-gradient(120deg,#0f1f12,#132516,#0f1f12)",
    Fire:  "linear-gradient(120deg,#2a0e0e,#3a1310,#2a0e0e)",
    Earth: "linear-gradient(120deg,#19160e,#241f12,#19160e)",
    Metal: "linear-gradient(120deg,#0e1419,#121b24,#0e1419)",
    Water: "linear-gradient(120deg,#0b1621,#0f1d2b,#0b1621)"
  };

  // ---------------- DOM ----------------
  const elText    = document.getElementById("text");
  const elChoices = document.getElementById("choices");
  const elForm    = document.getElementById("nameForm");
  const elInput   = document.getElementById("playerName");
  const elBg      = document.getElementById("bg");
  // NOTE: we do NOT touch #hint text anymore; it remains "Press Space to continue".

  // ---------------- State ----------------
  // intro -> name -> dialogue -> attuneLead -> result -> exit
  let state = "intro";
  let typing = false;
  let typeTimer = null;
  let currentFull = "";
  let currentShown = "";
  let introIndex = 0;
  let playerName = "";
  let yuanyuanRevealed = false;

  // topics the player must ask
  const asked = { remember: false, shrine: false, who: false };

  // ---------------- Script ----------------
  const introLines = [
    "-- The world is quiet. Leaves whisper overhead. --",
    "A soft light hovers nearby.",
    "\"Are you alive? Are you awake?\""
  ];

  // ---------------- Utils ----------------
  function clearTimer() {
    if (typeTimer) clearTimeout(typeTimer);
    typeTimer = null;
  }

  function typeText(str, done) {
    clearTimer();
    typing = true;
    currentFull = str;
    currentShown = "";
    elText.classList.add("show");
    elText.textContent = "";
    let i = 0;
    (function step() {
      if (i >= str.length) {
        typing = false;
        if (typeof done === "function") done();
        return;
      }
      currentShown += str[i++];
      elText.textContent = currentShown;
      typeTimer = setTimeout(step, TYPE_SPEED);
    })();
  }

  function finishTyping() {
    if (!typing) return false;
    clearTimer();
    typing = false;
    elText.textContent = currentFull;
    return true;
  }

  function isNameFormOpen() {
    return elForm && elForm.style.display === "flex";
  }

  function setChoices(list) {
    elChoices.innerHTML = "";
    list.forEach(opt => {
      const b = document.createElement("button");
      b.className = "choice";
      b.type = "button";
      b.textContent = opt.text;
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        handleChoice(opt.key);
      });
      elChoices.appendChild(b);
    });
  }

  // ---------------- Intro Flow ----------------
  function startIntro() {
    state = "intro";
    introIndex = 0;
    typeText(introLines[0]);
  }

  function advanceIntro() {
    if (finishTyping()) return; // only finish line if mid-typing
    introIndex++;
    if (introIndex < introLines.length) {
      elText.classList.remove("show");
      setTimeout(() => typeText(introLines[introIndex]), 80);
    } else {
      state = "name";
      showNamePrompt();
    }
  }

  function showNamePrompt() {
    typeText("\"What's your name?\"", () => {
      elForm.style.display = "flex"; // we do NOT change the global hint text
      elInput.value = "";
      elInput.focus();
    });
  }

  elForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = (elInput.value || "").trim();
    playerName = val || "Traveller";
    elForm.style.display = "none";
    startDialogue();
  });

  // ---------------- Dialogue Flow ----------------
  function startDialogue() {
    state = "dialogue";
    // Q1
    typeText("\"Why are you here, sleeping under the tree?\"", () => {
      setChoices([{ text: "\"...I don't remember.\"", key: "remember" }]);
    });
  }

  function handleChoice(key) {
    elChoices.innerHTML = "";
    switch (key) {
      case "remember":
        asked.remember = true;
        line_DangerNearShrine();
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
        proceedIfAllTopicsCovered();
        break;
    }
  }

  function line_DangerNearShrine() {
    typeText("\"You don't remember? This place is very dangerous, it's very close to the Shrine, tightly guarded by the Void.\"", () => {
      // Offer further branches
      const opts = [];
      if (!asked.shrine) opts.push({ text: "\"What Shrine? What's the Void?\"", key: "shrine" });
      if (!asked.who)    opts.push({ text: "\"Who are you?\"", key: "who" });
      // If somehow player didn't click remember earlier (not possible now), it would be here; we don't expose it again.
      setChoices(opts);
    });
  }

  function afterTopicBranch() {
    // Shared line that leads to remaining topics or to exit if all covered
    if (allTopicsCovered()) {
      readyToLeave();
      return;
    }
    typeText("\"The Shrine is where the Void gathers strength. We shouldn't stay—this path isn't safe.\"", () => {
      const opts = [];
      if (!asked.who)    opts.push({ text: "\"Who are you?\"", key: "who" });
      if (!asked.shrine) opts.push({ text: "\"What Shrine? What's the Void?\"", key: "shrine" });
      // 'remember' is already locked in by design at the start.
      if (opts.length === 0) {
        // Fallback (shouldn't happen because we gate all topics)
        opts.push({ text: "\"Let's go.\"", key: "continue" });
      }
      setChoices(opts);
    });
  }

  function revealYuanyuan(cb) {
    yuanyuanRevealed = true;
    typeText("\"...Oh—right. I haven't introduced myself. They call me Yuanyuan... 源緣.\"", () => {
      if (typeof cb === "function") cb();
    });
  }

  function allTopicsCovered() {
    return asked.remember && asked.shrine && asked.who;
  }

  function readyToLeave() {
    // Guarantee reveal if somehow not yet revealed (safety)
    if (!yuanyuanRevealed) {
      revealYuanyuan(() => line_OfferHelp());
    } else {
      line_OfferHelp();
    }
  }

  function line_OfferHelp() {
    typeText("\"That's strange. But it's okay—if you're just a traveller, why don't I help you navigate this place? I've been here for quite some time. But let us get out of this place first!\"", () => {
      setChoices([{ text: "\"Alright.\"", key: "continue" }]);
    });
  }

  function proceedIfAllTopicsCovered() {
    if (!allTopicsCovered()) {
      // Defensive: if clicked too early somehow, bring back remaining topics
      afterTopicBranch();
      return;
    }
    elChoices.innerHTML = "";
    beginAttuneLead();
  }

  // ---------------- Attunement & Result ----------------
  function beginAttuneLead() {
    state = "attuneLead";
    typeText("\"Your Qi is still forming. Let me attune you to the flow of Lingjie...\"\n\n(Resonance stirring...)", () => {
      state = "result";
      // Now Space will showResult()
    });
  }

  function showResult() {
    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const animal  = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

    if (ELEMENT_BG[element]) elBg.style.background = ELEMENT_BG[element];

    const line = "-- Resonance stirs through the leaves and stone. --\n\nYou are now a " + element + " " + animal + ".";
    typeText(line, () => {
      state = "exit";
      // Space will exit
    });
  }

  function exitScene() {
    window.location.href = "../index.html";
  }

  // ---------------- Input (Space only) ----------------
  let lastPress = 0;
  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space") return;
    const now = Date.now();
    if (now - lastPress < 60) return; // tiny debounce
    lastPress = now;

    // never Space while the name form is open
    if (isNameFormOpen()) return;

    // If a line is typing, Space only finishes it
    if (finishTyping()) return;

    switch (state) {
      case "intro":
        advanceIntro();
        break;
      case "name":
        // Space does nothing; submit the form instead.
        break;
      case "dialogue":
        // Space does nothing while choices are visible; click a button.
        break;
      case "attuneLead":
        // Wait for typing to finish; when done, state becomes 'result'.
        break;
      case "result":
        showResult();
        break;
      case "exit":
        exitScene();
        break;
    }
  });

  // ---------------- Start ----------------
  startIntro();
})();
