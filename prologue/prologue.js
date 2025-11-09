/* Prologue: typewriter + space-to-advance
   - Space reveals full current paragraph or advances to next
   - Ends right before Yuanyuan's first line (to stitch the Awakening scene later)
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
Only the faint memory of the Dragon’s breath remained.`,

// End card leads into Awakening (we'll add the next scene file later)
`…`
];

const elText = document.getElementById('text');
const elHint = document.getElementById('hint');

let idx = 0;
let typing = false;
let charTimer = null;
let revealIndex = 0;

// Strip markdown **bold** for now; keep plain text render
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
      // show hint once slide fully revealed
      setTimeout(()=> elHint.classList.add('visible'), 120);
      return;
    }
    elText.textContent += content[revealIndex++];
    charTimer = setTimeout(step, 34); // ~34ms per char
  };
  step();
}

function revealAllNow(){
  if(!typing) return;
  clearTimeout(charTimer);
  const content = plain(slides[idx]);
  elText.textContent = content;
  typing = false;
  elHint.classList.add('visible');
}

function nextSlide(){
  if(typing){
    revealAllNow();
    return;
  }
  // proceed
  elText.classList.remove('show');
  elHint.classList.remove('visible');

  // small fade gap
  setTimeout(()=>{
    idx++;
    if(idx < slides.length){
      typeSlide(slides[idx]);
    }else{
      // Prologue end → hold on black & cue Awakening hook
      endPrologue();
    }
  }, 80);
}

function endPrologue(){
  // Fade out text, then show the hook line (no scene swap yet)
  elText.classList.add('fade-out');
  elHint.classList.remove('visible');
  setTimeout(()=>{
    elText.classList.remove('fade-out');
    elText.textContent = '“Are you alive? … Are you awake?”';
    elText.classList.add('show');
    // Replace hint to indicate continuation soon
    elHint.innerHTML = 'Press <span>Space</span> to begin your Awakening';
    elHint.classList.add('visible');

    // On next space, we’ll (for now) loop back to index, or later route to Awakening scene
    window.removeEventListener('keydown', keyHandler);
    window.removeEventListener('click', clickHandler);

    const proceed = () => {
      // TODO: when Awakening scene exists, navigate there:
      // window.location.href = '../awakening/awakening.html';
      // For now, reload the last line to prevent dead end:
      window.location.href = '../index.html';
    };
    const endKey = (e)=>{ if(e.code==='Space') proceed(); };
    const endClick = ()=> proceed();

    window.addEventListener('keydown', endKey);
    window.addEventListener('click', endClick);
  }, 420);
}

function keyHandler(e){
  if(e.code === 'Space'){
    e.preventDefault();
    nextSlide();
  }
}
function clickHandler(){ nextSlide(); }

// Kickoff
typeSlide(slides[0]);
window.addEventListener('keydown', keyHandler);
window.addEventListener('click', clickHandler);

// Accessibility: prevent spacebar from scrolling on some browsers
window.onkeydown = (e) => {
  if(e.code === 'Space' && e.target === document.body){ e.preventDefault(); }
};
