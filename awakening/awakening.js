// awakening/awakening.js
// Clean version: ensures the player hears Yuanyuan's name and explores all dialogue topics before progressing.

(() => {
  "use strict";

  const TYPE_SPEED = 28;
  const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"];
  const ANIMALS = ["Wolf", "Fox", "Bear", "Bird", "Serpent"];
  const ELEMENT_BG = {
    Wood: "linear-gradient(120deg,#0f1f12,#132516,#0f1f12)",
    Fire: "linear-gradient(120deg,#2a0e0e,#3a1310,#2a0e0e)",
    Earth: "linear-gradient(120deg,#19160e,#241f12,#19160e)",
    Metal: "linear-gradient(120deg,#0e1419,#121b24,#0e1419)",
    Water: "linear-gradient(120deg,#0b1621,#0f1d2b,#0b1621)"
  };

  // DOM
  const elText = document.getElementById("text");
  const elChoices = document.getElementById("choices");
  const elHint = document.getElementById("hint");
  const elForm = document.getElementById("nameForm");
  const elInput = document.getElementById("playerName");
  const elBg = document.getElementById("bg");

  // State
  let state = "intro";
  let typing = false;
  let typeTimer = null;
  let currentText = "";
  let introIndex = 0;
  let playerName = "";
  let yuanyuanRevealed = false;

  // Which topics player has asked
  const asked = {
    shrine: false,
    who: false,
    remember: false
  };

  const introLines = [
    "-- The world is quiet. Leaves whisper overhead. --",
    "A soft light hovers nearby.",
    "\"Are you alive? Are you awake?\""
  ];

  // Utils
  function clearTimer() {
    if (typeTimer) clearTimeout(typeTimer);
    typeTimer = null;
  }

  function typeText(str, cb) {
    clearTimer();
    typing = true;
    currentText = "";
    elText.classList.add("show");
    elText.textContent = "";

    let i = 0;
    (function step() {
      if (i >= str.length) {
        typing = false;
        if (cb) cb();
        return;
      }
      currentText += str[i++];
      elText.textContent = currentText;
      typeTimer = setTimeout(step, TYPE_SPEED);
    })();
  }

  function finishTyping() {
    if (!typing) return false;
    clearTimer();
    typing = false;
    elText.textContent = currentText;
    return true;
  }

  function setHint(html) {
    elHint.innerHTML = html;
  }

  // Intro
  function showIntroLine() {
    typeText(introLines[introIndex]);
  }

  function advanceIntro() {
    if (finishTyping()) return;
    introIndex++;
    if (introIndex < introLines.length) {
      elText.classList.remove("show");
      setTimeout(showIntroLine, 100);
    } else {
      state = "name";
      setHint("Type your name below");
      askName();
    }
  }

  function askName() {
    typeText("\"What's your name?\"", () => {
      elForm.style.display = "flex";
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

  // Dialogue
  function startDialogue() {
    state = "dialogue";
    firstQuestion();
  }

  function firstQuestion() {
    typeText("\"Why are you here, sleeping under the tree?\"", () => {
      setChoices([
        { text: "\"...I don't remember.\"", key: "remember" }
      ]);
    });
  }

  function setChoices(list) {
    elChoices.innerHTML = "";
    list.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.textContent = opt.text;
      b.onclick = (e) => {
        e.stopPropagation();
        handleChoice(opt.key);
      };
      elChoices.appendChild(b);
    });
  }

  function handleChoice(key) {
    elChoices.innerHTML = "";
    if (key === "remember") {
      asked.remember = true;
      talkAboutShrine();
    } else if (key === "shrine") {
      asked.shrine = true;
      talkAboutWho();
    } else if (key === "who") {
      asked.who = true;
      revealYuanyuan(() => {
        talkAboutWho(); // returns to dialogue after reveal
      });
    } else if (key === "continue") {
      checkAllTopics();
    }
  }

  function talkAboutShrine() {
    typeText("\"You don't remember? This place is very dangerous, it's very close to the Shrine, tightly guarded by the Void.\"", () => {
      setChoices([
        { text: "\"What Shrine? What's the Void?\"", key: "shrine" },
        { text: "\"Who are you?\"", key: "who" }
      ]);
    });
  }

  function talkAboutWho() {
    // check if all have been asked
    if (asked.shrine && asked.who && asked.remember) {
      readyToLeave();
    } else {
      typeText("\"The Shrine is where the Void gathers strength. We shouldn't stay—this path isn't safe.\"", () => {
        // show any remaining options
        const opts = [];
        if (!asked.who) opts.push({ text: "\"Who are you?\"", key: "who" });
        if (!asked.shrine) opts.push({ text: "\"What Shrine? What's the Void?\"", key: "shrine" });
        if (!asked.remember) opts.push({ text: "\"...I don't remember.\"", key: "remember" });
        if (opts.length === 0) opts.push({ text: "\"Let's get out of here.\"", key: "continue" });
        setChoices(opts);
      });
    }
  }

  function revealYuanyuan(cb) {
    yuanyuanRevealed = true;
    typeText("\"...Oh—right. I haven't introduced myself. They call me Yuanyuan... 源緣.\"", () => {
      if (cb) cb();
    });
  }

  function readyToLeave() {
    if (!yuanyuanRevealed) {
      // auto reveal before leaving
      revealYuanyuan(() => {
        afterRevealContinue();
      });
    } else {
      afterRevealContinue();
    }
  }

  function afterRevealContinue() {
    typeText("\"That's strange. But it's okay—if you're just a traveller, why don't I help you navigate this place? I've been here for quite some time. But let us get out of this place first!\"", () => {
      setChoices([{ text: "\"Alright.\"", key: "continue" }]);
      // repurpose "continue" to go randomize
      asked.shrine = asked.who = asked.remember = true; // ensure complete
    });
  }

  function checkAllTopics() {
    elChoices.innerHTML = "";
    beginRandomize();
  }

  // Randomization
  function beginRandomize() {
    state = "randomize";
    setHint('Click anywhere or press <span>Space</span> to continue');

    const line = "\"Your Qi is still forming. Let me attune you to the flow of Lingjie...\"\n\n(Resonance stirring...)";
    typeText(line, () => {
      state = "result";
    });
  }

  function showResult() {
    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

    if (ELEMENT_BG[element]) elBg.style.background = ELEMENT_BG[element];

    const msg = "-- Resonance stirs through the leaves and stone. --\n\nYou are now a " + element + " " + animal + ".";
    typeText(msg, () => {
      setHint('Click anywhere or press <span>Space</span> to continue');
      state = "exit";
    });
  }

  function exitScene() {
    window.location.href = "../index.html";
  }

  // Controls
  function handleAdvance() {
    if (finishTyping()) return;

    switch (state) {
      case "intro":
        advanceIntro();
        break;
      case "name":
        break;
      case "dialogue":
        break;
      case "randomize":
        // do nothing until typing done, then result
        break;
      case "result":
        showResult();
        break;
      case "exit":
        exitScene();
        break;
    }
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      if (elForm.style.display === "flex") return;
      e.preventDefault();
      handleAdvance();
    }
  });

  window.addEventListener("click", (e) => {
    if (e.target.closest(".choice") || e.target.closest(".name-form")) return;
    handleAdvance();
  });

  // Start
  setHint('Click anywhere or press <span>Space</span> to continue');
  typeText(introLines[0]);
  state = "intro";
})();
