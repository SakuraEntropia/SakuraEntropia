/**
 * SakuraEntropia - Interactive Mathematical Models & Simulations
 * 1. The Gradient-Driven Expectation Field (Section 20)
 * 2. Pascal's Wager Expected Utility Simulator (Section 15)
 */

// ============================================================================
// Model 1: The Gradient-Driven Expectation Field
// ============================================================================

let canvas, ctx;
let beta = 1.0;
let currentS = 0.45;
let rMax = 500;

function initModelSimulation() {
  canvas = document.getElementById('modelCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  const sliderBeta = document.getElementById('slider-beta');
  const sliderS = document.getElementById('slider-s');
  const sliderRmax = document.getElementById('slider-rmax');

  if (sliderBeta) {
    sliderBeta.addEventListener('input', (e) => {
      beta = parseFloat(e.target.value);
      document.getElementById('val-beta').textContent = beta.toFixed(2);
      drawModel();
    });
  }

  if (sliderS) {
    sliderS.addEventListener('input', (e) => {
      currentS = parseFloat(e.target.value);
      document.getElementById('val-s').textContent = currentS.toFixed(2);
      drawModel();
    });
  }

  if (sliderRmax) {
    sliderRmax.addEventListener('input', (e) => {
      rMax = parseFloat(e.target.value);
      document.getElementById('val-rmax').textContent = rMax.toFixed(0);
      drawModel();
    });
  }

  // Handle window resizing
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
}

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  // Set physical display resolution
  canvas.width = rect.width * dpr;
  canvas.height = 360 * dpr;
  canvas.style.height = '360px';
  
  ctx.scale(dpr, dpr);
  drawModel();
}

function calculateModelValues(s, b, rm) {
  // R(s) = rm * s^b
  const R = rm * Math.pow(s, b);
  // E(s) = [rm / (b + 1)] * s^b * (1 - s^(b + 1))
  const E = (rm / (b + 1)) * Math.pow(s, b) * (1 - Math.pow(s, b + 1));
  // Derivative dE/ds = rm/(b+1) * s^(b-1) * [b - (2b+1) s^(b+1)]
  const term = b - (2 * b + 1) * Math.pow(s, b + 1);
  const dE = (rm / (b + 1)) * Math.pow(s, b - 1) * term;
  // Threshold s* where dE/ds = 0
  const sStar = Math.pow(b / (2 * b + 1), 1 / (b + 1));

  return { R, E, dE, sStar };
}

