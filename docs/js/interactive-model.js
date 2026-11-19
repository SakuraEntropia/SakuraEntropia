/**
 * SakuraEntropia — Interactive Mathematical Models
 */

let canvas, ctx;
let beta = 1.0, currentS = 0.45, rMax = 500;

function initModelSimulation() {
  canvas = document.getElementById('modelCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  ['slider-beta', 'slider-s', 'slider-rmax'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      if (id === 'slider-beta') { beta = v; document.getElementById('val-beta').textContent = v.toFixed(2); }
      if (id === 'slider-s')    { currentS = v; document.getElementById('val-s').textContent = v.toFixed(2); }
      if (id === 'slider-rmax') { rMax = v; document.getElementById('val-rmax').textContent = v.toFixed(0); }
      drawModel();
    });
  });

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
}

function resizeCanvas() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width, h = 320;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);
  drawModel();
}

function calc(s, b, rm) {
  const R = rm * Math.pow(s, b);
  const E = (rm / (b + 1)) * Math.pow(s, b) * (1 - Math.pow(s, b + 1));
  const dE = (rm / (b + 1)) * Math.pow(s, b > 0 ? b - 1 : 0) * (b - (2 * b + 1) * Math.pow(s, b + 1));
  const sStar = Math.pow(b / (2 * b + 1), 1 / (b + 1));
  return { R, E, dE, sStar };
}

function drawModel() {
  if (!canvas || !ctx) return;
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const p = { t: 36, r: 28, b: 44, l: 52 };
  const pw = w - p.l - p.r, ph = h - p.t - p.b;

  const isLight = document.body.dataset.theme === 'light';
  const grid   = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
  const axis   = isLight ? 'rgba(0,0,0,0.12)'  : 'rgba(255,255,255,0.12)';
  const txt    = isLight ? '#888891'            : '#55555e';
  const C_R    = '#38bdf8';
  const C_E    = '#c9a0dc';
  const C_S    = '#f59e0b';

  ctx.clearRect(0, 0, w, h);
  ctx.font = '11px -apple-system, sans-serif';

  // Grid
  ctx.strokeStyle = grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const yv = (rMax / 5) * i;
    const yp = p.t + ph - ph * (i / 5);
    ctx.fillStyle = txt; ctx.textAlign = 'right';
    ctx.fillText(yv.toFixed(0), p.l - 8, yp + 4);
    ctx.beginPath(); ctx.moveTo(p.l, yp); ctx.lineTo(p.l + pw, yp); ctx.stroke();

    const xp = p.l + pw * (i / 5);
    ctx.textAlign = 'center';
    ctx.fillText((i / 5).toFixed(1), xp, p.t + ph + 18);
    ctx.beginPath(); ctx.moveTo(xp, p.t); ctx.lineTo(xp, p.t + ph); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = axis; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(p.l, p.t); ctx.lineTo(p.l, p.t + ph); ctx.lineTo(p.l + pw, p.t + ph); ctx.stroke();

  const { sStar } = calc(0.5, beta, rMax);

  // s* line
  const sx = p.l + pw * sStar;
  ctx.save(); ctx.strokeStyle = C_S; ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(sx, p.t); ctx.lineTo(sx, p.t + ph); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = C_S; ctx.textAlign = 'center';
  ctx.fillText('s* = ' + sStar.toFixed(3), sx, p.t - 10);

  // Draw curve helper
  function drawCurve(colorStr, getter) {
    ctx.beginPath(); ctx.strokeStyle = colorStr; ctx.lineWidth = 2;
    for (let i = 0; i <= 120; i++) {
      const s = i / 120;
      const v = getter(s);
      const xp = p.l + pw * s;
      const yp = p.t + ph - ph * Math.max(0, Math.min(1, v / rMax));
      i === 0 ? ctx.moveTo(xp, yp) : ctx.lineTo(xp, yp);
    }
    ctx.stroke();
  }

  drawCurve(C_R, s => calc(s, beta, rMax).R);
  drawCurve(C_E, s => calc(s, beta, rMax).E);

  // Current point markers
  const cv = calc(currentS, beta, rMax);
  const cx = p.l + pw * currentS;

  ctx.save(); ctx.strokeStyle = axis; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(cx, p.t); ctx.lineTo(cx, p.t + ph); ctx.stroke(); ctx.restore();

  [[C_R, cv.R], [C_E, cv.E]].forEach(([c, v]) => {
    const cyp = p.t + ph - ph * Math.max(0, Math.min(1, v / rMax));
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(cx, cyp, 5, 0, Math.PI * 2); ctx.fill();
  });

  // Diagnostics
  const od = i => document.getElementById(i);
  od('out-s-star') && (od('out-s-star').textContent = cv.sStar.toFixed(3));
  od('out-r-val')  && (od('out-r-val').textContent  = cv.R.toFixed(1));
  od('out-e-val')  && (od('out-e-val').textContent  = cv.E.toFixed(1));
  if (od('out-de-val')) {
    od('out-de-val').textContent = (cv.dE >= 0 ? '+' : '') + cv.dE.toFixed(1);
    od('out-de-val').className = 'mono ' + (cv.dE < 0 ? 'neg' : '');
  }

  // Status card
  const st = od('status-title'), sd = od('status-desc'), si = od('status-icon');
  if (st) {
    if (currentS < cv.sStar) {
      si.textContent = '🚀';
      st.textContent = 'Accumulation Phase  (s < s*)';
      sd.textContent = `dE/ds = +${cv.dE.toFixed(1)}. Expectations are still rising with speed.`;
    } else {
      si.textContent = '⚠️';
      st.textContent = 'Expectation Crash Zone  (s > s*)';
      sd.textContent = `dE/ds = ${cv.dE.toFixed(1)}. Real progress climbs; collective expectations collapse.`;
    }
  }
}

