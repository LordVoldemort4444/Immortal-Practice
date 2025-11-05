import { renderTop, renderBattleHUD, wireButtons } from "./ui.js";
import { startTimeLoop } from "./time.js";
import { initWorld } from "./overworld.js";

function boot() {
  renderTop();
  renderBattleHUD();
  wireButtons();
  initWorld();
  startTimeLoop();
}
boot();
