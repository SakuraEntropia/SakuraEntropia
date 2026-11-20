/**
 * SakuraEntropia — Interactive Mathematical Models
 */

let canvas, ctx;
let beta = 1.0, currentS = 0.45, rMax = 500;
let nStages = 3, steepK = 14, tS = [0.22, 0.5, 0.78];
const C_R = '#38bdf8', C_E = '#c9a0dc', C_S = '#f59e0b';

/* ── Exact model ──────────────────────────────────────────────────────
   S(s) = (1/n) * Σ σ_k(s - t_i)          multi-stage logistic progress
   R(s) = R_max * (S'(s) / max S')^β      extrapolation horizon
   λ(s) = S'(s) / S(s)                    relative growth
   E(s) = S(s) * exp( λ(s) * R(s) )       expectation field
   ─────────────────────────────────────────────────────────────────── */

const sig = (x) => 1 / (1 + Math.exp(-x));

function Sfun(s) {
  let a = 0;
  for (let i = 0; i < tS.length; i++) a += sig(steepK * (s - tS[i]));
  return a / tS.length;
}
function dSfun(s) {
  let a = 0;
  for (let i = 0; i < tS.length; i++) {
    const g = sig(steepK * (s - tS[i]));
    a += steepK * g * (1 - g);
  }
  return a / tS.length;
}
let _maxDS = -1;
function maxDS() {
  if (_maxDS < 0) {
    let m = 1e-9;
    for (let i = 0; i <= 2000; i++) m = Math.max(m, dSfun(i / 2000));
    _maxDS = m;
  }
  return _maxDS;
}
function invalidate() { _maxDS = -1; }

const Rfun = (s) => rMax * Math.pow(dSfun(s) / maxDS(), beta);
const lam  = (s) => { const S = Sfun(s); return S > 1e-9 ? dSfun(s) / S : 0; };
// log of E, kept exact; used for plotting and argmax
const logE = (s) => Math.log(Math.max(1e-12, Sfun(s))) + lam(s) * Rfun(s);

let _maxLogE = null;
function maxLogE() {
  if (_maxLogE === null) {
    let m = -Infinity;
    for (let i = 0; i <= 2000; i++) m = Math.max(m, logE(i / 2000));
    _maxLogE = m;
  }
  return _maxLogE;
}
// log-scale display of E (monotone transform; shape untouched)
function eNorm(s) {
  const lo = -14, hi = maxLogE();
  return Math.max(0, Math.min(1, (logE(s) - lo) / (hi - lo)));
}

function calc(s) {
  const S = Sfun(s);
  const R = Rfun(s);
  const e = eNorm(s);
  const h = 1e-3, s2 = Math.min(1, s + h), s1 = Math.max(0, s - h);
  const dE = (logE(s2) - logE(s1)) / (s2 - s1) * e;   // dE/ds in normalized units
  let sStar = 0, best = -Infinity;
  for (let i = 0; i <= 600; i++) {
    const v = logE(i / 600);
    if (v > best) { best = v; sStar = i / 600; }
  }
  return { S, R, E: e, dE, sStar };
}

/* ── Init ───────────────────────────────────────────────────────────── */

function initModelSimulation() {
  canvas = document.getElementById('modelCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  const bind = (id, apply) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      apply(parseFloat(e.target.value));
      invalidate(); _maxLogE = null;
      drawModel();
    });
  };
  bind('slider-beta', (v) => { beta = v; set('val-beta', v.toFixed(2)); });
  bind('slider-s', (v) => { currentS = v; set('val-s', v.toFixed(2)); });
  bind('slider-rmax', (v) => { rMax = v; set('val-rmax', v.toFixed(0)); });
  bind('slider-k', (v) => { steepK = v; set('val-k', v.toFixed(0)); });
  bind('slider-n', (v) => {
    nStages = v;
    set('val-n', v.toFixed(0));
    rebuildStages();
  });

  rebuildStages();
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // drag stage handles
  canvas.addEventListener('pointerdown', (e) => {
    const hit = hitStage(e);
    if (hit < 0) return;
    canvas.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const s = sFromEvent(ev);
      tS[hit] = Math.max(0.02, Math.min(0.98, s));
      invalidate(); _maxLogE = null;
      syncStageSliders();
      drawModel();
    };
    const up = () => {
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
    };
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
  });
}

function set(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }

function rebuildStages() {
  if (tS.length !== nStages) {
    const next = [];
    for (let i = 0; i < nStages; i++) next.push(0.12 + (0.76 / Math.max(1, nStages - 1)) * i);
    tS = next;
  }
  const box = document.getElementById('stage-box');
  if (!box) return;
  box.innerHTML = tS.map((t, i) => `
    <div class="ctrl-group">
      <div class="ctrl-row"><label>Stage ${i + 1} · t<sub>${i + 1}</sub></label><span class="mono" id="val-t${i}">${t.toFixed(2)}</span></div>
      <input type="range" min="0.02" max="0.98" step="0.01" value="${t}" data-stage="${i}">
    </div>`).join('');
  box.querySelectorAll('input[type="range"]').forEach((el) => {
    el.addEventListener('input', (e) => {
      const i = parseInt(e.target.dataset.stage, 10);
      tS[i] = parseFloat(e.target.value);
      set('val-t' + i, tS[i].toFixed(2));
      invalidate(); _maxLogE = null;
      drawModel();
    });
  });
}

