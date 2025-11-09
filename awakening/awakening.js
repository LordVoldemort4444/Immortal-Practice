// Awakening — preserves your lines, adds choices, reveals Yuanyuan only if asked,
// randomizes element+animal, then returns to main.

const ELEMENTS = ["Wood","Fire","Earth","Metal","Water"];
const ANIMALS  = ["Wolf","Fox","Bear","Bird","Serpent"];

const elText   = document.getElementById('text');
const elChoices= document.getElementById('choices');
const elHint   = document.getElementById('hint');
const form     = document.getElementById('nameForm');
const nameInput= document.getElementById('playerName');
const bg       = document.getElementById('bg');

let typing=false, timer=null, idx=0, state='intro', playerName='';

const lines = [
  // Your original prologue-to-awakening beats
  `— The world is quiet. Leaves whisper overhead. —`,
  `A soft light hovers nearby.`,
  `“Are you alive? Are you awake?”`,
  // name capture will happen here
  // then the back-and-forth you wrote:
  // “I’m Yuanyuan…” will be hidden until the player asks “Who are you?”
];

const convo = [
  { npc: `“Why are you here, sleeping under the tree?”`,
    choices: [
      { text: `“…I don’t remember.”`, next: 1 }
    ]},
  { npc: `“You don’t remember? This place is very dangerous, it’s very close to the Shrine, tightly guarded by the Void.”`,
    choices: [
      { text: `“…(Looks puzzled)” , next: 2 },
      { text: `“What Shrine? What’s the Void?”`, next: 3 },
      { text: `“Who are you?”`, next: 'who' }
    ]},
  { npc: `“You don’t know about the Shrine? Do you even live here? Have you ever heard of the Void?”`,
    choices: [
      { text: `“I somehow know a little bit, but I don’t really know why I am here.”`, next: 4 },
      { text: `“Who are you?”`, next: 'who' }
    ]},
  { npc: `“The Shrine is where the Void gathers strength. We shouldn’t stay—this path isn’t safe.”`,
    choices: [
      { text: `“Then… please guide me.”`, next: 4 },
      { text: `“Who are you?”`, next: 'who' }
    ]},
  { npc: `“That’s strange. But it’s okay—if you’re just a traveller, why don’t I help you navigate this place? I’ve been here for quite some time. But let us get out of this place first!”`,
    choices: [
      { text: `“Alright.”`, next: 'randomize' }
    ]}
];

function typeText(s, speed=28){
  typing=true;
  elText.classList.add('show');
  elText.textContent='';
  let i=0;
  function step(){
    if(i>=s.length){ typing=false; return; }
    elText.textContent += s[i++];
    timer=setTimeout(step, speed);
  }
  step();
}
function finishTypingNow(){
  if(!typing) return;
  clearTimeout(timer);
  typing=false;
}

function setChoices(list){
  elChoices.innerHTML='';
  list.forEach(opt=>{
    const b=document.createElement('button');
    b.className='choice';
    b.textContent=opt.text;
    b.onclick=(e)=>{ e.stopPropagation(); choose(opt.next); };
    elChoices.appendChild(b);
  });
}

function choose(next){
  if(next==='who'){
    revealYuanyuan();
    return;
  }
  if(next==='randomize'){
    randomizeAttunement();
    return;
  }
  // show next npc line from convo
  const step = convo[next];
  printNPC(step.npc, ()=> setChoices(step.choices));
}

function printNPC(text, after){
  elChoices.innerHTML='';
  typeText(text);
  waitEndThen(after);
}

function waitEndThen(cb){
  const iv=setInterval(()=>{
    if(!typing){ clearInterval(iv); cb && cb(); }
  },30);
}

function askName(){
  // Show form, disable global click-advance while form is open
  form.style.display='flex';
  nameInput.focus();
}

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  playerName = (nameInput.value || 'Traveller').trim();
  form.style.display='none';
  // continue with your original exchange
  // Start at the first NPC question
  const step = convo[0];
  printNPC(step.npc, ()=> setChoices(step.choices));
});

function revealYuanyuan(){
  // Reveal only when the player asks
  printNPC(`“…Oh—right. I haven’t introduced myself.\nThey call me **Yuanyuan**… 源緣.”`, ()=>{
    // Return to the current logical branch (offer directions)
    // If we revealed early, route to node 3 (explain shrine) or 2 if earlier
    const step = convo[3];
    printNPC(step.npc, ()=> setChoices(step.choices));
  });
}

function randomizeAttunement(){
  state='randomize';

  const element = ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)];
  const animal  = ANIMALS[Math.floor(Math.random()*ANIMALS.length)];

  // tint bg by element
  const palette = {
    Wood:  'linear-gradient(120deg,#0f1f12,#132516,#0f1f12)',
    Fire:  'linear-gradient(120deg,#2a0e0e,#3a1310,#2a0e0e)',
    Earth: 'linear-gradient(120deg,#19160e,#241f12,#19160e)',
    Metal: 'linear-gradient(120deg,#0e1419,#121b24,#0e1419)',
    Water: 'linear-gradient(120deg,#0b1621,#0f1d2b,#0b1621)'
  };
  if(palette[element]) bg.style.background = palette[element];

  elChoices.innerHTML='';
  typeText(
    `— Resonance stirs through the leaves and stone. —\n\n` +
    `You are now a **${element} ${animal}**.`
    .replace(/\*\*/g,'')
  );
  waitEndThen(()=>{
    elHint.textContent = 'Click anywhere or press Space to continue';
    state='exit';
  });
}

function advance(){
  if(typing){ finishTypingNow(); return; }

  if(state==='intro'){
    if(idx===0){ typeText(lines[0]); idx=1; return; }
    if(idx===1){ typeText(lines[1]); idx=2; return; }
    if(idx===2){
      typeText(lines[2]);
      waitEndThen(()=>{ state='name'; elHint.textContent = 'Type your name below'; askName(); });
      return;
    }
  }else if(state==='exit'){
    // Back to main for now; later route to tutorial yard
    window.location.href = '../index.html';
  }
}

// Handlers
window.addEventListener('keydown', (e)=>{
  if(e.code==='Space'){ e.preventDefault(); advance(); }
});
window.addEventListener('click', (e)=>{
  // ignore clicks on form or choice buttons (they have their own handlers)
  if(e.target.closest('.name-form') || e.target.closest('.choice')) return;
  advance();
});

// Kickoff
advance(); // starts with first line
// Prevent space scroll
window.onkeydown = (e)=>{ if(e.code==='Space' && e.target===document.body) e.preventDefault(); };
