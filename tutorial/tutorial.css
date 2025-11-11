:root{
  --fg:#ece9e2; --muted:#b9b6af; --accent:#9ad6ff;
  --bg1:#0b1416; --bg2:#111a14;
  --panel:rgba(10,10,10,.45); --border:rgba(255,255,255,.08);
}

*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0; font-family:"Noto Serif",serif; color:var(--fg);
  background: radial-gradient(1200px 800px at 50% 10%, var(--bg2), var(--bg1));
  overflow:hidden;
}

#fade{
  position:fixed; inset:0; background:#000; opacity:1; pointer-events:none;
  animation: fadeIn .6s ease forwards;
}
@keyframes fadeIn{ to{ opacity:0 } }
@keyframes fadeOut{ to{ opacity:1 } }

#field{
  position:relative; width:100vw; height:100vh;
  user-select:none;
}

/* Dim dark road feel */
#darken{
  position:absolute; inset:0;
  background: radial-gradient(1200px 800px at 50% 90%, rgba(0,0,0,.35), rgba(0,0,0,.65));
  pointer-events:none;
}

/* Tree (spawn landmark) */
#tree{
  position:absolute; left:12%; top:65%;
  width:200px; height:200px; border-radius:50%;
  background: radial-gradient(circle at 40% 35%, #355d3b, #1e3b23 60%, #0f2515);
  filter: drop-shadow(0 30px 80px rgba(0,0,0,.55));
}

/* Player */
#player{
  position:absolute; left:16%; top:72%;
  width:24px; height:24px; transform: translate(-50%, -50%);
}
#player .body{
  width:100%; height:100%; border-radius:50%;
  background: radial-gradient(circle at 35% 30%, #e7fbff, #bfe9ff 60%, #7ec7ff);
  box-shadow: 0 0 18px rgba(126,199,255,.6);
}
#player .shadow{
  position:absolute; left:50%; bottom:-8px; transform: translateX(-50%);
  width:26px; height:6px; border-radius:50%; background: rgba(0,0,0,.35); filter: blur(2px);
}

/* Quest marker */
#marker{
  position:absolute; right:8%; top:35%;
  width:44px; height:44px; border-radius:50%;
  border:2px solid rgba(154,214,255,.8);
  box-shadow: 0 0 40px rgba(154,214,255,.4), inset 0 0 12px rgba(154,214,255,.25);
}
.pulse{ animation:pulse 1.6s ease-in-out infinite }
@keyframes pulse{
  0%,100%{ transform: scale(1) }
  50%{ transform: scale(1.15) }
}

/* HUD */
#ui{
  position:absolute; left:0; right:0; top:0; padding:14px 16px;
  display:flex; justify-content:space-between; align-items:flex-start; gap:12px;
}
#hint{ color:var(--muted); font-size:14px }
#distance{ color:var(--muted); font-size:14px }
#distance b{ color:#e7e4dc }

/* Dialogue panel */
.panel{
  position:absolute; left:50%; bottom:16px; transform: translateX(-50%);
  width:min(820px, 92vw);
  background: linear-gradient(180deg, var(--panel), rgba(12,12,12,.25));
  border:1px solid var(--border); border-radius:16px; padding:12px 14px;
  backdrop-filter: blur(6px);
}
#text{ min-height:84px; line-height:1.6 }
#advance{ text-align:right; color:var(--muted); font-size:12px }
#advance span{ color:var(--accent) }

/* Make the world large enough to “walk” */
body, #field{
  background-size: cover;
}