function syncStageSliders() {
  tS.forEach((t, i) => {
    const el = document.querySelector('#stage-box input[data-stage="' + i + '"]');
    if (el) el.value = t;
    set('val-t' + i, t.toFixed(2));
  });
}

function resizeCanvas() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = Math.max(240, rect.width), h = 320;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawModel();
}

/* ── Geometry helpers (canvas <-> s) ────────────────────────────────── */

const PAD = { t: 36, r: 26, b: 44, l: 52 };
function plotWidth() { return canvas.width / (window.devicePixelRatio || 1) - PAD.l - PAD.r; }
function plotHeight() { return canvas.height / (window.devicePixelRatio || 1) - PAD.t - PAD.b; }
function sFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  return Math.max(0, Math.min(1, (x - PAD.l) / plotWidth()));
}
function hitStage(e) {
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  const pw = plotWidth(), ph = plotHeight();
  let best = -1, bestD = 1e9;
  for (let i = 0; i < tS.length; i++) {
    const hx = PAD.l + pw * tS[i];
    const hy = PAD.t + ph - ph * Sfun(tS[i]);
    const d = Math.hypot(x - hx, y - hy);
    if (d < bestD) { bestD = d; best = i; }
  }
  return bestD <= 16 ? best : -1;
}

/* ── Draw ───────────────────────────────────────────────────────────── */

function drawModel() {
  if (!canvas || !ctx) return;
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const p = PAD;
  const pw = w - p.l - p.r, ph = h - p.t - p.b;

  const isLight = document.documentElement.dataset.theme === 'light';
  const grid = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const axis = isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)';
  const txt  = isLight ? '#888891' : '#55555e';

  ctx.clearRect(0, 0, w, h);
  ctx.font = '11px -apple-system, sans-serif';

  // grid + axes
  ctx.strokeStyle = grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const yp = p.t + ph - ph * (i / 5);
    ctx.fillStyle = txt; ctx.textAlign = 'right';
    ctx.fillText((i / 5).toFixed(1), p.l - 8, yp + 4);
    ctx.beginPath(); ctx.moveTo(p.l, yp); ctx.lineTo(p.l + pw, yp); ctx.stroke();
    const xp = p.l + pw * (i / 5);
    ctx.textAlign = 'center';
    ctx.fillText((i / 5).toFixed(1), xp, p.t + ph + 18);
    ctx.beginPath(); ctx.moveTo(xp, p.t); ctx.lineTo(xp, p.t + ph); ctx.stroke();
  }

  const { sStar } = calc(0.5);
  const sx = p.l + pw * sStar;

  // threshold
  ctx.save(); ctx.strokeStyle = C_S; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(sx, p.t); ctx.lineTo(sx, p.t + ph); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = C_S; ctx.textAlign = 'center';
  ctx.fillText('s* = ' + sStar.toFixed(3), sx, p.t - 10);

  // exact curves, no smoothing: dense polyline of the formulas
  const plot = (color, valueAt, lineWidth = 2) => {
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
    const N = 480;
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const yp = p.t + ph - ph * Math.max(0, Math.min(1, valueAt(s)));
      const xp = p.l + pw * s;
      i === 0 ? ctx.moveTo(xp, yp) : ctx.lineTo(xp, yp);
    }
    ctx.stroke();
  };

  plot(C_R, (s) => Sfun(s));                 // progress S(s)
  plot(C_R, (s) => dSfun(s) / maxDS(), 1);   // horizon R(s) normalized
  plot(C_E, (s) => eNorm(s));                // expectation E(s) normalized

  // stage handles
  tS.forEach((t) => {
    const hx = p.l + pw * t;
    const hy = p.t + ph - ph * Sfun(t);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = C_S; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });

  // current s marker
  const cv = calc(currentS);
  const cx = p.l + pw * currentS;
  ctx.save(); ctx.strokeStyle = axis; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(cx, p.t); ctx.lineTo(cx, p.t + ph); ctx.stroke();
  ctx.restore();

  // diagnostics
  set('out-s-star', cv.sStar.toFixed(3));
  set('out-r-val', cv.R.toFixed(1));
  set('out-e-val', cv.E.toFixed(3));
  set('out-s-val', cv.S.toFixed(3));
  if (document.getElementById('out-de-val')) {
    const el = document.getElementById('out-de-val');
    el.textContent = (cv.dE >= 0 ? '+' : '') + cv.dE.toFixed(2);
    el.className = 'mono ' + (cv.dE < 0 ? 'neg' : '');
  }

  const st = document.getElementById('status-title');
  const sd = document.getElementById('status-desc');
  const si = document.getElementById('status-icon');
  if (st) {
    if (currentS < cv.sStar) {
      si.textContent = '🚀';
      st.textContent = 'Accumulation Phase  (s < s*)';
      sd.textContent = 'Expectations still rising with speed. R(s) below its maximum.';
    } else {
      si.textContent = '⚠️';
      st.textContent = 'Expectation Crash Zone  (s > s*)';
      sd.textContent = 'Real progress climbs; collective expectations collapse.';
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