function drawModel() {
  if (!canvas || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = 360;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  const padding = { top: 40, right: 40, bottom: 50, left: 60 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const isLight = document.body.getAttribute('data-theme') === 'light';
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const axisColor = isLight ? '#d0d7de' : '#30363d';
  const textColor = isLight ? '#57606a' : '#8b949e';
  const cyanColor = isLight ? '#0284c7' : '#38bdf8';
  const pinkColor = isLight ? '#e23b6b' : '#ff7597';
  const yellowColor = isLight ? '#ca8a04' : '#facc15';

  // Draw Grid Lines & X/Y Labels
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';

  // Horizontal Grid
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const yVal = (rMax / yTicks) * i;
    const yPx = padding.top + plotH - (plotH * (i / yTicks));
    ctx.beginPath();
    ctx.moveTo(padding.left, yPx);
    ctx.lineTo(padding.left + plotW, yPx);
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.fillText(yVal.toFixed(0), padding.left - 10, yPx + 4);
  }

  // Vertical Grid
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const xVal = (1.0 / xTicks) * i;
    const xPx = padding.left + (plotW * (i / xTicks));
    ctx.beginPath();
    ctx.moveTo(xPx, padding.top);
    ctx.lineTo(xPx, padding.top + plotH);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillText(xVal.toFixed(1), xPx, padding.top + plotH + 20);
  }

  // Axis lines
  ctx.strokeStyle = axisColor;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotH);
  ctx.lineTo(padding.left + plotW, padding.top + plotH);
  ctx.stroke();

  // Axis Labels
  ctx.textAlign = 'center';
  ctx.fillText("Normalized Progress Velocity s = S'(t) / max S'(t)", padding.left + plotW / 2, height - 12);
  
  ctx.save();
  ctx.translate(18, padding.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText("Magnitude (Progress & Expectations)", 0, 0);
  ctx.restore();

  // Calculate Critical Points
  const { sStar } = calculateModelValues(0.5, beta, rMax);

  // 1. Draw s* Vertical Line (Threshold)
  const sStarPx = padding.left + plotW * sStar;
  ctx.save();
  ctx.strokeStyle = yellowColor;
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sStarPx, padding.top);
  ctx.lineTo(sStarPx, padding.top + plotH);
  ctx.stroke();
  ctx.restore();

  // Label for s*
  ctx.fillStyle = yellowColor;
  ctx.textAlign = 'center';
  ctx.fillText(`s* = ${sStar.toFixed(3)}`, sStarPx, padding.top - 12);

  // 2. Draw Real Progress R(s) Curve
  ctx.beginPath();
  ctx.strokeStyle = cyanColor;
  ctx.lineWidth = 2.5;
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const { R } = calculateModelValues(s, beta, rMax);
    const xPx = padding.left + plotW * s;
    const yPx = padding.top + plotH - (plotH * (R / rMax));
    if (i === 0) ctx.moveTo(xPx, yPx);
    else ctx.lineTo(xPx, yPx);
  }
  ctx.stroke();

  // 3. Draw Expectation Field E(s) Curve
  ctx.beginPath();
  ctx.strokeStyle = pinkColor;
  ctx.lineWidth = 2.5;
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const { E } = calculateModelValues(s, beta, rMax);
    const xPx = padding.left + plotW * s;
    const yPx = padding.top + plotH - (plotH * (E / rMax));
    if (i === 0) ctx.moveTo(xPx, yPx);
    else ctx.lineTo(xPx, yPx);
  }
  ctx.stroke();

  // 4. Draw Current Progress Crosshair & Points
  const currVals = calculateModelValues(currentS, beta, rMax);
  const currXPx = padding.left + plotW * currentS;
  const currRPx = padding.top + plotH - (plotH * (currVals.R / rMax));
  const currEPx = padding.top + plotH - (plotH * (currVals.E / rMax));

  // Current s vertical guide
  ctx.save();
  ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(currXPx, padding.top);
  ctx.lineTo(currXPx, padding.top + plotH);
  ctx.stroke();
  ctx.restore();

  // Point on R(s)
  ctx.fillStyle = cyanColor;
  ctx.beginPath();
  ctx.arc(currXPx, currRPx, 6, 0, Math.PI * 2);
  ctx.fill();

  // Point on E(s)
  ctx.fillStyle = pinkColor;
  ctx.beginPath();
  ctx.arc(currXPx, currEPx, 6, 0, Math.PI * 2);
  ctx.fill();

  // 5. Update Diagnostics UI
  updateDiagnosticsUI(currVals, currentS);
}

function updateDiagnosticsUI(vals, s) {
  const sStarElem = document.getElementById('out-s-star');
  const rElem = document.getElementById('out-r-val');
  const eElem = document.getElementById('out-e-val');
  const deElem = document.getElementById('out-de-val');

  if (sStarElem) sStarElem.textContent = vals.sStar.toFixed(3);
  if (rElem) rElem.textContent = vals.R.toFixed(1);
  if (eElem) eElem.textContent = vals.E.toFixed(1);
  
  if (deElem) {
    deElem.textContent = (vals.dE >= 0 ? '+' : '') + vals.dE.toFixed(1);
    deElem.className = 'diag-val ' + (vals.dE < 0 ? 'negative' : 'positive');
  }

  // Update Status Alert Card
  const statusIcon = document.getElementById('status-icon');
  const statusTitle = document.getElementById('status-title');
  const statusDesc = document.getElementById('status-desc');

  if (statusTitle && statusDesc) {
    if (s < vals.sStar) {
      statusIcon.textContent = '🚀';
      statusTitle.textContent = 'Acceleration Phase: Expectations Rising (s < s*)';
      statusDesc.textContent = `Societal expectation gradient dE/ds is positive (+${vals.dE.toFixed(1)}). The public still believes increasing technological speed directly translates to personal well-being.`;
    } else {
      statusIcon.textContent = '⚠️';
      statusTitle.textContent = 'Expectation Crash Zone: Progress Accelerates, Sentiment Plunges (s > s*)';
      statusDesc.textContent = `Progress velocity s (${s.toFixed(2)}) has breached the ceiling threshold s* (${vals.sStar.toFixed(2)}). Even though real capacity R(t) is climbing, the expectation field has collapsed (dE/ds = ${vals.dE.toFixed(1)}). Societal burnout and cynicism prevail.`;
    }
  }
}

