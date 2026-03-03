/* ═══════════════════════════════════════════════════════════
   THE MEDICI, DISTILLED — Animated Sacred Geometry
   Each quote gets a unique generative art piece that reflects
   its meaning through geometry, motion, and mathematical beauty.

   Architecture: 20 parametric base functions + unique configs
   for all 94 quotes. Every page looks distinct.
   ═══════════════════════════════════════════════════════════ */

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio
const TAU = Math.PI * 2;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height, cx: rect.width / 2, cy: rect.height / 2 };
}

/* --- Color Palette --- */
const C = {
  gold: '#b8923a',
  goldSoft: 'rgba(184, 146, 58, 0.9)',
  ink: '#3e372d',
  inkSoft: 'rgba(62, 55, 45, 0.75)',
  inkFaint: 'rgba(62, 55, 45, 0.90)',
  bg: '#f5f0e4',
  walnut: '#5c3d28',
  green: '#2d5a3a',
};

/* --- Alpha boost helper: clamp(alpha * boost, 0, 1) for visibility --- */
function A(alpha) { return Math.min(1, alpha * 3.0); }

/* --- Easing --- */
function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function lerp(a, b, t) { return a + (b - a) * t; }


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 1: NETWORK
   Nodes with connection lines. Organic influence patterns.
   Config: nodeCount, connectionRadius, driftSpeed, showCenter
   ═══════════════════════════════════════════════════════════ */
