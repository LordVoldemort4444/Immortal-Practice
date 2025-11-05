import { S, save } from "./state.js";
import { DAY_SECONDS, AUTOSAVE_EVERY_MS } from "./constants.js";
import { renderTop, renderBattleHUD } from "./ui.js";

export function startTimeLoop() {
  let last = Date.now();

  setInterval(()=>{
    const now = Date.now();
    const elapsed = Math.max(0, now - last) / 1000;
    last = now;

    // passive essence
    const mult = getDimensionMult();
    S.essence += S.stats.idle * mult * elapsed;

    // 4 min/day; 360 days/year
    S.daySeconds += elapsed;
    while (S.daySeconds >= DAY_SECONDS) {
      S.daySeconds -= DAY_SECONDS;
      S.days = (S.days ?? 0) + 1;
      if (S.days >= 360) {
        S.days = 0;
        S.years += 1;
        S.essence += 5 + (1 + Math.floor(S.years/12));
      }
    }

    renderTop();
    renderBattleHUD();
  }, 1000);

  setInterval(()=>save(), AUTOSAVE_EVERY_MS);
}

function getDimensionMult(){
  // inline to avoid circular import; dimensionIndex -> multipliers:
  const idx = S.dimensionIndex;
  return [1.00,1.20,1.45,1.80,2.40][idx] ?? 1.0;
}