// Wager simulator
function initWagerSimulator() {
  const update = () => {
    const p   = parseFloat(document.getElementById('sim-p')?.value   ?? 0.15);
    const ubn = parseFloat(document.getElementById('sim-ubn')?.value ?? 40);
    const unn = parseFloat(document.getElementById('sim-unn')?.value ?? 30);
    const ubg = 80, ung = 20;
    const euB = p * ubg + (1 - p) * ubn;
    const euN = p * ung + (1 - p) * unn;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('val-p',   p.toFixed(2));
    set('val-ubn', (ubn >= 0 ? '+' : '') + ubn);
    set('val-unn', (unn >= 0 ? '+' : '') + unn);
    set('out-eub', euB.toFixed(1));
    set('out-eun', euN.toFixed(1));

    const v = document.getElementById('verdict');
    if (v) {
      if (euB > euN) {
        v.textContent = `EU(B) = ${euB.toFixed(1)} > EU(N) = ${euN.toFixed(1)}. Belief yields higher expected utility at p = ${p.toFixed(2)}.`;
      } else {
        v.textContent = `EU(N) = ${euN.toFixed(1)} ≥ EU(B) = ${euB.toFixed(1)}. Secular rationalism holds under current parameters.`;
      }
    }
  };
  ['sim-p','sim-ubn','sim-unn'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', update);
  });
  update();
}

const caseText = {
  1: 'Case I — Belief when God exists. Metaphysical alignment. A non-interventionist creator grants no exemptions from physical law.',
  2: 'Case II — Belief in an empty universe. Secular utility of faith: psychological order, resilience against contingency, moral grounding. No supernatural listener required.',
  3: 'Case III — Disbelief when God exists. An abstract creator of cosmic order values honest skepticism over ritual performance.',
  4: 'Case IV — Disbelief in a godless universe. Epistemic alignment. Secular humanism, science, and art supply their own grounding.',
};

function showCase(n) {
  document.querySelectorAll('.cell').forEach(c => c.classList.remove('focal'));
  event.currentTarget.classList.add('focal');
  const v = document.getElementById('verdict');
  if (v) v.textContent = caseText[n];
}

window.initModelSimulation = initModelSimulation;
window.initWagerSimulator  = initWagerSimulator;
window.showCase            = showCase;
window.resizeCanvas        = resizeCanvas;
window.drawModel           = drawModel;