function makeNetwork(config) {
  const { nodeCount = 18, connectionRadius = 0.4, driftSpeed = 0.3, showCenter = false } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);
    const nodes = [];
    const connections = [];

    function init() {
      nodes.length = 0;
      connections.length = 0;
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * TAU + Math.random() * 0.3;
        const r = 60 + Math.random() * (Math.min(w, h) * 0.32);
        nodes.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          phase: Math.random() * TAU,
          drift: 0.2 + Math.random() * driftSpeed,
          radius: 1.5 + Math.random() * 2,
        });
      }
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < Math.min(w, h) * connectionRadius) {
            connections.push({ a: i, b: j, dist, reveal: Math.random() * 4 + 1 });
          }
        }
      }
    }

    function draw(t) {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;

      for (const n of nodes) {
        n.dx = Math.sin(s * n.drift + n.phase) * 8;
        n.dy = Math.cos(s * n.drift * 0.7 + n.phase) * 6;
      }

      for (const c of connections) {
        const a = nodes[c.a];
        const b = nodes[c.b];
        const ax = a.x + a.dx, ay = a.y + a.dy;
        const bx = b.x + b.dx, by = b.y + b.dy;
        const reveal = Math.min(1, s / c.reveal);
        if (reveal <= 0) continue;
        const alpha = reveal * (0.04 + 0.06 * (1 - c.dist / (Math.min(w, h) * connectionRadius)));
        ctx.strokeStyle = `rgba(62, 55, 45, ${A(alpha)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const mx = (ax + bx) / 2 + (ay - by) * 0.08;
        const my = (ay + by) / 2 + (bx - ax) * 0.08;
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(mx, my, bx, by);
        ctx.stroke();
      }

      for (const n of nodes) {
        const pulse = 0.6 + 0.4 * Math.sin(s * 1.5 + n.phase);
        ctx.beginPath();
        ctx.arc(n.x + n.dx, n.y + n.dy, n.radius * pulse, 0, TAU);
        ctx.fillStyle = `rgba(184, 146, 58, ${A(0.15 + pulse * 0.2)})`;
        ctx.fill();
      }

      if (showCenter) {
        const cp = 0.5 + 0.5 * Math.sin(s);
        ctx.beginPath();
        ctx.arc(cx, cy, 4 + cp * 3, 0, TAU);
        ctx.fillStyle = `rgba(184, 146, 58, ${A(0.1 + cp * 0.15)})`;
        ctx.fill();
      }
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
    init();
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 2: BLADES
   Rotating sharp shapes converging inward.
   Config: bladeCount, rotationSpeed, breatheSpeed, inward
   ═══════════════════════════════════════════════════════════ */
function makeBlades(config) {
  const { bladeCount = 12, rotationSpeed = 0.08, breatheSpeed = 8, inward = true } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);
    const blades = [];

    function init() {
      blades.length = 0;
      const R = Math.min(w, h) * 0.38;
      for (let i = 0; i < bladeCount; i++) {
        const angle = (i / bladeCount) * TAU;
        blades.push({
          angle,
          baseR: R,
          length: 30 + Math.random() * 40,
          width: 1 + Math.random() * 2,
          speed: rotationSpeed + Math.random() * 0.05,
          phase: Math.random() * TAU,
        });
      }
    }

    function draw(t) {
      ctx.fillStyle = 'rgba(245, 240, 228, 0.04)';
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;

      ctx.strokeStyle = 'rgba(62, 55, 45, 0.54)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * 0.4, 0, TAU);
      ctx.stroke();

      for (const b of blades) {
        const breathe = Math.sin(s * b.speed * breatheSpeed + b.phase);
        const r = b.baseR + breathe * 20;
        const rotation = s * b.speed;
        const a = b.angle + rotation;

        const ox = cx + Math.cos(a) * r;
        const oy = cy + Math.sin(a) * r;
        const tipR = inward ? (r - b.length) : (r + b.length);
        const ix = cx + Math.cos(a) * tipR;
        const iy = cy + Math.sin(a) * tipR;

        const perpX = Math.cos(a + Math.PI / 2) * b.width;
        const perpY = Math.sin(a + Math.PI / 2) * b.width;

        const alpha = 0.08 + Math.abs(breathe) * 0.12;
        ctx.fillStyle = `rgba(62, 55, 45, ${A(alpha)})`;
        ctx.beginPath();
        ctx.moveTo(ix, iy);
        ctx.lineTo(ox + perpX, oy + perpY);
        ctx.lineTo(ox - perpX, oy - perpY);
        ctx.closePath();
        ctx.fill();
      }

      const centerPulse = 0.5 + 0.5 * Math.sin(s * 2);
      ctx.beginPath();
      ctx.arc(cx, cy, 3 + centerPulse * 2, 0, TAU);
      ctx.fillStyle = `rgba(168, 90, 58, ${A(0.1 + centerPulse * 0.15)})`;
      ctx.fill();
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
    init();
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 3: BREATHING RINGS
   Concentric circles that expand/contract.
   Config: ringCount, breatheSpeed, showSpiral, showRadials
   ═══════════════════════════════════════════════════════════ */
function makeBreathingRings(config) {
  const { ringCount = 9, breatheSpeed = 0.5, showSpiral = true, showRadials = true } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);
    const rings = [];

    function init() {
      rings.length = 0;
      const maxR = Math.min(w, h) * 0.42;
      for (let i = 0; i < ringCount; i++) {
        const ratio = (i + 1) / ringCount;
        rings.push({
          baseR: maxR * ratio,
          phase: i * 0.4,
          breatheAmp: 4 + i * 2,
          opacity: 0.04 + (1 - ratio) * 0.08,
        });
      }
    }

    function draw(t) {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;

      if (showRadials) {
        ctx.strokeStyle = 'rgba(62, 55, 45, 0.18)';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU + s * 0.02;
          const maxR = Math.min(w, h) * 0.45;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
          ctx.stroke();
        }
      }

      for (const ring of rings) {
        const breathe = Math.sin(s * breatheSpeed + ring.phase) * ring.breatheAmp;
        const r = ring.baseR + breathe;
        ctx.strokeStyle = `rgba(62, 55, 45, ${A(ring.opacity)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.stroke();
      }

      if (showSpiral) {
        ctx.strokeStyle = 'rgba(184, 146, 58, 0.54)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for (let a = 0; a < TAU * 4; a += 0.05) {
          const r = 5 * Math.pow(PHI, a / TAU) + Math.sin(s * 0.3 + a) * 2;
          if (r > Math.min(w, h) * 0.45) break;
          const x = cx + Math.cos(a + s * 0.1) * r;
          const y = cy + Math.sin(a + s * 0.1) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
    init();
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 4: CRYSTAL
   Geometric facets forming under pressure.
   Config: facetSides, pressureLineCount, layerCount, growSpeed
   ═══════════════════════════════════════════════════════════ */
function makeCrystal(config) {
  const { facetSides = 6, pressureLineCount = 30, layerCount = 3, growSpeed = 0.3 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);
    const pressureLines = [];

    function init() {
      pressureLines.length = 0;
      for (let i = 0; i < pressureLineCount; i++) {
        const side = Math.floor(Math.random() * 4);
        let sx, sy;
        if (side === 0) { sx = Math.random() * w; sy = 0; }
        else if (side === 1) { sx = w; sy = Math.random() * h; }
        else if (side === 2) { sx = Math.random() * w; sy = h; }
        else { sx = 0; sy = Math.random() * h; }
        const angle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.5;
        pressureLines.push({
          sx, sy, angle,
          length: 40 + Math.random() * 80,
          speed: 0.5 + Math.random() * 1.5,
          phase: Math.random() * TAU,
        });
      }
    }

    function draw(t) {
      ctx.fillStyle = 'rgba(245, 240, 228, 0.03)';
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const pressure = 0.5 + 0.5 * Math.sin(s * growSpeed);

      for (const p of pressureLines) {
        const advance = (Math.sin(s * p.speed + p.phase) * 0.5 + 0.5) * 0.6;
        const dist = Math.hypot(cx - p.sx, cy - p.sy);
        const startFrac = advance;
        const endFrac = advance + p.length / dist;
        const x1 = p.sx + Math.cos(p.angle) * dist * startFrac;
        const y1 = p.sy + Math.sin(p.angle) * dist * startFrac;
        const x2 = p.sx + Math.cos(p.angle) * dist * Math.min(endFrac, 0.85);
        const y2 = p.sy + Math.sin(p.angle) * dist * Math.min(endFrac, 0.85);
        ctx.strokeStyle = `rgba(62, 55, 45, ${A(0.03 + pressure * 0.04)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      const crystalR = Math.min(w, h) * (0.12 + pressure * 0.06);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, crystalR * 1.5);
      grad.addColorStop(0, `rgba(184, 146, 58, ${A(0.03 + pressure * 0.05)})`);
      grad.addColorStop(1, 'rgba(184, 146, 58, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - crystalR * 2, cy - crystalR * 2, crystalR * 4, crystalR * 4);

      for (let layer = 0; layer < layerCount; layer++) {
        const layerR = crystalR * (0.4 + layer * (0.6 / layerCount));
        const rotation = s * 0.05 * (layer % 2 === 0 ? 1 : -1);
        ctx.strokeStyle = `rgba(184, 146, 58, ${A(0.06 + layer * 0.04 + pressure * 0.08)})`;
        ctx.lineWidth = 1.2 + layer * 0.3;
        ctx.beginPath();
        for (let i = 0; i <= facetSides; i++) {
          const a = (i / facetSides) * TAU + rotation;
          const x = cx + Math.cos(a) * layerR;
          const y = cy + Math.sin(a) * layerR;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        if (layer > 0) {
          const innerR = crystalR * (0.4 + (layer - 1) * (0.6 / layerCount));
          ctx.strokeStyle = `rgba(184, 146, 58, ${A(0.03 + pressure * 0.04)})`;
          ctx.lineWidth = 0.8;
          for (let i = 0; i < facetSides; i++) {
            const a = (i / facetSides) * TAU + rotation;
            const aInner = (i / facetSides) * TAU + s * 0.05 * ((layer - 1) % 2 === 0 ? 1 : -1);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * layerR, cy + Math.sin(a) * layerR);
            ctx.lineTo(cx + Math.cos(aInner) * innerR, cy + Math.sin(aInner) * innerR);
            ctx.stroke();
          }
        }
      }
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
    init();
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 5: MANDALA
   Building and dissolving pattern.
   Config: layers, segments, cycleDuration
   ═══════════════════════════════════════════════════════════ */
function makeMandala(config) {
  const { layers = 7, segments = 6, cycleDuration = 20 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);
    const particles = [];
    const maxParticles = 600;

    function init() { particles.length = 0; }

    function draw(t) {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const phase = (s % cycleDuration) / cycleDuration;
      const buildPhase = Math.min(1, phase / 0.6);
      const dissolvePhase = phase > 0.7 ? (phase - 0.7) / 0.3 : 0;
      const maxR = Math.min(w, h) * 0.38;
      const builtLayers = Math.ceil(buildPhase * layers);

      for (let layer = 0; layer < builtLayers; layer++) {
        const layerFrac = (layer + 1) / layers;
        const r = maxR * layerFrac;
        const seg = segments + layer * 2;
        const layerBuild = layer < builtLayers - 1 ? 1 : (buildPhase * layers) % 1;
        const dissolveOffset = Math.max(0, dissolvePhase - layer * 0.05);
        const opacity = (0.06 + layer * 0.02) * (1 - dissolveOffset * 2);
        if (opacity <= 0) continue;

        const rotation = s * 0.03 * (layer % 2 === 0 ? 1 : -1);
        ctx.strokeStyle = layer % 2 === 0
          ? `rgba(184, 146, 58, ${A(opacity)})`
          : `rgba(62, 55, 45, ${A(opacity)})`;
        ctx.lineWidth = 1.2 + layer * 0.1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, rotation, rotation + TAU * layerBuild);
        ctx.stroke();

        if (layerBuild > 0.5) {
          const petalR = r * 0.15;
          for (let si = 0; si < seg; si++) {
            const a = (si / seg) * TAU + rotation;
            const px = cx + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            ctx.strokeStyle = `rgba(184, 146, 58, ${A(opacity * 0.7)})`;
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(px, py, petalR, 0, TAU);
            ctx.stroke();
          }
        }

        if (dissolveOffset > 0 && dissolveOffset < 0.5 && Math.random() < 0.3) {
          const a = Math.random() * TAU;
          particles.push({
            x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r,
            vx: (Math.random() - 0.5) * 0.5, vy: -0.3 - Math.random() * 0.8,
            life: 1, decay: 0.005 + Math.random() * 0.01,
            size: 0.5 + Math.random() * 1.5, gold: Math.random() > 0.5,
          });
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        const alpha = p.life * 0.2;
        ctx.fillStyle = p.gold
          ? `rgba(184, 146, 58, ${A(alpha)})`
          : `rgba(62, 55, 45, ${A(alpha)})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      while (particles.length > maxParticles) particles.shift();
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
    init();
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 6: REPETITION
   Shape traced over and over.
   Config: shape(circle/polygon), traceSpeed, fadeRate, sides
   ═══════════════════════════════════════════════════════════ */
function makeRepetition(config) {
  const { shape = 'circle', traceSpeed = 0.8, fadeRate = 0.008, sides = 6 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);

    function init() {}

    function draw(t) {
      ctx.fillStyle = `rgba(245, 240, 228, ${fadeRate})`;
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const r = Math.min(w, h) * 0.3;
      const traceAngle = (s * traceSpeed) % TAU;

      let x, y;
      if (shape === 'circle') {
        x = cx + Math.cos(traceAngle) * r;
        y = cy + Math.sin(traceAngle) * r;
      } else {
        const sideAngle = TAU / sides;
        const segment = Math.floor((traceAngle / TAU) * sides);
        const segFrac = ((traceAngle / TAU) * sides) % 1;
        const a1 = segment * sideAngle - Math.PI / 2;
        const a2 = (segment + 1) * sideAngle - Math.PI / 2;
        x = cx + lerp(Math.cos(a1), Math.cos(a2), segFrac) * r;
        y = cy + lerp(Math.sin(a1), Math.sin(a2), segFrac) * r;
      }

      ctx.fillStyle = 'rgba(184, 146, 58, 0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = 'rgba(62, 55, 45, 0.12)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (shape === 'circle') {
        ctx.arc(cx, cy, r, 0, TAU);
      } else {
        for (let i = 0; i <= sides; i++) {
          const a = (i / sides) * TAU - Math.PI / 2;
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 7: PENDULUM
   Swinging/oscillating elements.
   Config: count, dampening, length, pivotY
   ═══════════════════════════════════════════════════════════ */
function makePendulum(config) {
  const { count = 5, dampening = 0.98, length = 0.6, pivotY = 0.15 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);
    const pendulums = [];

    function init() {
      pendulums.length = 0;
      const L = Math.min(w, h) * length;
      const spacing = w / (count + 1);
      for (let i = 0; i < count; i++) {
        pendulums.push({
          px: spacing * (i + 1),
          py: h * pivotY,
          len: L * (0.7 + (i / count) * 0.6),
          phase: (i / count) * Math.PI * 0.5,
          freq: 0.4 + i * 0.08,
          amp: 0.4 + Math.random() * 0.3,
        });
      }
    }

    function draw(t) {
      ctx.fillStyle = 'rgba(245, 240, 228, 0.04)';
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;

      for (const p of pendulums) {
        const angle = Math.sin(s * p.freq + p.phase) * p.amp;
        const bx = p.px + Math.sin(angle) * p.len;
        const by = p.py + Math.cos(angle) * p.len;

        ctx.strokeStyle = 'rgba(62, 55, 45, 0.54)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(bx, by);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p.px, p.py, 2, 0, TAU);
        ctx.fillStyle = 'rgba(62, 55, 45, 0.90)';
        ctx.fill();

        const pulse = 0.5 + 0.5 * Math.sin(s * 2 + p.phase);
        ctx.beginPath();
        ctx.arc(bx, by, 4 + pulse * 2, 0, TAU);
        ctx.fillStyle = `rgba(184, 146, 58, ${A(0.1 + pulse * 0.15)})`;
        ctx.fill();

        // Trail arc
        ctx.strokeStyle = 'rgba(184, 146, 58, 0.27)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.len, Math.PI / 2 - p.amp, Math.PI / 2 + p.amp);
        ctx.stroke();
      }
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
    init();
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 8: FLOW FIELD
   Flowing lines like currents.
   Config: direction, density, turbulence
   ═══════════════════════════════════════════════════════════ */
function makeFlowField(config) {
  const { direction = 0, density = 40, turbulence = 1.5 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);
    const lines = [];

    function init() {
      lines.length = 0;
      for (let i = 0; i < density; i++) {
        lines.push({
          x: Math.random() * w,
          y: Math.random() * h,
          origX: 0, origY: 0,
          phase: Math.random() * TAU,
          speed: 0.3 + Math.random() * 0.7,
          length: 20 + Math.random() * 60,
        });
        lines[i].origX = lines[i].x;
        lines[i].origY = lines[i].y;
      }
    }

    function noise(x, y, s) {
      return Math.sin(x * 0.01 + s) * Math.cos(y * 0.01 + s * 0.7) * turbulence;
    }

    function draw(t) {
      ctx.fillStyle = 'rgba(245, 240, 228, 0.04)';
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;

      for (const line of lines) {
        const angle = direction + noise(line.origX, line.origY, s * line.speed + line.phase);
        const x1 = line.origX + Math.sin(s * 0.2 + line.phase) * 20;
        const y1 = line.origY + Math.cos(s * 0.15 + line.phase) * 15;
        const x2 = x1 + Math.cos(angle) * line.length;
        const y2 = y1 + Math.sin(angle) * line.length;

        const alpha = 0.03 + 0.04 * Math.abs(Math.sin(s * 0.5 + line.phase));
        ctx.strokeStyle = `rgba(62, 55, 45, ${A(alpha)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const cmx = (x1 + x2) / 2 + Math.sin(angle + Math.PI / 2) * line.length * 0.2;
        const cmy = (y1 + y2) / 2 + Math.cos(angle + Math.PI / 2) * line.length * 0.2;
        ctx.quadraticCurveTo(cmx, cmy, x2, y2);
        ctx.stroke();

        // Tiny dot at tip
        ctx.beginPath();
        ctx.arc(x2, y2, 0.8, 0, TAU);
        ctx.fillStyle = `rgba(184, 146, 58, ${A(alpha * 2)})`;
        ctx.fill();
      }
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
    init();
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 9: EROSION
   Something whole breaking into particles.
   Config: shape(circle/square/hexagon), breakSpeed, particleCount
   ═══════════════════════════════════════════════════════════ */
function makeErosion(config) {
  const { shape = 'circle', breakSpeed = 0.15, particleCount = 80 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);
    const particles = [];

    function init() {
      particles.length = 0;
      const R = Math.min(w, h) * 0.25;
      for (let i = 0; i < particleCount; i++) {
        let x, y;
        if (shape === 'circle') {
          const a = (i / particleCount) * TAU;
          const r = R * (0.3 + Math.random() * 0.7);
          x = cx + Math.cos(a) * r;
          y = cy + Math.sin(a) * r;
        } else if (shape === 'square') {
          x = cx + (Math.random() - 0.5) * R * 2;
          y = cy + (Math.random() - 0.5) * R * 2;
        } else {
          const a = (i / particleCount) * TAU;
          const r = R * (0.4 + Math.random() * 0.6);
          x = cx + Math.cos(a) * r;
          y = cy + Math.sin(a) * r;
        }
        const angle = Math.atan2(y - cy, x - cx);
        particles.push({
          homeX: x, homeY: y,
          angle,
          dist: Math.hypot(x - cx, y - cy),
          phase: Math.random() * TAU,
          speed: 0.5 + Math.random(),
          size: 1 + Math.random() * 2,
        });
      }
    }

    function draw(t) {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const cycle = (s * breakSpeed) % 1;
      const erode = ease(Math.min(1, cycle * 2));
      const reform = cycle > 0.5 ? ease((cycle - 0.5) * 2) : 0;
      const displacement = erode * (1 - reform);

      for (const p of particles) {
        const drift = displacement * (40 + p.speed * 60);
        const wobble = Math.sin(s * p.speed + p.phase) * 5 * displacement;
        const x = p.homeX + Math.cos(p.angle) * drift + wobble;
        const y = p.homeY + Math.sin(p.angle) * drift - displacement * 20 * p.speed;

        const alpha = 0.08 + (1 - displacement) * 0.15;
        ctx.fillStyle = p.dist < Math.min(w, h) * 0.12
          ? `rgba(184, 146, 58, ${A(alpha)})`
          : `rgba(62, 55, 45, ${A(alpha * 0.7)})`;
        ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
      }

      // Ghost outline
      if (displacement > 0.1) {
        ctx.strokeStyle = `rgba(62, 55, 45, ${A(0.03 * (1 - displacement))})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (shape === 'circle') {
          ctx.arc(cx, cy, Math.min(w, h) * 0.25, 0, TAU);
        } else {
          const R = Math.min(w, h) * 0.25;
          const sides = shape === 'square' ? 4 : 6;
          for (let i = 0; i <= sides; i++) {
            const a = (i / sides) * TAU - Math.PI / 2;
            const px = cx + Math.cos(a) * R;
            const py = cy + Math.sin(a) * R;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
    init();
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 10: MIRROR
   Symmetric reflection pattern.
   Config: foldCount, rotationSpeed, complexity
   ═══════════════════════════════════════════════════════════ */
function makeMirror(config) {
  const { foldCount = 6, rotationSpeed = 0.05, complexity = 3 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);

    function draw(t) {
      ctx.fillStyle = 'rgba(245, 240, 228, 0.04)';
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const maxR = Math.min(w, h) * 0.38;

      for (let fold = 0; fold < foldCount; fold++) {
        const baseAngle = (fold / foldCount) * TAU + s * rotationSpeed;

        for (let c = 0; c < complexity; c++) {
          const r = maxR * (0.3 + c * 0.25);
          const wobble = Math.sin(s * 0.3 + fold * 0.5 + c) * 15;

          const x1 = cx + Math.cos(baseAngle) * (r * 0.2);
          const y1 = cy + Math.sin(baseAngle) * (r * 0.2);
          const x2 = cx + Math.cos(baseAngle) * (r + wobble);
          const y2 = cy + Math.sin(baseAngle) * (r + wobble);

          const cpAngle = baseAngle + Math.sin(s * 0.5 + c) * 0.3;
          const cpx = cx + Math.cos(cpAngle) * r * 0.6;
          const cpy = cy + Math.sin(cpAngle) * r * 0.6;

          const alpha = 0.04 + 0.03 * Math.sin(s * 0.8 + fold + c);
          ctx.strokeStyle = c % 2 === 0
            ? `rgba(184, 146, 58, ${A(alpha)})`
            : `rgba(62, 55, 45, ${A(alpha)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cpx, cpy, x2, y2);
          ctx.stroke();
        }
      }

      // Center reflection point
      const cp = 0.5 + 0.5 * Math.sin(s * 1.5);
      ctx.beginPath();
      ctx.arc(cx, cy, 2 + cp * 2, 0, TAU);
      ctx.fillStyle = `rgba(184, 146, 58, ${A(0.08 + cp * 0.1)})`;
      ctx.fill();
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 11: ORBIT
   Celestial orbital paths.
   Config: orbitCount, eccentricity, showTrails
   ═══════════════════════════════════════════════════════════ */
function makeOrbit(config) {
  const { orbitCount = 5, eccentricity = 0.6, showTrails = true } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);
    const orbits = [];

    function init() {
      orbits.length = 0;
      const maxR = Math.min(w, h) * 0.38;
      for (let i = 0; i < orbitCount; i++) {
        const frac = (i + 1) / orbitCount;
        orbits.push({
          rx: maxR * frac,
          ry: maxR * frac * eccentricity,
          speed: 0.1 + (1 - frac) * 0.2,
          phase: (i / orbitCount) * TAU,
          tilt: (i * 0.2) - orbitCount * 0.1,
          size: 2 + i * 0.5,
        });
      }
    }

    function draw(t) {
      ctx.fillStyle = showTrails ? 'rgba(245, 240, 228, 0.03)' : C.bg;
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;

      for (const o of orbits) {
        // Orbit path
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(o.tilt);
        ctx.strokeStyle = 'rgba(62, 55, 45, 0.36)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, TAU);
        ctx.stroke();

        // Orbiting body
        const a = s * o.speed + o.phase;
        const bx = Math.cos(a) * o.rx;
        const by = Math.sin(a) * o.ry;
        const pulse = 0.7 + 0.3 * Math.sin(s * 2 + o.phase);
        ctx.beginPath();
        ctx.arc(bx, by, o.size * pulse, 0, TAU);
        ctx.fillStyle = `rgba(184, 146, 58, ${A(0.1 + pulse * 0.2)})`;
        ctx.fill();

        ctx.restore();
      }

      // Central body
      const cp = 0.5 + 0.5 * Math.sin(s * 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, 3 + cp * 2, 0, TAU);
      ctx.fillStyle = `rgba(62, 55, 45, ${A(0.06 + cp * 0.06)})`;
      ctx.fill();
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
    init();
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 12: SPIRAL
   Golden/logarithmic spiral.
   Config: armCount, tightness, growthRate
   ═══════════════════════════════════════════════════════════ */
function makeSpiral(config) {
  const { armCount = 1, tightness = 0.15, growthRate = 0.05 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);

    function draw(t) {
      ctx.fillStyle = 'rgba(245, 240, 228, 0.03)';
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const maxR = Math.min(w, h) * 0.42;

      for (let arm = 0; arm < armCount; arm++) {
        const armOffset = (arm / armCount) * TAU;
        const isGold = arm % 2 === 0;

        ctx.strokeStyle = isGold
          ? `rgba(184, 146, 58, 0.18)`
          : `rgba(62, 55, 45, 0.15)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        let first = true;
        for (let a = 0; a < TAU * 6; a += 0.03) {
          const r = tightness * Math.pow(PHI, a * growthRate * 10) + a * 0.5;
          if (r > maxR) break;
          const angle = a + armOffset + s * 0.08;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (first) { ctx.moveTo(x, y); first = false; }
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Breathing center
      const cp = 0.5 + 0.5 * Math.sin(s * 0.8);
      ctx.beginPath();
      ctx.arc(cx, cy, 2 + cp * 2, 0, TAU);
      ctx.fillStyle = `rgba(184, 146, 58, ${A(0.1 + cp * 0.1)})`;
      ctx.fill();
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 13: TREE
   Branching fractal.
   Config: depth, spread, sway
   ═══════════════════════════════════════════════════════════ */
function makeTree(config) {
  const { depth = 8, spread = 0.5, sway = 0.3 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);

    function drawBranch(x, y, angle, len, d, s) {
      if (d <= 0 || len < 2) return;
      const swayOffset = Math.sin(s * 0.5 + d * 0.8 + x * 0.01) * sway * 0.1;
      const endX = x + Math.cos(angle + swayOffset) * len;
      const endY = y + Math.sin(angle + swayOffset) * len;

      const alpha = 0.03 + (d / depth) * 0.08;
      const isGold = d <= 2;
      ctx.strokeStyle = isGold
        ? `rgba(184, 146, 58, ${A(alpha * 1.5)})`
        : `rgba(62, 55, 45, ${A(alpha)})`;
      ctx.lineWidth = d * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      if (d <= 2) {
        ctx.beginPath();
        ctx.arc(endX, endY, 1.5, 0, TAU);
        ctx.fillStyle = `rgba(184, 146, 58, ${A(alpha)})`;
        ctx.fill();
      }

      const newLen = len * (0.65 + Math.random() * 0.1);
      drawBranch(endX, endY, angle - spread + swayOffset, newLen, d - 1, s);
      drawBranch(endX, endY, angle + spread + swayOffset, newLen, d - 1, s);
    }

    function draw(t) {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const trunkLen = Math.min(w, h) * 0.12;

      // Seed the random for consistent branching
      const savedRandom = Math.random;
      let seed = 42;
      Math.random = function() { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };

      drawBranch(cx, h * 0.85, -Math.PI / 2, trunkLen, depth, s);

      Math.random = savedRandom;
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 14: WAVE
   Overlapping sine waves.
   Config: waveCount, frequency, amplitude
   ═══════════════════════════════════════════════════════════ */
function makeWave(config) {
  const { waveCount = 5, frequency = 2, amplitude = 0.15 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);

    function draw(t) {
      ctx.fillStyle = 'rgba(245, 240, 228, 0.04)';
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const amp = Math.min(w, h) * amplitude;

      for (let wi = 0; wi < waveCount; wi++) {
        const phaseOffset = (wi / waveCount) * Math.PI;
        const freq = frequency * (0.8 + wi * 0.15);
        const yOffset = cy + (wi - waveCount / 2) * (amp * 0.6);

        const isGold = wi === Math.floor(waveCount / 2);
        const alpha = 0.04 + 0.03 * Math.sin(s * 0.3 + wi);
        ctx.strokeStyle = isGold
          ? `rgba(184, 146, 58, ${A(alpha * 2)})`
          : `rgba(62, 55, 45, ${A(alpha)})`;
        ctx.lineWidth = isGold ? 0.8 : 0.5;

        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const progress = x / w;
          const y = yOffset + Math.sin(progress * freq * TAU + s * 0.5 + phaseOffset) * amp
            + Math.sin(progress * freq * 2 * TAU + s * 0.3) * amp * 0.2;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 15: PARTICLE RISE
   Particles floating upward.
   Config: count, speed, spread, isGold
   ═══════════════════════════════════════════════════════════ */
function makeParticleRise(config) {
  const { count = 40, speed = 0.5, spread = 0.6, isGold = false } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);
    const particles = [];

    function init() {
      particles.length = 0;
      const spreadW = w * spread;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * spreadW,
          y: Math.random() * h,
          speed: speed * (0.3 + Math.random() * 0.7),
          size: 0.5 + Math.random() * 2.5,
          phase: Math.random() * TAU,
          wobble: 0.5 + Math.random() * 1.5,
          gold: isGold || Math.random() > 0.7,
        });
      }
    }

    function draw(t) {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;

      for (const p of particles) {
        p.y -= p.speed;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = cx + (Math.random() - 0.5) * w * spread;
        }

        const wx = Math.sin(s * p.wobble + p.phase) * 15;
        const alpha = 0.05 + 0.15 * (1 - p.y / h);
        ctx.fillStyle = p.gold
          ? `rgba(184, 146, 58, ${A(alpha)})`
          : `rgba(62, 55, 45, ${A(alpha * 0.6)})`;
        ctx.beginPath();
        ctx.arc(p.x + wx, p.y, p.size, 0, TAU);
        ctx.fill();
      }
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
    init();
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 16: PULSE
   Radiating concentric pulses from center.
   Config: frequency, maxRings, fadeSpeed
   ═══════════════════════════════════════════════════════════ */
function makePulse(config) {
  const { frequency = 1.5, maxRings = 8, fadeSpeed = 0.8 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);

    function draw(t) {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const maxR = Math.min(w, h) * 0.45;

      for (let i = 0; i < maxRings; i++) {
        const phase = ((s * frequency + i * (1 / maxRings)) % 1);
        const r = phase * maxR;
        const alpha = (1 - phase) * 0.12 * fadeSpeed;
        if (alpha < 0.005) continue;

        const isGold = i % 3 === 0;
        ctx.strokeStyle = isGold
          ? `rgba(184, 146, 58, ${A(alpha)})`
          : `rgba(62, 55, 45, ${A(alpha)})`;
        ctx.lineWidth = (1 - phase) * 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.stroke();
      }

      // Center dot
      const cp = 0.5 + 0.5 * Math.sin(s * frequency * TAU);
      ctx.beginPath();
      ctx.arc(cx, cy, 3 + cp * 2, 0, TAU);
      ctx.fillStyle = `rgba(184, 146, 58, ${A(0.15 + cp * 0.15)})`;
      ctx.fill();
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 17: VORTEX
   Swirling pattern pulling inward.
   Config: armCount, rotationSpeed, depth
   ═══════════════════════════════════════════════════════════ */
function makeVortex(config) {
  const { armCount = 4, rotationSpeed = 0.15, depth = 5 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);

    function draw(t) {
      ctx.fillStyle = 'rgba(245, 240, 228, 0.04)';
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const maxR = Math.min(w, h) * 0.4;

      for (let arm = 0; arm < armCount; arm++) {
        const armAngle = (arm / armCount) * TAU;
        const isGold = arm % 2 === 0;

        for (let d = 0; d < depth; d++) {
          const layerFrac = d / depth;
          ctx.strokeStyle = isGold
            ? `rgba(184, 146, 58, ${A(0.03 + layerFrac * 0.05)})`
            : `rgba(62, 55, 45, ${A(0.03 + layerFrac * 0.04)})`;
          ctx.lineWidth = 1.0 + layerFrac * 0.4;
          ctx.beginPath();

          let first = true;
          for (let a = 0; a < TAU * 2; a += 0.05) {
            const r = maxR * (1 - a / (TAU * 2)) * (0.5 + layerFrac * 0.5);
            if (r < 3) break;
            const angle = a + armAngle + s * rotationSpeed * (1 + layerFrac);
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (first) { ctx.moveTo(x, y); first = false; }
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      // Center void
      const cp = 0.5 + 0.5 * Math.sin(s * 2);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);
      grad.addColorStop(0, `rgba(62, 55, 45, ${A(0.06 + cp * 0.06)})`);
      grad.addColorStop(1, 'rgba(62, 55, 45, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, TAU);
      ctx.fill();
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 18: ECLIPSE
   Overlapping circles with partial reveals.
   Config: circleCount, overlapAmount, drift
   ═══════════════════════════════════════════════════════════ */
function makeEclipse(config) {
  const { circleCount = 3, overlapAmount = 0.7, drift = 0.2 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);

    function draw(t) {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const R = Math.min(w, h) * 0.22;

      for (let i = 0; i < circleCount; i++) {
        const angle = (i / circleCount) * TAU + s * drift;
        const offset = R * (1 - overlapAmount);
        const x = cx + Math.cos(angle) * offset;
        const y = cy + Math.sin(angle) * offset;

        const alpha = 0.06 + 0.03 * Math.sin(s * 0.5 + i * 1.5);
        const isGold = i === 0;
        ctx.strokeStyle = isGold
          ? `rgba(184, 146, 58, ${A(alpha * 1.5)})`
          : `rgba(62, 55, 45, ${A(alpha)})`;
        ctx.lineWidth = isGold ? 0.8 : 0.5;
        ctx.beginPath();
        ctx.arc(x, y, R, 0, TAU);
        ctx.stroke();

        // Fill with very faint color
        ctx.fillStyle = isGold
          ? `rgba(184, 146, 58, ${A(alpha * 0.15)})`
          : `rgba(62, 55, 45, ${A(alpha * 0.08)})`;
        ctx.fill();
      }

      // Intersection glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5);
      const glowAlpha = 0.03 + 0.02 * Math.sin(s * 0.8);
      grad.addColorStop(0, `rgba(184, 146, 58, ${A(glowAlpha)})`);
      grad.addColorStop(1, 'rgba(184, 146, 58, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.5, 0, TAU);
      ctx.fill();
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 19: SCATTER
   Elements dispersing from center.
   Config: fragmentCount, dispersalSpeed, regather
   ═══════════════════════════════════════════════════════════ */
function makeScatter(config) {
  const { fragmentCount = 50, dispersalSpeed = 0.2, regather = true } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);
    const fragments = [];

    function init() {
      fragments.length = 0;
      for (let i = 0; i < fragmentCount; i++) {
        const angle = Math.random() * TAU;
        const maxDist = Math.min(w, h) * (0.15 + Math.random() * 0.25);
        fragments.push({
          angle,
          maxDist,
          phase: Math.random() * TAU,
          speed: 0.5 + Math.random(),
          size: 1 + Math.random() * 2.5,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          gold: Math.random() > 0.6,
        });
      }
    }

    function draw(t) {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const cycle = (s * dispersalSpeed) % 1;

      let disp;
      if (regather) {
        disp = cycle < 0.5 ? ease(cycle * 2) : ease(1 - (cycle - 0.5) * 2);
      } else {
        disp = ease(cycle);
      }

      for (const f of fragments) {
        const dist = disp * f.maxDist;
        const wobble = Math.sin(s * f.speed + f.phase) * 5;
        const a = f.angle + s * f.rotSpeed;
        const x = cx + Math.cos(a) * dist + wobble * Math.cos(a + Math.PI / 2);
        const y = cy + Math.sin(a) * dist + wobble * Math.sin(a + Math.PI / 2);

        const alpha = 0.08 + (1 - disp) * 0.12;
        ctx.fillStyle = f.gold
          ? `rgba(184, 146, 58, ${A(alpha)})`
          : `rgba(62, 55, 45, ${A(alpha * 0.7)})`;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(s * f.speed * 0.5);
        ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size);
        ctx.restore();
      }
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
    init();
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   BASE ANIMATION 20: WEAVE
   Interlocking curved lines.
   Config: lineCount, amplitude, phaseOffset
   ═══════════════════════════════════════════════════════════ */
function makeWeave(config) {
  const { lineCount = 8, amplitude = 0.2, phaseOffset = 0.5 } = config;
  return function(canvas) {
    let { ctx, w, h, cx, cy } = fitCanvas(canvas);

    function draw(t) {
      ctx.fillStyle = 'rgba(245, 240, 228, 0.04)';
      ctx.fillRect(0, 0, w, h);
      const s = t * 0.001;
      const amp = Math.min(w, h) * amplitude;

      for (let i = 0; i < lineCount; i++) {
        const yBase = (h / (lineCount + 1)) * (i + 1);
        const phase = i * phaseOffset + s * 0.3;
        const isGold = i === Math.floor(lineCount / 2);

        const alpha = 0.04 + 0.03 * Math.sin(s * 0.4 + i);
        ctx.strokeStyle = isGold
          ? `rgba(184, 146, 58, ${A(alpha * 2)})`
          : `rgba(62, 55, 45, ${A(alpha)})`;
        ctx.lineWidth = isGold ? 0.8 : 0.5;

        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const progress = x / w;
          const crossWeave = Math.sin(progress * TAU * 2 + phase) * amp;
          const secondary = Math.sin(progress * TAU * 4 + phase * 1.5 + s * 0.2) * amp * 0.3;
          const y = yBase + crossWeave + secondary;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Nodes at crossings
        for (let ci = 0; ci < 4; ci++) {
          const crossX = (w / 4) * (ci + 0.5);
          const crossProgress = crossX / w;
          const crossY = yBase + Math.sin(crossProgress * TAU * 2 + phase) * amp;
          ctx.beginPath();
          ctx.arc(crossX, crossY, 1.5, 0, TAU);
          ctx.fillStyle = `rgba(184, 146, 58, ${A(alpha * 1.5)})`;
          ctx.fill();
        }
      }
    }

    function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
    return { draw, resize };
  };
}


/* ═══════════════════════════════════════════════════════════
   SPECIAL: SLOW GROWTH (Quote 39 — slow vs fast growth)
   Two systems — fast expands and shatters, slow grows steady.
   Kept as a unique function per original design.
   ═══════════════════════════════════════════════════════════ */
function art_slow_growth(canvas) {
  let { ctx, w, h, cx, cy } = fitCanvas(canvas);

  function init() {}

  function draw(t) {
    ctx.fillStyle = 'rgba(245, 240, 228, 0.04)';
    ctx.fillRect(0, 0, w, h);
    const s = t * 0.001;
    const period = 12;
    const phase = (s % period) / period;
    const leftX = w * 0.32;
    const rightX = w * 0.68;
    const ringCount = Math.floor(phase * 8);
    const maxR = Math.min(w, h) * 0.2;

    for (let i = 0; i < ringCount; i++) {
      const r = maxR * ((i + 1) / 8);
      const alpha = 0.05 + i * 0.015;
      ctx.strokeStyle = `rgba(184, 146, 58, ${A(alpha)})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(leftX, cy, r, 0, TAU);
      ctx.stroke();
    }

    if (ringCount < 8) {
      const subPhase = (phase * 8) % 1;
      const growR = maxR * ((ringCount + subPhase) / 8);
      ctx.strokeStyle = `rgba(184, 146, 58, ${A(0.03 + subPhase * 0.04)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(leftX, cy, growR, 0, TAU * subPhase);
      ctx.stroke();
    }

    const burstPhase = phase < 0.3 ? phase / 0.3 : 1;
    const shatterPhase = phase < 0.3 ? 0 : Math.min(1, (phase - 0.3) / 0.4);

    if (shatterPhase < 1) {
      const burstR = maxR * burstPhase * 1.5;
      ctx.strokeStyle = `rgba(62, 55, 45, ${A(0.1 * (1 - shatterPhase))})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(rightX, cy, burstR, 0, TAU);
      ctx.stroke();
    }

    if (shatterPhase > 0) {
      const fragCount = 16;
      for (let i = 0; i < fragCount; i++) {
        const a = (i / fragCount) * TAU;
        const fragR = maxR * 1.5 + shatterPhase * maxR * 0.8;
        const fx = rightX + Math.cos(a) * fragR;
        const fy = cy + Math.sin(a) * fragR;
        const alpha = 0.08 * (1 - shatterPhase);
        if (alpha > 0.005) {
          ctx.fillStyle = `rgba(62, 55, 45, ${A(alpha)})`;
          ctx.fillRect(fx - 1, fy - 1, 2, 2);
        }
      }
    }

    ctx.font = '8px "IBM Plex Sans", sans-serif';
    ctx.fillStyle = 'rgba(62, 55, 45, 0.36)';
    ctx.textAlign = 'center';
    ctx.fillText('SLOW', leftX, cy + maxR + 20);
    ctx.fillText('FAST', rightX, cy + maxR + 20);
  }

  function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
  return { draw, resize };
}


/* ═══════════════════════════════════════════════════════════
   BOOK I DIVIDER: The Inner Game
   A single point becomes a triangle, becomes a pentagon,
   becomes a circle. Self emerging from nothing.
   ═══════════════════════════════════════════════════════════ */
function art_book1_inner(canvas) {
  let { ctx, w, h, cx, cy } = fitCanvas(canvas);

  function draw(t) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const s = t * 0.001;
    const maxR = Math.min(w, h) * 0.34;
    const cycle = (s * 0.15) % 1;

    const shapes = [3, 4, 5, 6, 8, 12, 24, 60];
    const shapeIdx = cycle * shapes.length;
    const fromIdx = Math.floor(shapeIdx) % shapes.length;
    const toIdx = (fromIdx + 1) % shapes.length;
    const morph = shapeIdx % 1;
    const sides = Math.round(lerp(shapes[fromIdx], shapes[toIdx], ease(morph)));

    for (let ring = 0; ring < 4; ring++) {
      const r = maxR * (0.25 + ring * 0.22);
      const rotation = s * 0.08 * (ring % 2 === 0 ? 1 : -1);
      const alpha = 0.04 + ring * 0.025;

      ctx.strokeStyle = ring === 3
        ? `rgba(184, 146, 58, ${A(alpha)})`
        : `rgba(62, 55, 45, ${A(alpha)})`;
      ctx.lineWidth = 1.2 + ring * 0.15;
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * TAU + rotation;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const outerR = maxR * (0.25 + 3 * 0.22);
    const outerRot = s * 0.08 * -1;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * TAU + outerRot;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR, 1.5, 0, TAU);
      ctx.fillStyle = 'rgba(184, 146, 58, 0.45)';
      ctx.fill();
    }

    const pulse = 0.5 + 0.5 * Math.sin(s * 1.2);
    ctx.beginPath();
    ctx.arc(cx, cy, 3 + pulse * 2, 0, TAU);
    ctx.fillStyle = `rgba(184, 146, 58, ${A(0.08 + pulse * 0.1)})`;
    ctx.fill();
  }

  function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
  return { draw, resize };
}


/* ═══════════════════════════════════════════════════════════
   BOOK II DIVIDER: The Outer Game
   Two orbital systems weaving around each other.
   ═══════════════════════════════════════════════════════════ */
function art_book2_outer(canvas) {
  let { ctx, w, h, cx, cy } = fitCanvas(canvas);

  function draw(t) {
    ctx.fillStyle = 'rgba(245, 240, 228, 0.04)';
    ctx.fillRect(0, 0, w, h);
    const s = t * 0.001;
    const maxR = Math.min(w, h) * 0.36;

    const countA = 7;
    for (let i = 0; i < countA; i++) {
      const orbitR = maxR * (0.3 + (i / countA) * 0.7);
      const speed = 0.15 + i * 0.03;
      const a = s * speed + (i / countA) * TAU;
      const x = cx + Math.cos(a) * orbitR;
      const y = cy + Math.sin(a) * orbitR * 0.6;

      ctx.strokeStyle = `rgba(184, 146, 58, ${A(0.02 + i * 0.005)})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.ellipse(cx, cy, orbitR, orbitR * 0.6, 0, 0, TAU);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 2 + i * 0.3, 0, TAU);
      ctx.fillStyle = `rgba(184, 146, 58, ${A(0.1 + i * 0.02)})`;
      ctx.fill();
    }

    const countB = 5;
    for (let i = 0; i < countB; i++) {
      const orbitR = maxR * (0.2 + (i / countB) * 0.6);
      const speed = -(0.12 + i * 0.04);
      const a = s * speed + (i / countB) * TAU + Math.PI / 3;
      const x = cx + Math.cos(a) * orbitR * 0.7;
      const y = cy + Math.sin(a) * orbitR;

      ctx.strokeStyle = `rgba(62, 55, 45, ${A(0.02 + i * 0.004)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(cx, cy, orbitR * 0.7, orbitR, 0, 0, TAU);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 1.5 + i * 0.3, 0, TAU);
      ctx.fillStyle = `rgba(62, 55, 45, ${A(0.08 + i * 0.02)})`;
      ctx.fill();
    }

    const nodesA = [];
    const nodesB = [];
    for (let i = 0; i < countA; i++) {
      const orbitR = maxR * (0.3 + (i / countA) * 0.7);
      const a = s * (0.15 + i * 0.03) + (i / countA) * TAU;
      nodesA.push({ x: cx + Math.cos(a) * orbitR, y: cy + Math.sin(a) * orbitR * 0.6 });
    }
    for (let i = 0; i < countB; i++) {
      const orbitR = maxR * (0.2 + (i / countB) * 0.6);
      const a = s * -(0.12 + i * 0.04) + (i / countB) * TAU + Math.PI / 3;
      nodesB.push({ x: cx + Math.cos(a) * orbitR * 0.7, y: cy + Math.sin(a) * orbitR });
    }

    ctx.strokeStyle = 'rgba(92, 61, 40, 0.27)';
    ctx.lineWidth = 0.8;
    for (const a of nodesA) {
      for (const b of nodesB) {
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < maxR * 0.4) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); }
  return { draw, resize };
}


/* ═══════════════════════════════════════════════════════════
   BOOK III DIVIDER: The Long Game
   A tree-ring pattern growing outward, ring by ring.
   ═══════════════════════════════════════════════════════════ */
function art_book3_legacy(canvas) {
  let { ctx, w, h, cx, cy } = fitCanvas(canvas);
  const rings = [];
  const ringCount = 20;

  function init() {
    rings.length = 0;
    for (let i = 0; i < ringCount; i++) {
      const points = [];
      const segments = 60;
      const baseR = 10 + i * (Math.min(w, h) * 0.38 / ringCount);
      for (let j = 0; j < segments; j++) {
        const a = (j / segments) * TAU;
        const wobble = (Math.random() - 0.5) * (3 + i * 0.8);
        points.push({ angle: a, r: baseR + wobble });
      }
      rings.push({ points, baseR, phase: Math.random() * TAU });
    }
  }

  function draw(t) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const s = t * 0.001;

    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      const reveal = Math.min(1, (s * 0.08 - i * 0.15));
      if (reveal <= 0) continue;

      const alpha = reveal * (i < ringCount - 1 ? 0.06 + i * 0.003 : 0.12);
      const isGold = i === ringCount - 1 || i === Math.floor(ringCount * 0.618);

      ctx.strokeStyle = isGold
        ? `rgba(184, 146, 58, ${A(alpha * 1.5)})`
        : `rgba(62, 55, 45, ${A(alpha)})`;
      ctx.lineWidth = isGold ? 0.8 : 0.4;

      const breathe = Math.sin(s * 0.2 + ring.phase) * 2;

      ctx.beginPath();
      for (let j = 0; j <= ring.points.length; j++) {
        const pt = ring.points[j % ring.points.length];
        const r = pt.r + breathe;
        const x = cx + Math.cos(pt.angle) * r;
        const y = cy + Math.sin(pt.angle) * r;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, TAU);
    ctx.fillStyle = 'rgba(184, 146, 58, 0.6)';
    ctx.fill();
  }

  function resize() { ({ ctx, w, h, cx, cy } = fitCanvas(canvas)); init(); }
  init();
  return { draw, resize };
}


/* ═══════════════════════════════════════════════════════════
   ART REGISTRY
   Maps all 94 quote numbers + book dividers to factories.
   Each entry is a factory: canvas => { draw, resize }
   ═══════════════════════════════════════════════════════════ */
const ART_REGISTRY = {

  /* ── Book I: The Inner Game (1-30) ── */

  // 1: Invisible authority — network of relationships, no formal office
  1: makeNetwork({ nodeCount: 18, connectionRadius: 0.4, driftSpeed: 0.3, showCenter: false }),

  // 2: Instant loyalty in crisis — immediate pulse reaction
  2: makePulse({ frequency: 2.0, maxRings: 6, fadeSpeed: 1.0 }),

  // 3: Contradiction as energy — tension between light and shadow
  3: makePendulum({ count: 5, dampening: 0.98, length: 0.6, pivotY: 0.12 }),

  // 4: Rage turns inward — blades converging to self
  4: makeBlades({ bladeCount: 12, rotationSpeed: 0.08, breatheSpeed: 8, inward: true }),

  // 5: Hunger filling emptiness — vortex pulling inward
  5: makeVortex({ armCount: 3, rotationSpeed: 0.2, depth: 4 }),

  // 6: Missing the shape, not the person — erosion of a circle
  6: makeErosion({ shape: 'circle', breakSpeed: 0.08, particleCount: 70 }),

  // 7: Ambition without competence — scatter without regathering
  7: makeScatter({ fragmentCount: 45, dispersalSpeed: 0.15, regather: false }),

  // 8: Love and resentment coexisting — duality eclipse
  8: makeEclipse({ circleCount: 2, overlapAmount: 0.6, drift: 0.08 }),

  // 9: Fear outweighs logic — turbulent overlapping waves
  9: makeWave({ waveCount: 7, frequency: 3, amplitude: 0.18 }),

  // 10: Piety as control — cold hard crystal
  10: makeCrystal({ facetSides: 8, pressureLineCount: 20, layerCount: 4, growSpeed: 0.15 }),

  // 11: Projecting onto others — mirror with many folds
  11: makeMirror({ foldCount: 8, rotationSpeed: 0.04, complexity: 4 }),

  // 12: Empty ritual — mechanical circle repetition
  12: makeRepetition({ shape: 'circle', traceSpeed: 0.6, fadeRate: 0.006 }),

  // 13: Wisdom arriving too late — slow particle rise
  13: makeParticleRise({ count: 30, speed: 0.3, spread: 0.4, isGold: true }),

  // 14: Words that cross a line — hexagon eroding
  14: makeErosion({ shape: 'hexagon', breakSpeed: 0.12, particleCount: 60 }),

  // 15: Chasing what's lost destroys — tight desperate vortex
  15: makeVortex({ armCount: 2, rotationSpeed: 0.3, depth: 6 }),

  // 16: Quiet grace in darkness — slow gentle pulse
  16: makePulse({ frequency: 0.6, maxRings: 10, fadeSpeed: 0.5 }),

  // 17: Surrender producing results — gentle flow field
  17: makeFlowField({ direction: -Math.PI / 2, density: 35, turbulence: 0.8 }),

  // 18: Daily practice predicts the end — polygon repetition
  18: makeRepetition({ shape: 'polygon', traceSpeed: 0.5, fadeRate: 0.005, sides: 7 }),

  // 19: Can't fix by relocating — scatter that regathers same spot
  19: makeScatter({ fragmentCount: 40, dispersalSpeed: 0.12, regather: true }),

  // 20: Blocked creativity going dark — turbulent flow field
  20: makeFlowField({ direction: Math.PI, density: 50, turbulence: 2.5 }),

  // 21: Torture revealing self — crystal under extreme pressure
  21: makeCrystal({ facetSides: 5, pressureLineCount: 35, layerCount: 5, growSpeed: 0.35 }),

  // 22: Loneliness exploited — single lonely orbit
  22: makeOrbit({ orbitCount: 2, eccentricity: 0.8, showTrails: true }),

  // 23: Restraint, choosing not to act — very slow breathing rings
  23: makeBreathingRings({ ringCount: 7, breatheSpeed: 0.2, showSpiral: false, showRadials: false }),

  // 24: Clarity then relapse — spiral that tightens then loosens
  24: makeSpiral({ armCount: 2, tightness: 0.2, growthRate: 0.04 }),

  // 25: Brilliance curdling into murder — fast aggressive blades
  25: makeBlades({ bladeCount: 16, rotationSpeed: 0.15, breatheSpeed: 12, inward: true }),

  // 26: The yes-man hiding a blade — interlocking weave
  26: makeWeave({ lineCount: 10, amplitude: 0.15, phaseOffset: 0.7 }),

  // 27: Paralysis, not deciding — slowly eroding square
  27: makeErosion({ shape: 'square', breakSpeed: 0.06, particleCount: 90 }),

  // 28: Inheritance as prison — constrained pendulums
  28: makePendulum({ count: 3, dampening: 0.95, length: 0.5, pivotY: 0.1 }),

  // 29: What you ban reveals you — high-fold mirror
  29: makeMirror({ foldCount: 10, rotationSpeed: 0.06, complexity: 5 }),

  // 30: Act with what you have — strong outward pulse
  30: makePulse({ frequency: 1.8, maxRings: 7, fadeSpeed: 1.2 }),


  /* ── Book II: The Outer Game (31-63) ── */

  // 31: Invisible durable power — breathing rings, no visible center
  31: makeBreathingRings({ ringCount: 9, breatheSpeed: 0.5, showSpiral: true, showRadials: true }),

  // 32: Controlling the process — dense network with center
  32: makeNetwork({ nodeCount: 22, connectionRadius: 0.5, driftSpeed: 0.2, showCenter: true }),

  // 33: Manufactured spontaneity — precisely phased weave
  33: makeWeave({ lineCount: 6, amplitude: 0.18, phaseOffset: 0.3 }),

  // 34: Quiet generosity spreading — golden particles rising
  34: makeParticleRise({ count: 60, speed: 0.35, spread: 0.9, isGold: true }),

  // 35: Generosity as foundation — upward flow field
  35: makeFlowField({ direction: -Math.PI / 2, density: 45, turbulence: 1.0 }),

  // 36: Lending without recourse — dispersing scatter
  36: makeScatter({ fragmentCount: 55, dispersalSpeed: 0.1, regather: false }),

  // 37: Learning from predecessors — growing spiral
  37: makeSpiral({ armCount: 3, tightness: 0.12, growthRate: 0.06 }),

  // 38: Consistency, the florin — repetitive circle trace
  38: makeRepetition({ shape: 'circle', traceSpeed: 0.8, fadeRate: 0.008 }),

  // 39: Slow vs fast growth — special dual system
  39: art_slow_growth,

  // 40: Courage as signal — bold outward pulse
  40: makePulse({ frequency: 2.5, maxRings: 5, fadeSpeed: 1.5 }),

  // 41: Leading from the front — outward-pointing blades
  41: makeBlades({ bladeCount: 8, rotationSpeed: 0.1, breatheSpeed: 6, inward: false }),

  // 42: Composure under crisis — dense crystal, slow pressure
  42: makeCrystal({ facetSides: 8, pressureLineCount: 40, layerCount: 4, growSpeed: 0.15 }),

  // 43: Dangerous aftermath — high-frequency chaotic waves
  43: makeWave({ waveCount: 8, frequency: 5, amplitude: 0.12 }),

  // 44: Mob cruelty after relief — tightening vortex
  44: makeVortex({ armCount: 5, rotationSpeed: 0.25, depth: 4 }),

  // 45: Hunger overrides ideology — crumbling erosion
  45: makeErosion({ shape: 'hexagon', breakSpeed: 0.18, particleCount: 100 }),

  // 46: Ruin creating conditions for best work — crystal from pressure
  46: makeCrystal({ facetSides: 5, pressureLineCount: 35, layerCount: 5, growSpeed: 0.25 }),

  // 47: System is neutral, can flip — balanced pendulums
  47: makePendulum({ count: 7, dampening: 0.99, length: 0.55, pivotY: 0.12 }),

  // 48: Disruption has its own momentum — fast scatter
  48: makeScatter({ fragmentCount: 65, dispersalSpeed: 0.25, regather: false }),

  // 49: Crowd seeing through slogans — revealing mirror
  49: makeMirror({ foldCount: 6, rotationSpeed: 0.08, complexity: 3 }),

  // 50: Knowing the audience — synchronized weave
  50: makeWeave({ lineCount: 7, amplitude: 0.12, phaseOffset: 0.4 }),

  // 51: Precision vs enthusiasm — tight fast blades
  51: makeBlades({ bladeCount: 6, rotationSpeed: 0.12, breatheSpeed: 10, inward: true }),

  // 52: Reliability over inspiration — steady orbits
  52: makeOrbit({ orbitCount: 6, eccentricity: 0.5, showTrails: true }),

  // 53: Useful fictions everyone accepts — overlapping eclipses
  53: makeEclipse({ circleCount: 4, overlapAmount: 0.8, drift: 0.1 }),

  // 54: Ruthlessness at wrong time — erratic pendulums
  54: makePendulum({ count: 4, dampening: 0.9, length: 0.65, pivotY: 0.08 }),

  // 55: Public compassion, private predation — duality mirror
  55: makeMirror({ foldCount: 2, rotationSpeed: 0.04, complexity: 6 }),

  // 56: Advisor becoming controller — slow consuming vortex
  56: makeVortex({ armCount: 2, rotationSpeed: 0.1, depth: 7 }),

  // 57: Fast rise, hard fall — rapid erosion
  57: makeErosion({ shape: 'circle', breakSpeed: 0.25, particleCount: 80 }),

  // 58: Gentleness hiding danger — subtle breathing rings
  58: makeBreathingRings({ ringCount: 11, breatheSpeed: 0.3, showSpiral: false, showRadials: true }),

  // 59: Broken promises with technicalities — knotted weave
  59: makeWeave({ lineCount: 12, amplitude: 0.25, phaseOffset: 0.8 }),

  // 60: Legal arguments as power — directional flow field
  60: makeFlowField({ direction: 0, density: 55, turbulence: 1.8 }),

  // 61: Collecting weapons, removing options — contracting scatter
  61: makeScatter({ fragmentCount: 70, dispersalSpeed: 0.08, regather: true }),

  // 62: Invisible good governance — almost-still breathing rings
  62: makeBreathingRings({ ringCount: 12, breatheSpeed: 0.15, showSpiral: true, showRadials: false }),

  // 63: Alliances of convenience — crossing orbits
  63: makeOrbit({ orbitCount: 4, eccentricity: 0.4, showTrails: false }),


  /* ── Book III: The Long Game (64-94) ── */

  // 64: Wealth as tool, distribution — spreading golden particles
  64: makeParticleRise({ count: 70, speed: 0.5, spread: 1.0, isGold: true }),

  // 65: Buildings outlast rulers — deep rooted tree
  65: makeTree({ depth: 9, spread: 0.45, sway: 0.2 }),

  // 66: Intellectual circles as infrastructure — rich network
  66: makeNetwork({ nodeCount: 28, connectionRadius: 0.45, driftSpeed: 0.25, showCenter: false }),

  // 67: Restraint as message — partial eclipse
  67: makeEclipse({ circleCount: 3, overlapAmount: 0.4, drift: 0.05 }),

  // 68: Precise feedback — tight focused pulse
  68: makePulse({ frequency: 3.0, maxRings: 4, fadeSpeed: 1.8 }),

  // 69: Pressure breeds greatness — beautiful crystal
  69: makeCrystal({ facetSides: 6, pressureLineCount: 30, layerCount: 3, growSpeed: 0.3 }),

  // 70: Copying replaces creating — circle eroding to nothing
  70: makeErosion({ shape: 'circle', breakSpeed: 0.1, particleCount: 50 }),

  // 71: Taste calcifying into cage — narrow vortex
  71: makeVortex({ armCount: 3, rotationSpeed: 0.08, depth: 8 }),

  // 72: Art as warning — sharp blades pointing outward
  72: makeBlades({ bladeCount: 10, rotationSpeed: 0.06, breatheSpeed: 5, inward: false }),

  // 73: Nostalgia vs risk — slow polygon repetition
  73: makeRepetition({ shape: 'polygon', traceSpeed: 0.4, fadeRate: 0.004, sides: 5 }),

  // 74: Patience as strategy — very slow growing spiral
  74: makeSpiral({ armCount: 1, tightness: 0.08, growthRate: 0.03 }),

  // 75: Wisdom transferred, discipline not — spreading tree
  75: makeTree({ depth: 7, spread: 0.6, sway: 0.4 }),

  // 76: Wrong person, long damage — long slow pendulums
  76: makePendulum({ count: 2, dampening: 0.97, length: 0.7, pivotY: 0.05 }),

  // 77: Bad leader enduring — slow stubborn erosion
  77: makeErosion({ shape: 'square', breakSpeed: 0.05, particleCount: 60 }),

  // 78: Spectacle covering emptiness — hollow eclipse
  78: makeEclipse({ circleCount: 5, overlapAmount: 0.9, drift: 0.3 }),

  // 79: Purity producing extinction — consuming vortex
  79: makeVortex({ armCount: 6, rotationSpeed: 0.2, depth: 3 }),

  // 80: Contract before connection — rigid tight weave
  80: makeWeave({ lineCount: 5, amplitude: 0.08, phaseOffset: 1.0 }),

  // 81: Patronage with a leash — network with visible center control
  81: makeNetwork({ nodeCount: 16, connectionRadius: 0.35, driftSpeed: 0.2, showCenter: true }),

  // 82: Selling what's sacred — slow sad erosion
  82: makeErosion({ shape: 'hexagon', breakSpeed: 0.07, particleCount: 40 }),

  // 83: Opposition needing permanent enemy — aggressive blades
  83: makeBlades({ bladeCount: 14, rotationSpeed: 0.13, breatheSpeed: 9, inward: true }),

  // 84: Banning comparison — explosive scatter
  84: makeScatter({ fragmentCount: 80, dispersalSpeed: 0.3, regather: false }),

  // 85: Sacred principles are negotiable — swinging pendulums
  85: makePendulum({ count: 6, dampening: 0.96, length: 0.5, pivotY: 0.15 }),

  // 86: Invisible inventions changing everything — expanding spiral
  86: makeSpiral({ armCount: 4, tightness: 0.1, growthRate: 0.07 }),

  // 87: Try and try again — determined triangle repetition
  87: makeRepetition({ shape: 'polygon', traceSpeed: 1.0, fadeRate: 0.01, sides: 3 }),

  // 88: Same bloodline, opposite outcomes — contrasting eclipse
  88: makeEclipse({ circleCount: 2, overlapAmount: 0.3, drift: 0.2 }),

  // 89: Strength becoming liability — heavy pendulums
  89: makePendulum({ count: 5, dampening: 0.93, length: 0.6, pivotY: 0.08 }),

  // 90: Defaced tomb, power without love — crumbling erosion
  90: makeErosion({ shape: 'square', breakSpeed: 0.15, particleCount: 85 }),

  // 91: Power to spectacle — gaudy vortex
  91: makeVortex({ armCount: 7, rotationSpeed: 0.3, depth: 3 }),

  // 92: Power leaving before title — fading breathing rings
  92: makeBreathingRings({ ringCount: 8, breatheSpeed: 0.4, showSpiral: false, showRadials: true }),

  // 93: Loyalty to feeling, not leader — emotional waves
  93: makeWave({ waveCount: 6, frequency: 2, amplitude: 0.2 }),

  // 94: Letting go, giving back — mandala build and dissolve
  94: makeMandala({ layers: 7, segments: 6, cycleDuration: 20 }),


  /* ── Book Dividers ── */
  'book1': art_book1_inner,
  'book2': art_book2_outer,
  'book3': art_book3_legacy,
};

/* Export for use in script.js */
window.MEDICI_ART = { ART_REGISTRY, fitCanvas };
