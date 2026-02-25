(function () {
  const sections = Array.from(document.querySelectorAll('.page'));
  const railLinks = Array.from(document.querySelectorAll('.rail-link'));
  const indicator = document.getElementById('pageIndicator');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const anchors = sections.map((section) => String(section.dataset.anchor || '').trim()).filter(Boolean);
  const anchorSet = new Set(anchors);
  const anchorToSection = new Map(anchors.map((anchor, index) => [anchor, sections[index]]));
  const anchorToIndex = new Map(anchors.map((anchor, index) => [anchor, index + 1]));

  const MAX_PAGE = anchors.length;

  let activeAnchor = anchors[0] || 'cover';
  let activeIndex = 1;

  function normalizeAnchor(raw) {
    const key = String(raw || '').replace(/^#/, '').trim();
    if (anchorSet.has(key)) return key;
    return anchors[0];
  }

  function parseHash() {
    return normalizeAnchor(window.location.hash);
  }

  function updateActiveUI(anchor) {
    const normalized = normalizeAnchor(anchor);
    activeAnchor = normalized;
    activeIndex = anchorToIndex.get(normalized) || 1;

    indicator.textContent = `${String(activeIndex).padStart(3, '0')} / ${String(MAX_PAGE).padStart(3, '0')}`;

    railLinks.forEach((link) => {
      link.classList.toggle('active', String(link.dataset.anchor) === normalized);
    });
  }

  function setHash(anchor) {
    const normalized = normalizeAnchor(anchor);
    const next = `#${normalized}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', next);
    }
  }

  function goTo(anchor, smooth) {
    const normalized = normalizeAnchor(anchor);
    const section = anchorToSection.get(normalized);
    if (!section) return;

    section.scrollIntoView({
      behavior: smooth && !reducedMotion ? 'smooth' : 'auto',
      block: 'start',
    });

    updateActiveUI(normalized);
    setHash(normalized);
  }

  function goRelative(delta) {
    const nextIndex = Math.max(1, Math.min(MAX_PAGE, activeIndex + delta));
    const nextAnchor = anchors[nextIndex - 1];
    goTo(nextAnchor, true);
  }

  railLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      goTo(link.dataset.anchor, true);
    });
  });

  window.addEventListener('hashchange', () => {
    goTo(parseHash(), false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      goRelative(1);
    }
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      goRelative(-1);
    }
  });

  // Wheel navigation is intentionally not overridden.
  // Native scroll + CSS snap is the single source of truth to avoid double-step bugs.

  let scrollTicking = false;
  function updateActiveFromScroll() {
    const centerY = window.innerHeight * 0.5;
    let nearestAnchor = activeAnchor;
    let nearestDist = Number.POSITIVE_INFINITY;

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      const mid = rect.top + rect.height * 0.5;
      const dist = Math.abs(mid - centerY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestAnchor = normalizeAnchor(section.dataset.anchor);
      }
    }

    if (nearestAnchor !== activeAnchor) {
      updateActiveUI(nearestAnchor);
      setHash(nearestAnchor);
    }
  }

  window.addEventListener(
    'scroll',
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(() => {
        updateActiveFromScroll();
        scrollTicking = false;
      });
    },
    { passive: true }
  );

  function fitCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {
      ctx,
      width: rect.width,
      height: rect.height,
    };
  }

  // ─────────────────────────────────────────────
  // ORIGINAL 10 ANIMATIONS (pages 1-10) — UNCHANGED
  // ─────────────────────────────────────────────

  function createOnePurposeBloom(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);
    let centerX = width * 0.5;
    let centerY = height * 0.5;
    let maxR = Math.min(width, height) * 0.39;

    const count = reducedMotion ? 2800 : 9000;
    const particles = new Array(count);

    function reseed(index, fromEdge) {
      const angle = Math.random() * Math.PI * 2;
      const radius = fromEdge ? maxR * (0.92 + Math.random() * 0.14) : Math.pow(Math.random(), 0.6) * maxR;
      particles[index] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        phase: Math.random() * Math.PI * 2,
      };
    }

    for (let i = 0; i < count; i += 1) {
      reseed(i, false);
    }

    function draw(time) {
      ctx.fillStyle = 'rgba(240, 238, 230, 0.06)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#2f2f2f';
      const t = time * 0.0008;

      for (let i = 0; i < count; i += 1) {
        const p = particles[i];
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        const pull = 0.00075 + (dist / maxR) * 0.0019;
        const swirl = Math.sin(angle * 3.1 + t + p.phase) * 0.0024;

        p.vx = p.vx * 0.95 - dx * pull - dy * swirl;
        p.vy = p.vy * 0.95 - dy * pull + dx * swirl;
        p.x += p.vx;
        p.y += p.vy;

        if (dist < 7 || dist > maxR * 1.08) {
          reseed(i, true);
          continue;
        }

        const distNorm = Math.min(1, dist / maxR);
        const alpha = 0.16 + (1 - distNorm) * 0.48;
        const size = 0.62 + (1 - distNorm) * 0.72;

        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x, p.y, size, size);
      }

      ctx.globalAlpha = 1;
    }

    function resize() {
      ({ ctx, width, height } = fitCanvas(canvas));
      centerX = width * 0.5;
      centerY = height * 0.5;
      maxR = Math.min(width, height) * 0.39;
      for (let i = 0; i < count; i += 1) {
        reseed(i, false);
      }
    }

    return { draw, resize };
  }

  function createTorusKnowledge(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);

    function draw(time) {
      const t = time * 0.00095;
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      ctx.fillStyle = 'rgba(240, 238, 230, 0.20)';
      ctx.fillRect(0, 0, width, height);

      const fieldLines = 44;
      const toroidalRadius = Math.min(width, height) * 0.22;
      const poloidalRadius = Math.min(width, height) * 0.11;

      ctx.fillStyle = '#333333';
      for (let i = 0; i < fieldLines; i += 1) {
        const u = (i / fieldLines) * Math.PI * 2;
        for (let j = 0; j < fieldLines; j += 1) {
          const v = (j / fieldLines) * Math.PI * 2;

          const x = (toroidalRadius + poloidalRadius * Math.cos(v)) * Math.cos(u);
          const y = (toroidalRadius + poloidalRadius * Math.cos(v)) * Math.sin(u);
          const z = poloidalRadius * Math.sin(v);

          const scale = 210 / (210 + z);
          const screenX = centerX + x * scale;
          const screenY = centerY + y * scale * 0.56;

          const phase = t + u * 0.45 + v * 0.5;
          const offset = Math.sin(phase) * 3.6;

          ctx.globalAlpha = 0.12 + scale * 0.26;
          ctx.fillRect(screenX + offset, screenY + offset, 1.05, 1.05);
        }
      }

      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(60, 60, 60, 0.20)';
      ctx.lineWidth = 1;

      const flowLines = 20;
      for (let i = 0; i < flowLines; i += 1) {
        const angle = (i / flowLines) * Math.PI * 2;
        ctx.beginPath();
        for (let k = 0; k <= 100; k += 1) {
          const p = k / 100;
          const radius = toroidalRadius + poloidalRadius * Math.cos(p * Math.PI * 2 * 3 + t * 1.5);
          const x = centerX + Math.cos(angle + p * Math.PI * 4) * radius;
          const y = centerY + Math.sin(angle + p * Math.PI * 4) * radius * 0.56;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      const core = Math.min(width, height) * 0.052;
      ctx.beginPath();
      ctx.arc(centerX, centerY, core * 2.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(52, 52, 52, 0.46)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.beginPath();
      for (let k = 0; k <= 140; k += 1) {
        const p = k / 140;
        const angle = p * Math.PI * 2 * 3.2 - t * 2.2;
        const r = core * 2.05 * (1 - p);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(52, 52, 52, 0.42)';
      ctx.lineWidth = 0.95;
      ctx.stroke();
    }

    function resize() {
      ({ ctx, width, height } = fitCanvas(canvas));
    }

    return { draw, resize };
  }

  function createInnerCitadel(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);
    let centerX = width * 0.5;
    let centerY = height * 0.5;

    const ringCount = 8;
    const particlesPerRing = reducedMotion ? 380 : 760;
    const ringParticles = [];
    const pulses = [];

    function setupParticles() {
      ringParticles.length = 0;
      const base = Math.min(width, height) * 0.09;
      const step = Math.min(width, height) * 0.053;

      for (let ring = 0; ring < ringCount; ring += 1) {
        const radius = base + ring * step;
        for (let i = 0; i < particlesPerRing; i += 1) {
          const angle = (i / particlesPerRing) * Math.PI * 2 + Math.random() * 0.01;
          ringParticles.push({
            ring,
            radius,
            angle,
            speed: 0.0016 + ring * 0.00016 + Math.random() * 0.0004,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    function addPulse(x, y, force) {
      const dx = x - centerX;
      const dy = y - centerY;
      pulses.push({
        theta: Math.atan2(dy, dx),
        radius: Math.hypot(dx, dy),
        force,
        age: 0,
      });
    }

    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      addPulse(event.clientX - rect.left, event.clientY - rect.top, 1.35);
    });

    function draw(time) {
      const t = time * 0.001;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.10)';
      ctx.fillRect(0, 0, width, height);

      if (!reducedMotion && Math.random() < 0.02) {
        const side = Math.floor(Math.random() * 4);
        const x = side === 0 ? 0 : side === 1 ? width : Math.random() * width;
        const y = side === 2 ? 0 : side === 3 ? height : Math.random() * height;
        addPulse(x, y, 0.9 + Math.random() * 0.5);
      }

      for (let i = pulses.length - 1; i >= 0; i -= 1) {
        const pulse = pulses[i];
        pulse.age += 1.8;
        pulse.radius -= 1.25;
        pulse.force *= 0.992;
        if (pulse.radius < 0 || pulse.force < 0.08 || pulse.age > 620) {
          pulses.splice(i, 1);
        }
      }

      const base = Math.min(width, height) * 0.09;
      const step = Math.min(width, height) * 0.053;

      ctx.fillStyle = '#2f2f2f';
      for (const p of ringParticles) {
        p.angle += p.speed;

        const ringNorm = p.ring / (ringCount - 1);
        let radialOffset = Math.sin(t * 0.9 + p.phase + p.ring * 0.5) * 1.2;

        for (const pulse of pulses) {
          const angleDelta = Math.atan2(Math.sin(p.angle - pulse.theta), Math.cos(p.angle - pulse.theta));
          const angularSpread = 0.22 + ringNorm * 0.28;
          const angularInfluence = Math.exp(-((angleDelta * angleDelta) / (angularSpread * angularSpread)));

          const distDelta = p.radius - pulse.radius;
          const radialInfluence = Math.exp(-((distDelta * distDelta) / 2600));

          radialOffset += angularInfluence * radialInfluence * pulse.force * ringNorm * 10;
        }

        const x = centerX + Math.cos(p.angle) * (p.radius + radialOffset);
        const y = centerY + Math.sin(p.angle) * (p.radius + radialOffset);

        ctx.globalAlpha = 0.1 + ringNorm * 0.28;
        ctx.fillRect(x, y, 0.9 + ringNorm * 0.85, 0.9 + ringNorm * 0.85);
      }

      ctx.globalAlpha = 1;

      for (let ring = 0; ring < ringCount; ring += 1) {
        const rr = base + ring * step;
        const ringNorm = ring / (ringCount - 1);
        ctx.beginPath();
        ctx.arc(centerX, centerY, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(52, 52, 52, ${0.24 - ringNorm * 0.12})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, base * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.94)';
      ctx.fill();
    }

    function resize() {
      ({ ctx, width, height } = fitCanvas(canvas));
      centerX = width * 0.5;
      centerY = height * 0.5;
      setupParticles();
    }

    setupParticles();
    return { draw, resize };
  }

  // Page 4: Erosion — particles drifting upward, dissolving (impermanence)
  function createErosion(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);
    const count = reducedMotion ? 600 : 2000;
    const particles = [];

    function seed() {
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: height * 0.5 + (Math.random() - 0.5) * height * 0.6,
          vy: -(0.15 + Math.random() * 0.35),
          vx: (Math.random() - 0.5) * 0.3,
          life: Math.random(),
          decay: 0.0008 + Math.random() * 0.0012,
          size: 0.6 + Math.random() * 1.2,
        });
      }
    }
    seed();

    function draw(time) {
      ctx.fillStyle = 'rgba(240, 238, 230, 0.08)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#2f2f2f';
      for (const p of particles) {
        p.x += p.vx + Math.sin(time * 0.001 + p.x * 0.01) * 0.15;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          p.x = Math.random() * width;
          p.y = height * 0.8 + Math.random() * height * 0.2;
          p.life = 0.8 + Math.random() * 0.2;
        }
        ctx.globalAlpha = p.life * 0.5;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }

    function resize() {
      ({ ctx, width, height } = fitCanvas(canvas));
      seed();
    }
    return { draw, resize };
  }

  // Page 5: Reset — pendulum bob swinging, always returning to center
  function createReset(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);

    function draw(time) {
      const t = time * 0.001;
      const cx = width * 0.5;
      const cy = height * 0.35;
      const len = Math.min(width, height) * 0.35;

      ctx.fillStyle = 'rgba(240, 238, 230, 0.12)';
      ctx.fillRect(0, 0, width, height);

      const angle = Math.sin(t * 0.7) * 0.6 * Math.exp(-((t % 12) * 0.08));
      const bx = cx + Math.sin(angle) * len;
      const by = cy + Math.cos(angle) * len;

      ctx.strokeStyle = 'rgba(52, 52, 52, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(bx, by);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.85)';
      ctx.fill();

      // Trail arcs
      ctx.strokeStyle = 'rgba(52, 52, 52, 0.08)';
      for (let i = 1; i <= 5; i++) {
        const r = len * (0.3 + i * 0.14);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0.4, Math.PI - 0.4);
        ctx.stroke();
      }
    }

    function resize() {
      ({ ctx, width, height } = fitCanvas(canvas));
    }
    return { draw, resize };
  }

  // Page 6: Dawn — expanding light rays from a horizon line
  function createDawn(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);

    function draw(time) {
      const t = time * 0.0006;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.15)';
      ctx.fillRect(0, 0, width, height);

      const horizon = height * 0.65;
      const cx = width * 0.5;

      // Rays
      const rayCount = 24;
      for (let i = 0; i < rayCount; i++) {
        const baseAngle = -Math.PI * (i / (rayCount - 1));
        const angle = baseAngle + Math.sin(t + i * 0.4) * 0.02;
        const rayLen = Math.min(width, height) * (0.5 + Math.sin(t * 0.8 + i) * 0.08);

        ctx.strokeStyle = `rgba(52, 52, 52, ${0.06 + Math.sin(t + i * 0.7) * 0.03})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, horizon);
        ctx.lineTo(cx + Math.cos(angle) * rayLen, horizon + Math.sin(angle) * rayLen);
        ctx.stroke();
      }

      // Horizon line
      ctx.strokeStyle = 'rgba(40, 40, 40, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(width, horizon);
      ctx.stroke();

      // Sun dot
      const sunR = 4 + Math.sin(t * 1.2) * 1;
      ctx.beginPath();
      ctx.arc(cx, horizon, sunR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.7)';
      ctx.fill();
    }

    function resize() {
      ({ ctx, width, height } = fitCanvas(canvas));
    }
    return { draw, resize };
  }

  // Page 7: Truth — rotating geometric facets that shift perspective
  function createTruth(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);

    function draw(time) {
      const t = time * 0.0008;
      const cx = width * 0.5;
      const cy = height * 0.5;
      const r = Math.min(width, height) * 0.28;

      ctx.fillStyle = 'rgba(240, 238, 230, 0.14)';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(52, 52, 52, 0.22)';
      ctx.lineWidth = 1;

      const sides = 7;
      for (let layer = 0; layer < 4; layer++) {
        const lr = r * (0.4 + layer * 0.2);
        const rot = t * (0.3 + layer * 0.15) * (layer % 2 === 0 ? 1 : -1);
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const a = (i / sides) * Math.PI * 2 + rot;
          const x = cx + Math.cos(a) * lr;
          const y = cy + Math.sin(a) * lr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Cross lines connecting layers
      for (let i = 0; i < sides; i++) {
        const a1 = (i / sides) * Math.PI * 2 + t * 0.3;
        const a2 = (i / sides) * Math.PI * 2 + t * -0.15;
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * r * 0.4, cy + Math.sin(a1) * r * 0.4);
        ctx.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function resize() {
      ({ ctx, width, height } = fitCanvas(canvas));
    }
    return { draw, resize };
  }

  // Page 8: Dye — ink diffusing through a medium (thoughts coloring the mind)
  function createDye(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);
    const count = reducedMotion ? 400 : 1200;
    const dots = [];

    function seed() {
      dots.length = 0;
      const cx = width * 0.5;
      const cy = height * 0.5;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * Math.min(width, height) * 0.02;
        dots.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    seed();

    function draw(time) {
      ctx.fillStyle = 'rgba(240, 238, 230, 0.03)';
      ctx.fillRect(0, 0, width, height);

      const t = time * 0.001;
      const maxR = Math.min(width, height) * 0.42;
      const cx = width * 0.5;
      const cy = height * 0.5;

      ctx.fillStyle = '#2f2f2f';
      for (const d of dots) {
        const dx = d.x - cx;
        const dy = d.y - cy;
        const dist = Math.hypot(dx, dy);

        d.vx += (Math.random() - 0.5) * 0.08 + Math.sin(t + d.phase) * 0.02;
        d.vy += (Math.random() - 0.5) * 0.08 + Math.cos(t + d.phase) * 0.02;
        d.vx *= 0.98;
        d.vy *= 0.98;
        d.x += d.vx;
        d.y += d.vy;

        if (dist > maxR) {
          d.x = cx + (Math.random() - 0.5) * 4;
          d.y = cy + (Math.random() - 0.5) * 4;
        }

        const alpha = 0.08 + (1 - dist / maxR) * 0.35;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillRect(d.x, d.y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    function resize() {
      ({ ctx, width, height } = fitCanvas(canvas));
      seed();
    }
    return { draw, resize };
  }

  // Page 9: Still Point — ripples expanding outward, calm center
  function createStillPoint(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);

    function draw(time) {
      const t = time * 0.001;
      const cx = width * 0.5;
      const cy = height * 0.5;
      const maxR = Math.min(width, height) * 0.44;

      ctx.fillStyle = 'rgba(240, 238, 230, 0.12)';
      ctx.fillRect(0, 0, width, height);

      const ringCount = 8;
      for (let i = 0; i < ringCount; i++) {
        const phase = (t * 0.5 + i * 0.8) % (ringCount * 0.8);
        const r = (phase / (ringCount * 0.8)) * maxR;
        const alpha = (1 - r / maxR) * 0.25;

        ctx.strokeStyle = `rgba(52, 52, 52, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Still center
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.9)';
      ctx.fill();
    }

    function resize() {
      ({ ctx, width, height } = fitCanvas(canvas));
    }
    return { draw, resize };
  }

  // Page 10: Hive — connected nodes pulsing together (community)
  function createHive(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);
    const nodeCount = 24;
    let nodes = [];

    function seed() {
      nodes = [];
      const cx = width * 0.5;
      const cy = height * 0.5;
      const spread = Math.min(width, height) * 0.35;
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2 + Math.random() * 0.3;
        const dist = spread * (0.3 + Math.random() * 0.7);
        nodes.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          baseX: cx + Math.cos(angle) * dist,
          baseY: cy + Math.sin(angle) * dist,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    seed();

    function draw(time) {
      const t = time * 0.001;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.12)';
      ctx.fillRect(0, 0, width, height);

      // Animate positions
      for (const n of nodes) {
        n.x = n.baseX + Math.sin(t * 0.4 + n.phase) * 6;
        n.y = n.baseY + Math.cos(t * 0.3 + n.phase) * 6;
      }

      // Draw connections
      const connectDist = Math.min(width, height) * 0.3;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < connectDist) {
            const alpha = (1 - dist / connectDist) * 0.18;
            ctx.strokeStyle = `rgba(52, 52, 52, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      const pulse = Math.sin(t * 1.2) * 0.3 + 0.7;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.5 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 34, 34, 0.7)';
        ctx.fill();
      }
    }

    function resize() {
      ({ ctx, width, height } = fitCanvas(canvas));
      seed();
    }
    return { draw, resize };
  }

  // ─────────────────────────────────────────────
  // 25 PARAMETERIZED V-FAMILIES (pages 11-81)
  // ─────────────────────────────────────────────

  // 1. Vortex — particle vortex, seed varies count/swirl/direction
  function createVortexV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const counts = [4000, 6000, 5000, 8000];
    const frequencies = [2, 3.5, 5, 4];
    const directions = [1, -1, 1, -1];
    const pullFactors = [0.0008, 0.0012, 0.0006, 0.0015];
    const count = reducedMotion ? Math.floor(counts[seed] * 0.3) : counts[seed];
    const freq = frequencies[seed];
    const dir = directions[seed];
    const pullBase = pullFactors[seed];
    let particles = [];
    let cx, cy, maxR;

    function init() {
      cx = width * 0.5; cy = height * 0.5;
      maxR = Math.min(width, height) * 0.42;
      particles = [];
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.5) * maxR;
        particles.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2 });
      }
    }
    init();

    function draw(time) {
      ctx.fillStyle = 'rgba(240, 238, 230, 0.07)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#2f2f2f';
      const t = time * 0.0007;
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        const dx = p.x - cx, dy = p.y - cy;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const pull = pullBase + (dist / maxR) * pullBase * 2;
        const swirl = Math.sin(angle * freq + t * dir + p.phase) * 0.003;
        p.vx = p.vx * 0.94 - dx * pull - dy * swirl;
        p.vy = p.vy * 0.94 - dy * pull + dx * swirl;
        p.x += p.vx; p.y += p.vy;
        if (dist < 5 || dist > maxR * 1.1) {
          const a = Math.random() * Math.PI * 2;
          const r = maxR * (0.88 + Math.random() * 0.18);
          particles[i] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2 };
          continue;
        }
        const dn = Math.min(1, dist / maxR);
        ctx.globalAlpha = 0.12 + (1 - dn) * 0.4;
        ctx.fillRect(p.x, p.y, 0.7 + (1 - dn) * 0.6, 0.7 + (1 - dn) * 0.6);
      }
      ctx.globalAlpha = 1;
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); init(); }
    return { draw, resize };
  }

  // 2. TorusV — 3D torus projection, seed varies size/angle/speed/field lines
  function createTorusV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const torusRatios = [0.22, 0.28, 0.18, 0.24];
    const poloidalRatios = [0.10, 0.14, 0.08, 0.12];
    const yCompressions = [0.56, 0.45, 0.65, 0.38];
    const rotSpeeds = [0.00095, 0.0006, 0.0012, 0.00075];
    const fieldLineCounts = [40, 52, 30, 60];
    const tr = torusRatios[seed];
    const pr = poloidalRatios[seed];
    const yc = yCompressions[seed];
    const rs = rotSpeeds[seed];
    const fl = fieldLineCounts[seed];

    function draw(time) {
      const t = time * rs;
      const cx = width * 0.5, cy = height * 0.5;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.18)';
      ctx.fillRect(0, 0, width, height);
      const tR = Math.min(width, height) * tr;
      const pR = Math.min(width, height) * pr;
      ctx.fillStyle = '#333333';
      for (let i = 0; i < fl; i++) {
        const u = (i / fl) * Math.PI * 2;
        for (let j = 0; j < fl; j++) {
          const v = (j / fl) * Math.PI * 2;
          const x = (tR + pR * Math.cos(v)) * Math.cos(u + t);
          const y = (tR + pR * Math.cos(v)) * Math.sin(u + t);
          const z = pR * Math.sin(v);
          const sc = 180 / (180 + z);
          const phase = t + u * 0.5 + v * 0.4;
          ctx.globalAlpha = 0.1 + sc * 0.28;
          ctx.fillRect(cx + x * sc, cy + y * sc * yc + Math.sin(phase) * 2, 1.1, 1.1);
        }
      }
      ctx.globalAlpha = 1;
      const core = Math.min(width, height) * 0.05;
      ctx.beginPath();
      ctx.arc(cx, cy, core * 1.8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(52, 52, 52, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 3. RingsV — concentric particle rings, seed varies ring count/direction/density/spacing
  function createRingsV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const ringCounts = [5, 7, 4, 10];
    const densities = [500, 350, 700, 280];
    const spacings = [0.06, 0.05, 0.07, 0.04];
    const altDir = [false, true, false, true];
    const rc = ringCounts[seed];
    const dens = reducedMotion ? Math.floor(densities[seed] * 0.4) : densities[seed];
    const sp = spacings[seed];
    const alt = altDir[seed];
    let particles = [], cx, cy;

    function init() {
      cx = width * 0.5; cy = height * 0.5;
      particles = [];
      const base = Math.min(width, height) * 0.07;
      const step = Math.min(width, height) * sp;
      for (let r = 0; r < rc; r++) {
        const radius = base + r * step;
        const dir = alt ? (r % 2 === 0 ? 1 : -1) : 1;
        for (let i = 0; i < dens; i++) {
          particles.push({ ring: r, radius, angle: (i / dens) * Math.PI * 2, speed: (0.001 + r * 0.0003) * dir, phase: Math.random() * Math.PI * 2 });
        }
      }
    }
    init();

    function draw(time) {
      const t = time * 0.001;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.09)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#2f2f2f';
      for (const p of particles) {
        p.angle += p.speed;
        const wobble = Math.sin(t * 0.6 + p.phase + p.ring * 0.4) * 1.5;
        const x = cx + Math.cos(p.angle) * (p.radius + wobble);
        const y = cy + Math.sin(p.angle) * (p.radius + wobble);
        const rn = p.ring / (rc - 1);
        ctx.globalAlpha = 0.08 + rn * 0.3;
        ctx.fillRect(x, y, 0.8 + rn * 0.7, 0.8 + rn * 0.7);
      }
      ctx.globalAlpha = 1;
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); init(); }
    return { draw, resize };
  }

  // 4. DriftV — particles drifting, seed varies direction/size/turbulence/density
  function createDriftV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const sizes = [0.8, 1.4, 0.6, 2.0];
    const turbulences = [0.12, 0.3, 0.08, 0.4];
    const densities = [1200, 800, 1600, 600];
    const [dx, dy] = dirs[seed];
    const sz = sizes[seed];
    const turb = turbulences[seed];
    const count = reducedMotion ? Math.floor(densities[seed] * 0.35) : densities[seed];
    let particles = [];

    function init() {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width, y: Math.random() * height,
          speed: 0.2 + Math.random() * 0.5,
          life: Math.random(), decay: 0.003 + Math.random() * 0.004,
          ox: (Math.random() - 0.5) * 3, oy: (Math.random() - 0.5) * 3,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    init();

    function draw(time) {
      ctx.fillStyle = 'rgba(240, 238, 230, 0.08)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#2f2f2f';
      const t = time * 0.001;
      for (const p of particles) {
        const tx = Math.sin(t * 0.5 + p.phase) * turb;
        const ty = Math.cos(t * 0.4 + p.phase) * turb;
        p.x += (dx * p.speed + p.ox * 0.02 + tx);
        p.y += (dy * p.speed + p.oy * 0.02 + ty);
        p.life -= p.decay;
        if (p.life <= 0 || p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) {
          p.x = dx < 0 ? width + 5 : dx > 0 ? -5 : Math.random() * width;
          p.y = dy < 0 ? height + 5 : dy > 0 ? -5 : Math.random() * height;
          p.life = 0.7 + Math.random() * 0.3;
        }
        ctx.globalAlpha = p.life * 0.4;
        ctx.fillRect(p.x, p.y, sz, sz);
      }
      ctx.globalAlpha = 1;
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); init(); }
    return { draw, resize };
  }

  // 5. PendulumV — oscillating pendulums, seed varies count/length/trail/decay
  function createPendulumV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const pendulumCounts = [1, 2, 3, 1];
    const trailVisible = [false, true, true, false];
    const decayRates = [0.06, 0.04, 0.08, 0.02];
    const lenFactors = [0.38, 0.28, 0.22, 0.45];
    const pc = pendulumCounts[seed];
    const trail = trailVisible[seed];
    const decay = decayRates[seed];
    const lenF = lenFactors[seed];

    function draw(time) {
      const t = time * 0.001;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.13)';
      ctx.fillRect(0, 0, width, height);
      const len = Math.min(width, height) * lenF;
      for (let p = 0; p < pc; p++) {
        const cx = width * (0.3 + p * (0.4 / Math.max(1, pc - 1)));
        const cy = height * 0.3;
        const phaseOff = p * 0.7;
        const angle = Math.sin(t * (0.6 + p * 0.15) + phaseOff) * 0.7 * Math.exp(-((t % 14) * decay));
        const bx = cx + Math.sin(angle) * len;
        const by = cy + Math.cos(angle) * len;
        ctx.strokeStyle = 'rgba(52, 52, 52, 0.28)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 34, 34, 0.8)';
        ctx.fill();
        if (trail) {
          ctx.strokeStyle = 'rgba(52, 52, 52, 0.07)';
          for (let i = 1; i <= 4; i++) {
            const r = len * (0.25 + i * 0.18);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0.5, Math.PI - 0.5);
            ctx.stroke();
          }
        }
      }
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 6. RaysV — radiating lines, seed varies origin/count/style/speed
  function createRaysV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const origins = [[0.5, 0.5], [0.5, 0.9], [0.1, 0.1], [0.9, 0.1]];
    const rayCounts = [18, 24, 12, 36];
    const curved = [false, false, true, true];
    const speeds = [0.0006, 0.0009, 0.0004, 0.0012];
    const [ox, oy] = origins[seed];
    const rc = rayCounts[seed];
    const isCurved = curved[seed];
    const spd = speeds[seed];

    function draw(time) {
      const t = time * spd;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.14)';
      ctx.fillRect(0, 0, width, height);
      const srcX = width * ox, srcY = height * oy;
      const rayLen = Math.max(width, height) * 1.1;
      for (let i = 0; i < rc; i++) {
        const baseA = (i / rc) * Math.PI * 2;
        const a = baseA + Math.sin(t + i * 0.5) * 0.025;
        const alpha = 0.05 + Math.sin(t * 0.9 + i * 0.8) * 0.025;
        ctx.strokeStyle = `rgba(52, 52, 52, ${Math.max(0.02, alpha)})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(srcX, srcY);
        if (isCurved) {
          const mx = srcX + Math.cos(a + 0.4) * rayLen * 0.5;
          const my = srcY + Math.sin(a + 0.4) * rayLen * 0.5;
          ctx.quadraticCurveTo(mx, my, srcX + Math.cos(a) * rayLen, srcY + Math.sin(a) * rayLen);
        } else {
          ctx.lineTo(srcX + Math.cos(a) * rayLen, srcY + Math.sin(a) * rayLen);
        }
        ctx.stroke();
      }
      const pulse = 3 + Math.sin(t * 1.5) * 1.2;
      ctx.beginPath();
      ctx.arc(srcX, srcY, pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.7)';
      ctx.fill();
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 7. GeometricV — rotating polygons, seed varies sides/layers/rotation/nesting
  function createGeometricV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const sidesList = [3, 5, 6, 8];
    const layerCounts = [4, 3, 6, 2];
    const rotDirs = [[1, -1, 1, -1, 1, -1], [-1, 1, -1, 1, -1, 1], [1, 1, -1, -1, 1, 1], [1, -1, -1, 1, 1, -1]];
    const nestStyles = [0.22, 0.18, 0.15, 0.28];
    const sides = sidesList[seed];
    const layers = layerCounts[seed];
    const dirs = rotDirs[seed];
    const nest = nestStyles[seed];

    function draw(time) {
      const t = time * 0.0007;
      const cx = width * 0.5, cy = height * 0.5;
      const maxR = Math.min(width, height) * 0.32;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.13)';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 1;
      for (let layer = 0; layer < layers; layer++) {
        const r = maxR * (nest + layer * ((1 - nest) / Math.max(1, layers - 1)));
        const rot = t * (0.25 + layer * 0.12) * dirs[layer % dirs.length];
        const alpha = 0.12 + (1 - layer / layers) * 0.2;
        ctx.strokeStyle = `rgba(52, 52, 52, ${alpha})`;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const a = (i / sides) * Math.PI * 2 + rot;
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.7)';
      ctx.fill();
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 8. DiffusionV — expanding particle cloud, seed varies source count/position/speed/size
  function createDiffusionV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const sourceCounts = [1, 2, 3, 1];
    const sourcePos = [[0.5, 0.5], [0.3, 0.5], [0.5, 0.3], [0.2, 0.7]];
    const diffSpeeds = [0.5, 0.35, 0.65, 0.8];
    const ptSizes = [1.0, 0.7, 1.4, 0.5];
    const sc = sourceCounts[seed];
    const spd = diffSpeeds[seed];
    const psz = ptSizes[seed];
    const count = reducedMotion ? 300 : 900;
    let particles = [];

    function init() {
      particles = [];
      for (let i = 0; i < count; i++) {
        const sIdx = i % sc;
        const [sx, sy] = sourcePos[(seed + sIdx) % sourcePos.length];
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 4;
        particles.push({
          x: width * sx + Math.cos(a) * r, y: height * sy + Math.sin(a) * r,
          vx: (Math.random() - 0.5) * spd, vy: (Math.random() - 0.5) * spd,
          life: 0.7 + Math.random() * 0.3, decay: 0.002 + Math.random() * 0.003,
          srcX: width * sx, srcY: height * sy,
        });
      }
    }
    init();

    function draw(time) {
      ctx.fillStyle = 'rgba(240, 238, 230, 0.05)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#2f2f2f';
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.997; p.vy *= 0.997;
        p.life -= p.decay;
        if (p.life <= 0) {
          const a = Math.random() * Math.PI * 2;
          p.x = p.srcX + Math.cos(a) * 3; p.y = p.srcY + Math.sin(a) * 3;
          p.vx = (Math.random() - 0.5) * spd; p.vy = (Math.random() - 0.5) * spd;
          p.life = 0.7 + Math.random() * 0.3;
        }
        ctx.globalAlpha = p.life * 0.35;
        ctx.fillRect(p.x, p.y, psz, psz);
      }
      ctx.globalAlpha = 1;
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); init(); }
    return { draw, resize };
  }

  // 9. RippleV — expanding circles, seed varies center/ring count/speed/thickness
  function createRippleV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const centers = [[0.5, 0.5], [0.3, 0.4], [0.6, 0.7], [0.5, 0.3]];
    const ringCounts = [7, 10, 5, 12];
    const expSpeeds = [0.5, 0.35, 0.7, 0.28];
    const thicknesses = [1.0, 0.6, 1.4, 0.4];
    const [cxr, cyr] = centers[seed];
    const rc = ringCounts[seed];
    const spd = expSpeeds[seed];
    const lw = thicknesses[seed];

    function draw(time) {
      const t = time * 0.001;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.12)';
      ctx.fillRect(0, 0, width, height);
      const cx = width * cxr, cy = height * cyr;
      const maxR = Math.min(width, height) * 0.46;
      ctx.lineWidth = lw;
      for (let i = 0; i < rc; i++) {
        const phase = (t * spd + i * (1.0 / rc)) % 1.0;
        const r = phase * maxR;
        const alpha = (1 - phase) * 0.28;
        ctx.strokeStyle = `rgba(52, 52, 52, ${alpha})`;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0.5, r), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.85)';
      ctx.fill();
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 10. NetworkV — connected nodes, seed varies count/distance/speed/layout
  function createNetworkV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const nodeCounts = [18, 30, 12, 36];
    const connectDistFactors = [0.3, 0.22, 0.38, 0.18];
    const moveSpeed = [0.4, 0.6, 0.25, 0.8];
    const layouts = ['circular', 'random', 'grid', 'random'];
    const nc = nodeCounts[seed];
    const cdf = connectDistFactors[seed];
    const ms = moveSpeed[seed];
    const layout = layouts[seed];
    let nodes = [];

    function init() {
      nodes = [];
      const cx = width * 0.5, cy = height * 0.5;
      const spread = Math.min(width, height) * 0.38;
      for (let i = 0; i < nc; i++) {
        let bx, by;
        if (layout === 'circular') {
          const a = (i / nc) * Math.PI * 2;
          const r = spread * (0.4 + Math.random() * 0.6);
          bx = cx + Math.cos(a) * r; by = cy + Math.sin(a) * r;
        } else if (layout === 'grid') {
          const cols = Math.ceil(Math.sqrt(nc));
          const row = Math.floor(i / cols), col = i % cols;
          bx = width * 0.1 + (col / cols) * width * 0.8;
          by = height * 0.1 + (row / Math.ceil(nc / cols)) * height * 0.8;
        } else {
          bx = width * 0.1 + Math.random() * width * 0.8;
          by = height * 0.1 + Math.random() * height * 0.8;
        }
        nodes.push({ x: bx, y: by, bx, by, phase: Math.random() * Math.PI * 2 });
      }
    }
    init();

    function draw(time) {
      const t = time * 0.001;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.11)';
      ctx.fillRect(0, 0, width, height);
      for (const n of nodes) {
        n.x = n.bx + Math.sin(t * ms * 0.4 + n.phase) * 7;
        n.y = n.by + Math.cos(t * ms * 0.3 + n.phase) * 7;
      }
      const cd = Math.min(width, height) * cdf;
      ctx.lineWidth = 0.7;
      for (let i = 0; i < nc; i++) {
        for (let j = i + 1; j < nc; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < cd) {
            ctx.strokeStyle = `rgba(52, 52, 52, ${(1 - d / cd) * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      const pulse = Math.sin(t * 1.1) * 0.3 + 0.7;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 34, 34, 0.65)';
        ctx.fill();
      }
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); init(); }
    return { draw, resize };
  }

  // 11. WavesV — sine waves, seed varies orientation/count/amplitude/frequency
  function createWavesV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const orientations = ['horizontal', 'vertical', 'diagonal', 'horizontal'];
    const waveCounts = [6, 4, 8, 10];
    const amplitudes = [16, 28, 10, 20];
    const frequencies = [0.012, 0.008, 0.016, 0.006];
    const ori = orientations[seed];
    const wc = waveCounts[seed];
    const amp = amplitudes[seed];
    const freq = frequencies[seed];

    function draw(time) {
      const t = time * 0.0007;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.13)';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 0.9;
      for (let w = 0; w < wc; w++) {
        const alpha = 0.1 + (1 - w / wc) * 0.12;
        ctx.strokeStyle = `rgba(52, 52, 52, ${alpha})`;
        ctx.beginPath();
        if (ori === 'horizontal') {
          const baseY = height * (0.15 + w * (0.7 / wc));
          for (let x = 0; x <= width; x += 2) {
            const y = baseY + Math.sin(x * freq + t + w * 0.9) * (amp + w * 3);
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
        } else if (ori === 'vertical') {
          const baseX = width * (0.15 + w * (0.7 / wc));
          for (let y = 0; y <= height; y += 2) {
            const x = baseX + Math.sin(y * freq + t + w * 0.9) * (amp + w * 3);
            y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
        } else {
          const baseD = Math.min(width, height) * (0.1 + w * (0.8 / wc));
          for (let i = 0; i <= width + height; i += 3) {
            const x = i - height * 0.5;
            const y = baseD + Math.sin(i * freq * 0.7 + t + w * 0.9) * amp;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 12. FlowV — flow field particles, seed varies field pattern/count/trail/speed
  function createFlowV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const patterns = ['sincos', 'circular', 'diagonal', 'vortex'];
    const ptCounts = [1200, 800, 1800, 600];
    const trailLengths = [160, 260, 100, 350];
    const ptSpeeds = [0.9, 0.6, 1.2, 0.45];
    const pattern = patterns[seed];
    const count = reducedMotion ? Math.floor(ptCounts[seed] * 0.3) : ptCounts[seed];
    const maxAge = trailLengths[seed];
    const spd = ptSpeeds[seed];
    let particles = [];

    function init() {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({ x: Math.random() * width, y: Math.random() * height, age: Math.random() * maxAge });
      }
    }
    init();

    function draw(time) {
      ctx.fillStyle = 'rgba(240, 238, 230, 0.04)';
      ctx.fillRect(0, 0, width, height);
      const t = time * 0.00025;
      ctx.fillStyle = '#2f2f2f';
      for (const p of particles) {
        let angle;
        const nx = p.x / width, ny = p.y / height;
        if (pattern === 'sincos') angle = Math.sin(nx * 4 + t) * Math.cos(ny * 3 + t * 0.7) * Math.PI * 2;
        else if (pattern === 'circular') angle = Math.atan2(p.y - height * 0.5, p.x - width * 0.5) + Math.PI * 0.5 + Math.sin(t) * 0.5;
        else if (pattern === 'diagonal') angle = (nx + ny) * Math.PI * 2 * 0.8 + t;
        else angle = Math.sin(nx * Math.PI * 2 + t) * Math.cos(ny * Math.PI * 2 + t * 0.8) * Math.PI * 3;
        p.x += Math.cos(angle) * spd; p.y += Math.sin(angle) * spd;
        p.age += 1;
        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height || p.age > maxAge) {
          p.x = Math.random() * width; p.y = Math.random() * height; p.age = 0;
        }
        ctx.globalAlpha = Math.min(0.28, p.age / maxAge * 0.28);
        ctx.fillRect(p.x, p.y, 0.8, 0.8);
      }
      ctx.globalAlpha = 1;
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); init(); }
    return { draw, resize };
  }

  // 13. OrbitV — orbiting bodies, seed varies count/eccentricity/speed/size
  function createOrbitV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const bodyCounts = [8, 14, 6, 18];
    const eccentricities = [0, 0.3, 0.5, 0.15];
    const speedRanges = [[0.3, 0.6], [0.2, 0.8], [0.5, 0.9], [0.15, 0.5]];
    const sizeVariations = [0, 1.5, 3.0, 0.5];
    const bc = bodyCounts[seed];
    const ecc = eccentricities[seed];
    const [sMin, sMax] = speedRanges[seed];
    const sv = sizeVariations[seed];
    const bodies = [];
    for (let i = 0; i < bc; i++) {
      bodies.push({
        radius: 0.08 + i * (0.4 / bc),
        eccX: 1, eccY: 1 - ecc * (i % 2),
        speed: sMin + Math.random() * (sMax - sMin) * (i % 2 === 0 ? 1 : -1),
        phase: Math.random() * Math.PI * 2,
        size: 1.5 + Math.random() * sv,
      });
    }

    function draw(time) {
      const t = time * 0.001;
      const cx = width * 0.5, cy = height * 0.5;
      const scale = Math.min(width, height) * 0.48;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.1)';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(52, 52, 52, 0.06)';
      ctx.lineWidth = 0.5;
      for (const b of bodies) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, b.radius * scale * b.eccX, b.radius * scale * b.eccY, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (const b of bodies) {
        const a = t * b.speed + b.phase;
        const x = cx + Math.cos(a) * b.radius * scale * b.eccX;
        const y = cy + Math.sin(a) * b.radius * scale * b.eccY;
        ctx.beginPath();
        ctx.arc(x, y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 34, 34, 0.62)';
        ctx.fill();
      }
      ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.88)'; ctx.fill();
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 14. GridV — shifting dot grid, seed varies spacing/distortion/pattern/dot size
  function createGridV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const spacings = [14, 20, 12, 24];
    const distAmounts = [3, 6, 2, 9];
    const distPatterns = ['wave', 'radial', 'random', 'wave'];
    const dotSizes = [1.0, 1.4, 0.7, 2.0];
    const sp = spacings[seed];
    const da = distAmounts[seed];
    const dp = distPatterns[seed];
    const ds = dotSizes[seed];

    function draw(time) {
      const t = time * 0.001;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.16)';
      ctx.fillRect(0, 0, width, height);
      const cols = Math.ceil(width / sp) + 1;
      const rows = Math.ceil(height / sp) + 1;
      ctx.fillStyle = '#2f2f2f';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = c * sp, by = r * sp;
          let ddx = 0, ddy = 0;
          if (dp === 'wave') {
            ddx = Math.sin(t * 0.5 + c * 0.35 + r * 0.2) * da;
            ddy = Math.cos(t * 0.4 + r * 0.3 + c * 0.15) * da;
          } else if (dp === 'radial') {
            const dx = bx - width * 0.5, dy = by - height * 0.5;
            const angle = Math.atan2(dy, dx) + t * 0.3;
            const d = Math.hypot(dx, dy);
            ddx = Math.cos(angle) * Math.sin(d * 0.02 + t) * da;
            ddy = Math.sin(angle) * Math.sin(d * 0.02 + t) * da;
          } else {
            ddx = Math.sin(t * 0.6 + c * 0.7 + r * 0.4) * da;
            ddy = Math.sin(t * 0.5 + r * 0.8 + c * 0.3) * da;
          }
          const dist = Math.hypot(bx - width * 0.5, by - height * 0.5);
          const maxDist = Math.hypot(width * 0.5, height * 0.5);
          ctx.globalAlpha = 0.05 + (1 - dist / maxDist) * 0.24;
          ctx.fillRect(bx + ddx, by + ddy, ds, ds);
        }
      }
      ctx.globalAlpha = 1;
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 15. BreathV — breathing shapes, seed varies shape/ring count/rate/phase offset
  function createBreathV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const shapes = ['circle', 'square', 'hexagon', 'circle'];
    const ringCounts = [5, 7, 4, 8];
    const breathRates = [0.4, 0.28, 0.55, 0.18];
    const phaseOffsets = [0.5, 0.3, 0.8, 0.15];
    const shape = shapes[seed];
    const rc = ringCounts[seed];
    const rate = breathRates[seed];
    const phOff = phaseOffsets[seed];

    function drawShape(ctx, cx, cy, r, shape) {
      ctx.beginPath();
      if (shape === 'circle') {
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      } else if (shape === 'square') {
        ctx.rect(cx - r, cy - r, r * 2, r * 2);
      } else {
        for (let i = 0; i <= 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      }
    }

    function draw(time) {
      const t = time * 0.001;
      const cx = width * 0.5, cy = height * 0.5;
      const maxR = Math.min(width, height) * 0.42;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.11)';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 1;
      for (let i = 0; i < rc; i++) {
        const breathPhase = Math.sin(t * rate + i * phOff);
        const r = maxR * ((i + 1) / rc) * (0.78 + breathPhase * 0.22);
        const alpha = 0.07 + (1 - i / rc) * 0.18;
        ctx.strokeStyle = `rgba(52, 52, 52, ${alpha})`;
        drawShape(ctx, cx, cy, r, shape);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5 + Math.sin(t * rate) * 1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.82)';
      ctx.fill();
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 16. SpiralV — spiral arm particles, seed varies arm count/tightness/speed/density
  function createSpiralV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const armCounts = [2, 3, 4, 5];
    const tightnesses = [0.25, 0.18, 0.32, 0.14];
    const rotSpeeds = [0.0004, 0.0006, 0.0003, 0.0008];
    const densities = [1200, 900, 800, 600];
    const arms = armCounts[seed];
    const tight = tightnesses[seed];
    const rotSpd = rotSpeeds[seed];
    const count = reducedMotion ? Math.floor(densities[seed] * 0.35) : densities[seed];
    let particles = [], cx, cy, maxR;

    function init() {
      cx = width * 0.5; cy = height * 0.5;
      maxR = Math.min(width, height) * 0.44;
      particles = [];
      for (let i = 0; i < count; i++) {
        const arm = i % arms;
        const t = Math.random();
        const angle = (arm / arms) * Math.PI * 2 + t * Math.PI * 2 * tight * 8;
        const r = t * maxR;
        particles.push({
          angle, r, speed: 0.0005 + Math.random() * 0.0005,
          drift: (Math.random() - 0.5) * 0.08,
        });
      }
    }
    init();

    function draw(time) {
      const t = time * rotSpd;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.06)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#2f2f2f';
      for (const p of particles) {
        p.angle += p.speed;
        p.r += p.drift * 0.05;
        if (p.r > maxR || p.r < 0) p.drift *= -1;
        const x = cx + Math.cos(p.angle + t) * p.r;
        const y = cy + Math.sin(p.angle + t) * p.r;
        const dn = Math.min(1, p.r / maxR);
        ctx.globalAlpha = 0.08 + (1 - dn) * 0.35;
        ctx.fillRect(x, y, 0.8 + dn * 0.5, 0.8 + dn * 0.5);
      }
      ctx.globalAlpha = 1;
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); init(); }
    return { draw, resize };
  }

  // 17. LatticeV — intersecting line grids, seed varies angle pair/count/amplitude/spacing
  function createLatticeV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const anglePairs = [[30, 60], [45, 135], [20, 70], [15, 75]];
    const lineCounts = [14, 10, 18, 8];
    const moveAmps = [3, 6, 2, 9];
    const lineSpacings = [28, 38, 22, 50];
    const [a1deg, a2deg] = anglePairs[seed];
    const lc = lineCounts[seed];
    const amp = moveAmps[seed];
    const sp = lineSpacings[seed];
    const a1 = a1deg * Math.PI / 180;
    const a2 = a2deg * Math.PI / 180;

    function draw(time) {
      const t = time * 0.0006;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.15)';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 0.7;
      const diag = Math.hypot(width, height);
      for (let set = 0; set < 2; set++) {
        const angle = set === 0 ? a1 : a2;
        const count2 = lc + set * 2;
        for (let i = 0; i < count2; i++) {
          const base = (i - count2 / 2) * sp;
          const shift = Math.sin(t + i * 0.4 + set * 1.2) * amp;
          const cos = Math.cos(angle), sin = Math.sin(angle);
          const perpX = -sin, perpY = cos;
          const startX = width * 0.5 + perpX * (base + shift) - cos * diag;
          const startY = height * 0.5 + perpY * (base + shift) - sin * diag;
          const endX = width * 0.5 + perpX * (base + shift) + cos * diag;
          const endY = height * 0.5 + perpY * (base + shift) + sin * diag;
          const alpha = 0.06 + Math.abs(Math.sin(t * 0.5 + i * 0.3)) * 0.1;
          ctx.strokeStyle = `rgba(52, 52, 52, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 18. ConstellationV — star points with connections, seed varies count/distance/twinkle/drift
  function createConstellationV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const starCounts = [25, 38, 20, 50];
    const connectDists = [0.28, 0.2, 0.35, 0.16];
    const twinkleSpeeds = [1.0, 0.6, 1.5, 0.4];
    const driftAmounts = [0.15, 0.4, 0.08, 0.6];
    const sc = starCounts[seed];
    const cd = connectDists[seed];
    const tw = twinkleSpeeds[seed];
    const dr = driftAmounts[seed];
    let stars = [];

    function init() {
      stars = [];
      for (let i = 0; i < sc; i++) {
        stars.push({
          x: width * 0.1 + Math.random() * width * 0.8,
          y: height * 0.1 + Math.random() * height * 0.8,
          bx: 0, by: 0,
          phase: Math.random() * Math.PI * 2,
          size: 1.2 + Math.random() * 1.8,
        });
        stars[i].bx = stars[i].x; stars[i].by = stars[i].y;
      }
    }
    init();

    function draw(time) {
      const t = time * 0.001;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.1)';
      ctx.fillRect(0, 0, width, height);
      for (const s of stars) {
        s.x = s.bx + Math.sin(t * dr + s.phase) * 5;
        s.y = s.by + Math.cos(t * dr * 0.7 + s.phase) * 5;
      }
      const maxD = Math.min(width, height) * cd;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < sc; i++) {
        for (let j = i + 1; j < sc; j++) {
          const d = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
          if (d < maxD) {
            ctx.strokeStyle = `rgba(52, 52, 52, ${(1 - d / maxD) * 0.15})`;
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }
      for (const s of stars) {
        const twinkle = Math.sin(t * tw + s.phase) * 0.4 + 0.6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * twinkle, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 34, 34, ${0.5 + twinkle * 0.3})`;
        ctx.fill();
      }
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); init(); }
    return { draw, resize };
  }

  // 19. CurtainV — swaying lines, seed varies orientation/count/amplitude/frequency
  function createCurtainV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const orientations = ['vertical', 'horizontal', 'vertical', 'horizontal'];
    const lineCounts = [20, 15, 35, 25];
    const swayAmps = [12, 18, 7, 25];
    const swayFreqs = [0.6, 0.4, 1.0, 0.3];
    const ori = orientations[seed];
    const lc = lineCounts[seed];
    const sa = swayAmps[seed];
    const sf = swayFreqs[seed];

    function draw(time) {
      const t = time * 0.001;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.13)';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 0.8;
      for (let i = 0; i < lc; i++) {
        const alpha = 0.07 + (1 - Math.abs(i - lc / 2) / (lc / 2)) * 0.12;
        ctx.strokeStyle = `rgba(52, 52, 52, ${alpha})`;
        ctx.beginPath();
        if (ori === 'vertical') {
          const baseX = (i / (lc - 1)) * width;
          const steps = 40;
          for (let s = 0; s <= steps; s++) {
            const y = (s / steps) * height;
            const x = baseX + Math.sin(y * 0.015 * sf + t * sf + i * 0.3) * sa;
            s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
        } else {
          const baseY = (i / (lc - 1)) * height;
          const steps = 40;
          for (let s = 0; s <= steps; s++) {
            const x = (s / steps) * width;
            const y = baseY + Math.sin(x * 0.015 * sf + t * sf + i * 0.3) * sa;
            s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 20. TerrainV — undulating landscape lines, seed varies layers/complexity/height/speed
  function createTerrainV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const layerCounts = [2, 3, 1, 4];
    const harmonicCounts = [3, 2, 5, 2];
    const heightRanges = [0.15, 0.25, 0.1, 0.3];
    const animSpeeds = [0.0005, 0.0008, 0.0003, 0.0012];
    const lc = layerCounts[seed];
    const hc = harmonicCounts[seed];
    const hr = heightRanges[seed];
    const as = animSpeeds[seed];

    function draw(time) {
      const t = time * as;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.14)';
      ctx.fillRect(0, 0, width, height);
      for (let layer = 0; layer < lc; layer++) {
        const baseY = height * (0.4 + layer * (0.45 / Math.max(1, lc - 1)));
        const alpha = 0.12 + (1 - layer / lc) * 0.16;
        ctx.strokeStyle = `rgba(52, 52, 52, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const steps = Math.ceil(width / 3);
        for (let s = 0; s <= steps; s++) {
          const x = (s / steps) * width;
          let y = baseY;
          for (let h = 1; h <= hc; h++) {
            y += Math.sin(x * 0.008 * h + t * (1 + layer * 0.4) + h * 1.2 + layer * 0.7) * height * (hr / h);
          }
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 21. WeaveV — overlapping curves, seed varies strand count/frequency/amplitude/intensity
  function createWeaveV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const strandCounts = [4, 6, 3, 7];
    const freqRatios = [1.5, 2.3, 0.8, 3.1];
    const amplitudes = [0.12, 0.18, 0.08, 0.22];
    const intensities = [0.14, 0.1, 0.18, 0.08];
    const sc = strandCounts[seed];
    const fr = freqRatios[seed];
    const amp = amplitudes[seed];
    const intens = intensities[seed];

    function draw(time) {
      const t = time * 0.0006;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.12)';
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 1;
      for (let s = 0; s < sc; s++) {
        const phaseOff = (s / sc) * Math.PI * 2;
        ctx.strokeStyle = `rgba(52, 52, 52, ${intens})`;
        ctx.beginPath();
        const steps = Math.ceil(width / 2);
        for (let i = 0; i <= steps; i++) {
          const x = (i / steps) * width;
          const y = height * 0.5 +
            Math.sin(x * 0.01 * fr + t + phaseOff) * height * amp +
            Math.sin(x * 0.006 + t * 0.6 + phaseOff * 1.3) * height * amp * 0.5;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // 22. SandV — falling/drifting particles, seed varies direction/wind/count/accumulation
  function createSandV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const fallDirs = [[0, 1], [0, -1], [1, 0.4], [-1, 0.4]];
    const windStrengths = [0.1, 0.25, 0.4, 0.15];
    const ptCounts = [1400, 900, 700, 1100];
    const accums = [false, false, true, true];
    const [fdx, fdy] = fallDirs[seed];
    const wind = windStrengths[seed];
    const count = reducedMotion ? Math.floor(ptCounts[seed] * 0.35) : ptCounts[seed];
    const accumulate = accums[seed];
    let particles = [];

    function init() {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width, y: Math.random() * height,
          speed: 0.3 + Math.random() * 0.7,
          size: 0.5 + Math.random() * 1.0,
          life: Math.random(), decay: 0.002 + Math.random() * 0.003,
          phase: Math.random() * Math.PI * 2,
          settled: false,
        });
      }
    }
    init();

    function draw(time) {
      ctx.fillStyle = 'rgba(240, 238, 230, 0.07)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#2f2f2f';
      const t = time * 0.001;
      for (const p of particles) {
        if (!p.settled) {
          const wx = Math.sin(t * 0.4 + p.phase) * wind;
          p.x += fdx * p.speed + wx;
          p.y += fdy * p.speed;
          p.life -= p.decay;
          if (accumulate && (p.y > height * 0.95 || p.y < height * 0.05)) { p.settled = true; }
        }
        if (p.life <= 0 || p.x < -5 || p.x > width + 5) {
          p.x = fdx < 0 ? width + 3 : fdx > 0 ? -3 : Math.random() * width;
          p.y = fdy < 0 ? height + 3 : fdy > 0 ? -3 : Math.random() * height;
          p.life = 0.7 + Math.random() * 0.3;
          p.settled = false;
        }
        ctx.globalAlpha = p.life * 0.45;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); init(); }
    return { draw, resize };
  }

  // 23. FlameV — rising particle column, seed varies width/turbulence/count/position
  function createFlameV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const flameWidths = [0.06, 0.12, 0.04, 0.18];
    const turbulences = [0.8, 1.4, 0.4, 2.0];
    const ptCounts = [600, 400, 800, 300];
    const posXs = [0.5, 0.3, 0.7, 0.5];
    const fw = flameWidths[seed];
    const turb = turbulences[seed];
    const count = reducedMotion ? Math.floor(ptCounts[seed] * 0.35) : ptCounts[seed];
    const posX = posXs[seed];
    let particles = [];

    function init() {
      particles = [];
      for (let i = 0; i < count; i++) {
        const baseX = width * posX;
        particles.push({
          x: baseX + (Math.random() - 0.5) * width * fw,
          y: height * 0.85 + Math.random() * height * 0.1,
          vy: -(0.5 + Math.random() * 1.2),
          life: Math.random(),
          decay: 0.006 + Math.random() * 0.008,
          phase: Math.random() * Math.PI * 2,
          size: 0.8 + Math.random() * 1.2,
          baseX,
        });
      }
    }
    init();

    function draw(time) {
      ctx.fillStyle = 'rgba(240, 238, 230, 0.07)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#2f2f2f';
      const t = time * 0.002;
      for (const p of particles) {
        p.x += Math.sin(t * turb + p.phase) * 0.4 * turb;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0 || p.y < -10) {
          p.x = p.baseX + (Math.random() - 0.5) * width * fw;
          p.y = height * 0.85 + Math.random() * height * 0.1;
          p.life = 0.6 + Math.random() * 0.4;
        }
        ctx.globalAlpha = p.life * 0.4;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); init(); }
    return { draw, resize };
  }

  // 24. FractureV — radiating crack lines, seed varies count/branch prob/length/origin
  function createFractureV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const crackCounts = [5, 7, 4, 8];
    const branchProbs = [0.25, 0.4, 0.1, 0.55];
    const maxLengths = [0.35, 0.28, 0.42, 0.22];
    const origins = [[0.5, 0.5], [0.3, 0.6], [0.7, 0.3], [0.5, 0.4]];
    const cc = crackCounts[seed];
    const bp = branchProbs[seed];
    const ml = maxLengths[seed];
    const [ox, oy] = origins[seed];
    let lines = [], rotOffset = 0;

    function buildCracks() {
      lines = [];
      const cx = width * ox, cy = height * oy;
      const maxLen = Math.min(width, height) * ml;
      for (let i = 0; i < cc; i++) {
        const baseAngle = (i / cc) * Math.PI * 2 + Math.random() * 0.4;
        let lx = cx, ly = cy, angle = baseAngle, remaining = maxLen;
        while (remaining > 5) {
          const segLen = 8 + Math.random() * 20;
          const ex = lx + Math.cos(angle) * Math.min(segLen, remaining);
          const ey = ly + Math.sin(angle) * Math.min(segLen, remaining);
          lines.push({ x1: lx, y1: ly, x2: ex, y2: ey });
          if (Math.random() < bp && remaining > maxLen * 0.3) {
            let bx = ex, by = ey, bangle = angle + (Math.random() - 0.5) * 1.2;
            let brem = remaining * 0.5;
            while (brem > 5) {
              const bl = 6 + Math.random() * 14;
              const bex = bx + Math.cos(bangle) * Math.min(bl, brem);
              const bey = by + Math.sin(bangle) * Math.min(bl, brem);
              lines.push({ x1: bx, y1: by, x2: bex, y2: bey });
              bangle += (Math.random() - 0.5) * 0.3;
              bx = bex; by = bey; brem -= bl;
            }
          }
          angle += (Math.random() - 0.5) * 0.25;
          lx = ex; ly = ey; remaining -= segLen;
        }
      }
    }
    buildCracks();

    function draw(time) {
      const t = time * 0.0003;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.14)';
      ctx.fillRect(0, 0, width, height);
      rotOffset = Math.sin(t) * 0.004;
      ctx.lineWidth = 0.8;
      const totalLines = lines.length;
      for (let i = 0; i < totalLines; i++) {
        const l = lines[i];
        const progress = i / totalLines;
        ctx.strokeStyle = `rgba(52, 52, 52, ${0.08 + (1 - progress) * 0.18})`;
        ctx.beginPath();
        const cos = Math.cos(rotOffset), sin = Math.sin(rotOffset);
        const cx = width * ox, cy = height * oy;
        const rx1 = cx + (l.x1 - cx) * cos - (l.y1 - cy) * sin;
        const ry1 = cy + (l.x1 - cx) * sin + (l.y1 - cy) * cos;
        const rx2 = cx + (l.x2 - cx) * cos - (l.y2 - cy) * sin;
        const ry2 = cy + (l.x2 - cx) * sin + (l.y2 - cy) * cos;
        ctx.moveTo(rx1, ry1); ctx.lineTo(rx2, ry2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(width * ox, height * oy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.85)';
      ctx.fill();
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); buildCracks(); }
    return { draw, resize };
  }

  // 25. MoireV — overlapping pattern interference, seed varies pattern/rotation/spacing/overlay
  function createMoireV(canvas, seed) {
    let { ctx, width, height } = fitCanvas(canvas);
    const patternTypes = ['lines', 'circles', 'lines', 'dots'];
    const rotSpeeds = [0.0003, 0.0002, 0.0005, 0.0001];
    const spacings = [14, 20, 10, 18];
    const overlayCounts = [2, 2, 3, 2];
    const pt = patternTypes[seed];
    const rs = rotSpeeds[seed];
    const sp = spacings[seed];
    const oc = overlayCounts[seed];

    function draw(time) {
      const t = time * rs;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.18)';
      ctx.fillRect(0, 0, width, height);
      const cx = width * 0.5, cy = height * 0.5;
      for (let layer = 0; layer < oc; layer++) {
        const rot = t * (layer % 2 === 0 ? 1 : -1) + layer * (Math.PI / oc);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.translate(-cx, -cy);
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = `rgba(52, 52, 52, ${0.07 + layer * 0.03})`;
        if (pt === 'lines') {
          const count2 = Math.ceil(Math.max(width, height) / sp) + 2;
          for (let i = -count2; i <= count2; i++) {
            const x = cx + i * sp;
            ctx.beginPath();
            ctx.moveTo(x, -height); ctx.lineTo(x, height * 2);
            ctx.stroke();
          }
        } else if (pt === 'circles') {
          const maxR = Math.hypot(width, height);
          for (let r = sp; r < maxR; r += sp) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else {
          const cols = Math.ceil(width / sp) + 2;
          const rows = Math.ceil(height / sp) + 2;
          ctx.fillStyle = 'rgba(52, 52, 52, 0.12)';
          for (let r = -1; r <= rows; r++) {
            for (let c = -1; c <= cols; c++) {
              ctx.beginPath();
              ctx.arc(c * sp, r * sp, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.restore();
      }
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // ─────────────────────────────────────────────
  // REGISTRATION SYSTEM
  // ─────────────────────────────────────────────

  const allSystems = [];
  const canvasToSystem = new Map();

  function registerCanvas(canvasId, createFn) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const system = createFn(canvas);
    system.visible = false;
    system.canvas = canvas;
    allSystems.push(system);
    canvasToSystem.set(canvas, system);
  }

  function registerCanvasWithSeed(canvasId, createFn, seed) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const system = createFn(canvas, seed);
    system.visible = false;
    system.canvas = canvas;
    allSystems.push(system);
    canvasToSystem.set(canvas, system);
  }

  // Pages 1-10: specific named animations
  registerCanvas('art-bloom', createOnePurposeBloom);
  registerCanvas('art-torus', createTorusKnowledge);
  registerCanvas('art-citadel', createInnerCitadel);
  registerCanvas('art-erosion', createErosion);
  registerCanvas('art-reset', createReset);
  registerCanvas('art-dawn', createDawn);
  registerCanvas('art-truth', createTruth);
  registerCanvas('art-dye', createDye);
  registerCanvas('art-still', createStillPoint);
  registerCanvas('art-hive', createHive);

  // Pages 11-81: explicit (canvasId, factory, seed) mapping
  const pageMap = [
    ['art-11', createSpiralV, 0],
    ['art-12', createLatticeV, 0],
    ['art-13', createConstellationV, 0],
    ['art-14', createCurtainV, 0],
    ['art-15', createTerrainV, 0],
    ['art-16', createWeaveV, 0],
    ['art-17', createSandV, 0],
    ['art-18', createFlameV, 0],
    ['art-19', createFractureV, 0],
    ['art-20', createMoireV, 0],
    ['art-21', createVortexV, 1],
    ['art-22', createTorusV, 1],
    ['art-23', createRingsV, 1],
    ['art-24', createDriftV, 1],
    ['art-25', createPendulumV, 1],
    ['art-26', createRaysV, 1],
    ['art-27', createGeometricV, 1],
    ['art-28', createDiffusionV, 1],
    ['art-29', createRippleV, 1],
    ['art-30', createNetworkV, 1],
    ['art-31', createWavesV, 1],
    ['art-32', createFlowV, 1],
    ['art-33', createOrbitV, 1],
    ['art-34', createGridV, 1],
    ['art-35', createBreathV, 1],
    ['art-36', createSpiralV, 1],
    ['art-37', createLatticeV, 1],
    ['art-38', createConstellationV, 1],
    ['art-39', createCurtainV, 1],
    ['art-40', createTerrainV, 1],
    ['art-41', createWeaveV, 1],
    ['art-42', createSandV, 1],
    ['art-43', createFlameV, 1],
    ['art-44', createFractureV, 1],
    ['art-45', createMoireV, 1],
    ['art-46', createVortexV, 2],
    ['art-47', createTorusV, 2],
    ['art-48', createRingsV, 2],
    ['art-49', createDriftV, 2],
    ['art-50', createPendulumV, 2],
    ['art-51', createRaysV, 2],
    ['art-52', createGeometricV, 2],
    ['art-53', createDiffusionV, 2],
    ['art-54', createRippleV, 2],
    ['art-55', createNetworkV, 2],
    ['art-56', createWavesV, 2],
    ['art-57', createFlowV, 2],
    ['art-58', createOrbitV, 2],
    ['art-59', createGridV, 2],
    ['art-60', createBreathV, 2],
    ['art-61', createSpiralV, 2],
    ['art-62', createLatticeV, 2],
    ['art-63', createConstellationV, 2],
    ['art-64', createCurtainV, 2],
    ['art-65', createTerrainV, 2],
    ['art-66', createWeaveV, 2],
    ['art-67', createSandV, 2],
    ['art-68', createFlameV, 2],
    ['art-69', createFractureV, 2],
    ['art-70', createMoireV, 2],
    ['art-71', createVortexV, 3],
    ['art-72', createTorusV, 3],
    ['art-73', createRingsV, 3],
    ['art-74', createDriftV, 3],
    ['art-75', createPendulumV, 3],
    ['art-76', createRaysV, 3],
    ['art-77', createGeometricV, 3],
    ['art-78', createDiffusionV, 3],
    ['art-79', createRippleV, 3],
    ['art-80', createNetworkV, 3],
    ['art-81', createWavesV, 3],
  ];

  pageMap.forEach(([id, fn, seed]) => {
    registerCanvasWithSeed(id, fn, seed);
  });

  // ─────────────────────────────────────────────
  // VISIBILITY + ANIMATION LOOP
  // ─────────────────────────────────────────────

  const visObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const sys = canvasToSystem.get(entry.target);
        if (sys) sys.visible = entry.isIntersecting;
      });
    },
    { rootMargin: '100% 0px 100% 0px' }
  );

  allSystems.forEach((sys) => visObserver.observe(sys.canvas));

  function onResize() {
    allSystems.forEach((sys) => sys.resize());
    updateActiveFromScroll();
  }

  window.addEventListener('resize', onResize);
  onResize();

  const initial = parseHash();
  if (!window.location.hash) {
    window.history.replaceState(null, '', `#${anchors[0]}`);
  }
  updateActiveUI(initial);
  window.setTimeout(() => {
    goTo(initial, false);
  }, 30);

  // Animation loop — only draw visible systems
  let lastFrame = 0;
  const frameInterval = reducedMotion ? 1000 : 1000 / 24;

  function animate(now) {
    if (now - lastFrame >= frameInterval) {
      for (const sys of allSystems) {
        if (sys.visible) sys.draw(now);
      }
      lastFrame = now;
    }
    window.requestAnimationFrame(animate);
  }

  window.requestAnimationFrame(animate);
})();
