// Yuanyuan Awakening — click or Space to advance

const LINES = [
  `……\n\n(You hear a soft voice beneath the wind.)`,
  `“Can you hear me?”`,
  `“Please… wake up.”`,
  `“Ah— you’re awake! Are you hurt?”`,
  `“…You don’t remember anything?”`,
  `“That… might be for the best. This place isn’t safe. The Shrine is close, and the Void watches it.”`,
  `“Listen, traveler. I’ll guide you—just follow my light for now.”`,
  // The following line is a lead-in to randomization
  `“Your Qi is still forming. Let me attune you to the flow of Lingjie…”\n\n(Resonance stirring…)`
];

const ELEMENTS = ["Wood","Fire","Earth","Metal","Water"];
const ANIMALS  = ["Wolf","Fox","Bear","Bird","Serpent"];

const elText = document.getElementById('text');
const elHint = document.getElementById('hint');

let i = 0;
let typing = false;
let charTimer = null;
let revealIndex = 0;
let state = 'dialogue'; // 'dialogue' | 'randomize' | 'final' | 'exit'

// printer
function typeLine(s, speed=28){
  typing = true;
  revealIndex = 0;
  elText.textContent = '';
  elText.classList.add('show');

  const step = () => {
    if(revealIndex >= s.length){
      typing = false;
      return;
    }
    elText.textContent += s[revealIndex++];
    charTimer = setTimeout(step, speed);
  };
  step();
}

function showNext(){
  if(state === 'dialogue'){
    if(typing){
      // finish fast
      clearTimeout(charTimer);
      const s = LINES[i];
      elText.textContent = s;
      typing = false;
      return;
    }
    // next line or move to randomization
    if(i < LINES.length - 1){
      i++;
      typeLine(LINES[i]);
    }else{
      // trigger randomization step
      randomizeAttunement();
    }
  }else if(state === 'randomize'){
    // reveal the result (already set)
    state = 'final';
  }else if(state === 'final'){
    // one more to exit
    state = 'exit';
    // Return to main for now (you can route to tutorial yard later)
    window.location.href = '../index.html';
  }
}

function randomizeAttunement(){
  state = 'randomize';
  const element = ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)];
  const animal  = ANIMALS[Math.floor(Math.random()*ANIMALS.length)];

  // Color hint (optional): shift bg subtly based on element
  const bg = document.getElementById('bg');
  const palette = {
    Wood:  'linear-gradient(120deg,#0f1f12,#132516,#0f1f12)',
    Fire:  'linear-gradient(120deg,#2a0e0e,#3a1310,#2a0e0e)',
    Earth: 'linear-gradient(120deg,#19160e,#241f12,#19160e)',
    Metal: 'linear-gradient(120deg,#0e1419,#121b24,#0e1419)',
    Water: 'linear-gradient(120deg,#0b1621,#0f1d2b,#0b1621)'
  };
  if(palette[element]) bg.style.background = palette[element];

  const line = `Your essence gathers…\n\nYou are now a **${element} ${animal}**.`;
  typeLine(line.replace(/\*\*/g,'')); // plain bold strip for now
}

function keyHandler(e){
  if(e.code === 'Space'){
    e.preventDefault();
    showNext();
  }
}
function clickHandler(){
  showNext();
}

// start
typeLine(LINES[0]);
window.addEventListener('keydown', keyHandler);
window.addEventListener('click', clickHandler);

// prevent space scroll
window.onkeydown = (e) => {
  if(e.code === 'Space' && e.target === document.body){ e.preventDefault(); }
};
