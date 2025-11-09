/* Prologue: typewriter + space-to-advance
   - Space reveals full current paragraph or advances to next
   - Ends by navigating to Awakening scene (Yuanyuan dialogue)
*/

const slides = [
`Once upon a time, **Lingjie** was roamed by beasts and creatures wandering the wilds.`,
`After the birth of **Qi**, the essence that sustains all life, all beings learned to draw from the five elements — **Wood, Fire, Earth, Metal, and Water** — to extend their years.`,
`For centuries, animals and humans lived in harmony, cultivating toward transcendence into higher realms.`,
`One day, a mysterious being mastered all elements and ascended beyond mortality.
Taking the form of a **Dragon**, he became known as the **Immortal Dragon**.`,
`With his divine gift, he granted the creatures of Lingjie the ability to transcend — to awaken and become more than they were.`,
`From among the awakened, he chose **Gods**, guardians who governed Lingjie in balance and peace.`,
`But then came the **Void** — monstrous beings who envied life.
They coveted transformation and whispered to hearts not yet ready.`,
`Through deceit, the Dragon’s own subjects turned against him.
They trapped him and bound him in corrupted chains.`,
`In one final act of defiance, the Dragon shattered his pure soul across Lingjie.
When his light faded, the world fell silent.`,
`Transcendence was forbidden.
Humans and beasts withered.
Civilizations crumbled into ruins.
Only the faint memory of the Dragon’s breath remained.`
];

const elText = document.getElementById('text');
const elHint = document.getElementById('hint');

let idx = 0;
let typing = false;
let charTimer = null;
let revealIndex = 0;

function plain(s){ return s.replace(/\*\*/g,''); }

function typeSlide(text){
  typing = true;
  revealIndex = 0;
  elText.textContent = '';
  elText.classList.add('show');
  elHint.classList.remove('visible');

  const content = plain(text);
  const step = () => {
    if(revealIndex >= content.length){
      typing = false;
      setTimeout(()=> elHint.classList.add('visible'), 120);
      return;
    }
    elText.textContent += content[revealIndex++];
    charTimer = setTimeout(step, 34);
  };
  step();
}

function revealAllNow(){
  if(!typing) return;
  clearTimeout(charTimer);
  elText.textContent = plain(slides[idx]);
  typing = false;
  elHint.classList.add('visible');
}

function nextSlide(){
  if(typing){
    revealAllNow();
    return;
  }
  elText.classList.remove('show');
  elHint.classList.remove('visible');

  setTimeout(()=>{
    idx++;
    if(idx < slides.length){
      typeSlide(slides[idx]);
    }else{
      endPrologue();
    }
  }, 80);
}

function endPrologue(){
  // Transition straight into Awakening scene
  window.location.href = '../awakening/awakening.html';
}

function keyHandler(e){
  if(e.code === 'Space'){
    e.preventDefault();
    nextSlide();
  }
}
function clickHandler(){ nextSlide(); }

typeSlide(slides[0]);
window.addEventListener('keydown', keyHandler);
window.addEventListener('click', clickHandler);

window.onkeydown = (e) => {
  if(e.code === 'Space' && e.target === document.body){ e.preventDefault(); }
};