// ============================================================================
// Model 2: Pascal's Wager 2x2 Matrix & Utility Simulator
// ============================================================================

const caseDetails = {
  1: {
    title: "Case I: Belief in a World with God",
    desc: "Metaphysical alignment with reality. In a non-interventionist framework, God acts as the creator of universal laws rather than a miracle dispenser. Belief yields no magical immunity from physical suffering, but provides objective alignment with cosmic architecture."
  },
  2: {
    title: "Case II (Core Thesis): Secular Utility of Belief in an Empty Universe",
    desc: "Even if God does not exist, genuine faith offers tangible secular benefits: psychological resilience against historical contingency, moral grounding beyond transactional utility, and courage to confront near-zero odds. Net utility depends on minimizing dogmatic cost while maximizing existential grounding."
  },
  3: {
    title: "Case III: Disbelief in a World with God",
    desc: "Holding an erroneous metaphysical conviction. Yet an abstract creator of cosmic order values authentic intellectual honesty, rigorous skepticism, and moral integrity infinitely more than superficial religious conformity."
  },
  4: {
    title: "Case IV: Disbelief in a Godless World",
    desc: "Epistemic alignment with an unguided universe. Secular humanism, mathematics, and the arts supply rich frameworks for meaning and persistence. Disbelief is an autonomous, dignified choice."
  }
};

function showCaseDetails(caseNum) {
  document.querySelectorAll('.matrix-cell').forEach(c => c.classList.remove('active'));
  const target = document.querySelector(`.matrix-cell.case-${caseNum}`);
  if (target) target.classList.add('active');

  const verdict = document.getElementById('wager-verdict');
  if (verdict && caseDetails[caseNum]) {
    verdict.innerHTML = `<strong>${caseDetails[caseNum].title}:</strong> ${caseDetails[caseNum].desc}`;
  }
}

function initWagerSimulator() {
  const simP = document.getElementById('sim-prob');
  const simUbn = document.getElementById('sim-ubn');
  const simUnn = document.getElementById('sim-unn');

  function updateWager() {
    const p = parseFloat(simP ? simP.value : 0.15);
    const ubn = parseFloat(simUbn ? simUbn.value : 40);
    const unn = parseFloat(simUnn ? simUnn.value : 30);

    const ubg = 80; // Utility if God exists and you believe
    const ung = 20; // Utility if God exists and you disbelieve

    // Expected utility formulas
    const euB = p * ubg + (1 - p) * ubn;
    const euN = p * ung + (1 - p) * unn;

    const valP = document.getElementById('val-sim-p');
    const valUbn = document.getElementById('val-sim-ubn');
    const valUnn = document.getElementById('val-sim-unn');
    const outEuB = document.getElementById('out-eu-b');
    const outEuN = document.getElementById('out-eu-n');

    if (valP) valP.textContent = p.toFixed(2);
    if (valUbn) valUbn.textContent = (ubn >= 0 ? '+' : '') + ubn;
    if (valUnn) valUnn.textContent = (unn >= 0 ? '+' : '') + unn;

    if (outEuB) outEuB.textContent = euB.toFixed(1);
    if (outEuN) outEuN.textContent = euN.toFixed(1);

    const verdict = document.getElementById('wager-verdict');
    if (verdict) {
      if (euB > euN) {
        verdict.innerHTML = `<strong>Pragmatic Rationality holds [EU(B) = ${euB.toFixed(1)} > EU(N) = ${euN.toFixed(1)}]:</strong> Faith yields positive net expected utility, even with modest subjective probability p = ${p.toFixed(2)}, through existential anchoring.`;
      } else {
        verdict.innerHTML = `<strong>Secular Rationalism holds [EU(N) = ${euN.toFixed(1)} ≥ EU(B) = ${euB.toFixed(1)}]:</strong> The cognitive clarity and autonomy of secular skepticism outweigh the pragmatic utility of faith.`;
      }
    }
  }

  if (simP) simP.addEventListener('input', updateWager);
  if (simUbn) simUbn.addEventListener('input', updateWager);
  if (simUnn) simUnn.addEventListener('input', updateWager);

  updateWager();
}

// Export initialization for app.js
window.initModelSimulation = initModelSimulation;
window.initWagerSimulator = initWagerSimulator;
window.showCaseDetails = showCaseDetails;
