// awakening/awakening.js
// Clean state-machine implementation of the Awakening scene.
// - Click OR Space to advance
// - Typewriter effect with instant reveal on advance
// - Player name capture
// - Dialogue choices (including "Who are you?" → reveals Yuanyuan / 源緣)
// - Randomize Element + Animal → show result
// - One more advance returns to main (index.html)

(() => {
  'use strict';

  // ------------------------------
  // Config
  // ------------------------------
  const TYPE_SPEED_MS = 28; // per-character typing speed
  const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"];
  const ANIMALS  = ["Wolf", "Fox", "Bear", "Bird", "Serpent"];

  const ELEMENT_BG = {
    Wood:  'linear-gradient(120deg,#0f1f12,#132516,#0f1f12)',
    Fire:  'linear-gradient(120deg,#2a0e0e,#3a1310,#2a0e0e)',
    Earth: 'linear-gradient(120deg,#19160e,#241f12,#19160e)',
    Metal: 'linear-gradient(120deg,#0e1419,#121b24,#0e1419)',
    Water: 'linear-gradient(120deg,#0b1621,#0f1d2b,#0b1621)'
  };

  // ------------------------------
  // DOM
  // ------------------------------
  const elText    = document.getElementById('text');
  const elChoices = document.getElementById('choices');
  const elHint    = document.getElementById('hint');
  const elForm    = document.getElementById('nameForm');
  const elInput   = document.getElementById('playerName');
  const elBg      = document.getElementById('bg');

  // ------------------------------
  // Scene Script
  // ------------------------------
  const introLines = [
    `— The world is quiet. Leaves whisper overhead. —`,
    `A soft light hovers nearby.`,
    `“Are you alive? Are you awake?”`
  ];

  // Conversation graph
  // npc: line to type
  // choices: array of {text, next} where next can be:
  //   - number index into convo[]
  //   - 'who' to reveal Yuanyuan
  //   - 'randomize' to start attunement
  const convo = [
    { // 0
      npc: `“Why are you here, sleeping under the tree?”`,
      choices: [
        { text: `“…I don’t remember.”`, next: 1 }
      ]
    },
    { // 1
      npc: `“You don’t remember? This place is very dangerous, it’s very close to the Shrine, tightly guarded by the Void.”`,
      choices: [
        { text: `“…(Looks puzzled)” , next: 2 },
        { text: `“What Shrine? What’s the Void?”`, next: 3 },
        { text: `“Who are you?”`, next: 'who' }
      ]
    },
    { // 2
      npc: `“You don’t know about the Shrine? Do you even live here? Have you ever heard of the Void?”`,
      choices: [
        { text: `“I somehow know a little bit, but I don’t really know why I am here.”`, next: 4 },
        { text: `“Who are you?”`, next: 'who' }
      ]
    },
    { // 3
      npc: `“The Shrine is where the Void gathers strength. We shouldn’t stay—this path isn’t safe.”`,
      choices: [
        { text: `“Then… please guide me.”`, next: 4 },
        { text: `“Who are you?”`, next: 'who' }
      ]
    },
    { // 4
      npc: `“That’s strange. But it’s okay—if you’re just a traveller, why don’t I help you navigate this place? I’ve been here for quite some time. But let us get out of this place first!”`,
      choices: [
        { text: `“Alright.”`, next: 'randomize' }
      ]
    }
  ];

  // ------------------------------
  // State
  // ------------------------------
  // states: 'intro' → 'name' → 'dialogue' → 'randomize' → 'result' → 'exit'
  let state = 'intro';
  let introIdx = 0;
  let typing = false;
  let typeTimer = null;
  let currentTextFull = '';
  let currentTextShown = '';
  let playerName = '';

  // ------------------------------
  // Utilities
  // ------------------------------
  function clearTimer() {
    if (typeTimer) {
      clearTimeout(typeTimer);
      typeTimer = null;
    }
  }

  function isInputActive() {
    return document.activeElement === elInput || elForm.style.display !== 'none';
  }

  function setChoices(list) {
    elChoices.innerHTML = '';
    list.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'choice';
      b.type = 'button';
      b.textContent = opt.text;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        handleChoice(opt.next);
      });
      elChoices.appendChild(b);
    });
  }

  function typeText(str, speed = TYPE_SPEED_MS, done) {
    clearTimer();
    typing = true;
    currentTextFull = str;
    currentTextShown = '';
    elText.classList.add('show');
    elText.textContent = '';

    let i = 0;
    (function loop() {
      if (i >= str.length) {
        typing = false;
        done && done();
        return;
      }
      currentTextShown += str[i++];
      elText.textContent = currentTextShown;
      typeTimer = setTimeout(loop, speed);
    })();
  }

  function instantReveal() {
    if (!typing) return false;
    clearTimer();
    typing = false;
    elText.textContent = currentTextFull;
    return true;
  }

  function setHint(text) {
    elHint.innerHTML = text;
  }

  // ------------------------------
  // Scene Flow
  // ------------------------------
  function startIntro() {
    state = 'intro';
    introIdx = 0;
    setHint('Click anywhere or press <span>Space</span> to continue');
    showIntroLine();
  }

  function showIntroLine() {
    typeText(introLines[introIdx]);
  }

  function advanceIntro() {
    if (instantReveal()) return;

    introIdx++;
    if (introIdx < introLines.length) {
      // next intro line
      elText.classList.remove('show');
      setTimeout(showIntroLine, 80);
    } else {
      // move to name capture
      state = 'name';
      setHint('Type your name below');
      showNameForm();
    }
  }

  function showNameForm() {
    // Insert the prompt line above the form (keep your wording).
    typeText(`“What’s your name?”`, undefined, () => {
      elForm.style.display = 'flex';
      elInput.value = '';
      elInput.focus();
    });
  }

  elForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = (elInput.value || '').trim();
    playerName = val || 'Traveller';
    elForm.style.display = 'none';
    // Move into dialogue graph at node 0
    startDialogue(0);
  });

  function startDialogue(nodeIndex) {
    state = 'dialogue';
    showNode(nodeIndex);
  }

  function showNode(index) {
    const step = convo[index];
    if (!step) return;
    elChoices.innerHTML = '';
    typeText(step.npc, undefined, () => setChoices(step.choices));
  }

  function handleChoice(next) {
    if (next === 'who') {
      revealYuanyuan();
      return;
    }
    if (next === 'randomize') {
      beginRandomize();
      return;
    }
    // numeric node
    if (typeof next === 'number') {
      showNode(next);
    }
  }

  function revealYuanyuan() {
    // Reveal ONLY when asked.
    elChoices.innerHTML = '';
    const line = `“…Oh—right. I haven’t introduced myself.\nThey call me Yuanyuan… 源緣.”`;
    typeText(line, undefined, () => {
      // After reveal, continue with a safe guidance line (node 3).
      const safeNode = 3;
      showNode(safeNode);
    });
  }

  function beginRandomize() {
    state = 'randomize';
    elChoices.innerHTML = '';
    setHint('Click anywhere or press <span>Space</span> to continue');

    // Optional lead-in line you specified earlier:
    const attuneLine = `“Your Qi is still forming. Let me attune you to the flow of Lingjie…”\n\n(Resonance stirring…)`;
    typeText(attuneLine, undefined, () => {
      // After the line finishes, on next advance we will show the result
      state = 'result';
    });
  }

  function showRandomizeResult() {
    // Pick element & animal
    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const animal  = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

    // Tint background by element for a little mood
    if (ELEMENT_BG[element]) elBg.style.background = ELEMENT_BG[element];

    const result = `— Resonance stirs through the leaves and stone. —\n\nYou are now a **${element} ${animal}**.`;
    // Strip markdown ** for plain rendering in this scene
    typeText(result.replace(/\*\*/g, ''), undefined, () => {
      // Next advance exits to main (for now).
      state = 'exit';
      setHint('Click anywhere or press <span>Space</span> to continue');
    });
  }

  function exitToMain() {
    window.location.href = '../index.html';
  }

  // ------------------------------
  // Input Handling
  // ------------------------------
  function handleAdvance() {
    // If typing, reveal instantly
    if (instantReveal()) return;

    switch (state) {
      case 'intro':
        advanceIntro();
        break;
      case 'name':
        // If the name form is open, do nothing; user must submit.
        if (!isInputActive()) {
          // Fallback: if somehow form closed, resume dialogue start
          startDialogue(0);
        }
        break;
      case 'dialogue':
        // In dialogue state, clicking empty space does nothing if choices are visible.
        // (Player should pick a choice.)
        break;
      case 'randomize':
        // After attune lead-in finishes, we set state to 'result'.
        // If user advanced during typing, instantReveal() already handled it.
        // Otherwise, no-op until type completes.
        break;
      case 'result':
        // Show the randomized outcome now
        showRandomizeResult();
        break;
      case 'exit':
        exitToMain();
        break;
      default:
        break;
    }
  }

  // Block Space from scrolling page, but allow within input
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      if (isInputActive()) return; // allow typing focus
      e.preventDefault();
      handleAdvance();
    }
  });

  window.addEventListener('click', (e) => {
    // Ignore clicks on interactive elements (form or choice buttons)
    if (e.target.closest('.name-form') || e.target.closest('.choice')) return;
    handleAdvance();
  });

  // ------------------------------
  // Start
  // ------------------------------
  startIntro();
})();
