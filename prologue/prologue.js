/* Prologue: exact wording, typewriter, Space/Click advance.
   Ends by navigating to Awakening scene.
*/

const slides = [
  // EXACT WORDING FROM YOUR SCRIPT — split into readable slides, no edits.
  `Once upon a time, Lingjie is roamed with beasts and animals that wander around the wild.`,
  `After the exposure of Qi, the very essence that sustains life form, creatures begin to realize by absorbing the powers of the five major elementals of the world, Wood, Fire, Earth, Metal and Water, they can extend their lives.`,
  `For centuries, animals and humans live a fruitful life, striving to transcend to the Immortal Realm.`,
  `One day, a mysterious creature mastered the elemental powers and was said to become Immortal.`,
  `By using his powers, he took on the form of a Dragon, and granted all beasts and animals of Lingjie the ability to transcend to humans and is known as the Immortal Dragon.`,
  `The Immortal Dragon carefully selected his subjects to serve as his Gods, governing Lingjie in a harmonious manner.`,
  `But then came the Void, monstrous and devilish creatures that seek to transform into human.`,
  `They become envious of other animals of Lingjie.`,
  `With the ability of corrupting hearts, the Dragon’s subjects are turned against him.`,
  `When he realized the change, it was already too late.`,
  `They misused his trust, lured him into a trap, and chained the Immortal Dragon.`,
  `Using the power of the Void, they corrupted his heart in an attempt to use his power to transcend their own creatures.`,
  `In a desperate attempt, the clean soul of the Immortal Dragon scattered himself over Lingjie, and the civilization of Lingjie immediately crumbled.`,
  `The power of animals to transcend is prohibited, humans and plants withered, civilizations crumbled with ruins remained.`,
  `The lands become corrupted, roamed by Void creatures.`,
  `Only the faint memories of the Dragon’s breath remain.`
];

const elText = document.getElementById('text');
const elHint = document.getElementById('hint');

let idx = 0;
let typing = false;
let t = null;

function typeLine(s, speed=32){
  typing = true;
  elText.classList.add('show');
  elText.textContent = '';
  let i = 0;
  (function step(){
    if(i >= s.length){ typing = false; return; }
    elText.textContent += s[i++];
    t = setTimeout(step, speed);
  })();
}

function finishNow(){
  if(!typing) return;
  clearTimeout(t);
  typing = false;
  elText.textContent = slides[idx];
}

function next(){
  if(typing){ finishNow(); return; }

  // advance slide
  idx++;
  if(idx < slides.length){
    elText.classList.remove('show');
    setTimeout(()=> typeLine(slides[idx]), 80);
  }else{
    // go to Awakening scene
    window.location.href = '../awakening/awakening.html';
  }
}

function kick(){
  typeLine(slides[0]);
}

window.addEventListener('keydown', (e)=>{
  if(e.code==='Space'){ e.preventDefault(); next(); }
});
window.addEventListener('click', ()=> next());

// prevent space scroll
window.onkeydown = (e)=>{ if(e.code==='Space' && e.target===document.body) e.preventDefault(); };

kick();
