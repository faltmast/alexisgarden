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

  // Pages 11+: Waves — horizontal sine waves that shift slowly
  function createWaves(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);
    function draw(time) {
      const t = time * 0.0008;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.14)';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(52, 52, 52, 0.18)';
      ctx.lineWidth = 1;
      for (let w = 0; w < 7; w++) {
        const baseY = height * (0.2 + w * 0.09);
        ctx.beginPath();
        for (let x = 0; x <= width; x += 3) {
          const y = baseY + Math.sin(x * 0.012 + t + w * 0.8) * (12 + w * 4) + Math.sin(x * 0.006 + t * 0.6) * 8;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // Pages 11+: Flow Field — particles following an angle-based flow field
  function createFlowField(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);
    const count = reducedMotion ? 500 : 1500;
    let particles = [];
    function seed() {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({ x: Math.random() * width, y: Math.random() * height, age: Math.random() * 100 });
      }
    }
    seed();
    function draw(time) {
      ctx.fillStyle = 'rgba(240, 238, 230, 0.04)';
      ctx.fillRect(0, 0, width, height);
      const t = time * 0.0003;
      ctx.fillStyle = '#2f2f2f';
      for (const p of particles) {
        const angle = Math.sin(p.x * 0.008 + t) * Math.cos(p.y * 0.006 + t * 0.7) * Math.PI * 2;
        p.x += Math.cos(angle) * 0.8;
        p.y += Math.sin(angle) * 0.8;
        p.age += 1;
        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height || p.age > 200) {
          p.x = Math.random() * width; p.y = Math.random() * height; p.age = 0;
        }
        ctx.globalAlpha = Math.min(0.3, p.age * 0.01);
        ctx.fillRect(p.x, p.y, 0.8, 0.8);
      }
      ctx.globalAlpha = 1;
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); seed(); }
    return { draw, resize };
  }

  // Pages 11+: Orbit — small circles orbiting a center point
  function createOrbit(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);
    const bodies = [];
    for (let i = 0; i < 12; i++) {
      bodies.push({
        radius: 0.12 + i * 0.06,
        speed: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        size: 1.5 + Math.random() * 2,
      });
    }
    function draw(time) {
      const t = time * 0.001;
      const cx = width * 0.5, cy = height * 0.5;
      const scale = Math.min(width, height) * 0.5;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.1)';
      ctx.fillRect(0, 0, width, height);
      // Orbit paths
      ctx.strokeStyle = 'rgba(52, 52, 52, 0.06)';
      ctx.lineWidth = 0.5;
      for (const b of bodies) {
        ctx.beginPath();
        ctx.arc(cx, cy, b.radius * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Bodies
      for (const b of bodies) {
        const angle = t * b.speed + b.phase;
        const x = cx + Math.cos(angle) * b.radius * scale;
        const y = cy + Math.sin(angle) * b.radius * scale;
        ctx.beginPath();
        ctx.arc(x, y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 34, 34, 0.6)';
        ctx.fill();
      }
      // Center
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.85)';
      ctx.fill();
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // Pages 11+: Grid — dots that shift position subtly, creating a breathing pattern
  function createGrid(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);
    function draw(time) {
      const t = time * 0.001;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.18)';
      ctx.fillRect(0, 0, width, height);
      const spacing = 18;
      const cols = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);
      ctx.fillStyle = '#2f2f2f';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = c * spacing + spacing * 0.5;
          const by = r * spacing + spacing * 0.5;
          const dx = Math.sin(t * 0.5 + c * 0.3 + r * 0.2) * 3;
          const dy = Math.cos(t * 0.4 + r * 0.3 + c * 0.15) * 3;
          const dist = Math.hypot(bx - width * 0.5, by - height * 0.5);
          const maxDist = Math.hypot(width * 0.5, height * 0.5);
          ctx.globalAlpha = 0.06 + (1 - dist / maxDist) * 0.22;
          ctx.fillRect(bx + dx, by + dy, 1.2, 1.2);
        }
      }
      ctx.globalAlpha = 1;
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // Pages 11+: Breath — concentric circles that expand and contract rhythmically
  function createBreath(canvas) {
    let { ctx, width, height } = fitCanvas(canvas);
    function draw(time) {
      const t = time * 0.001;
      const cx = width * 0.5, cy = height * 0.5;
      const maxR = Math.min(width, height) * 0.4;
      ctx.fillStyle = 'rgba(240, 238, 230, 0.12)';
      ctx.fillRect(0, 0, width, height);
      const ringCount = 6;
      for (let i = 0; i < ringCount; i++) {
        const breathPhase = Math.sin(t * 0.4 + i * 0.5);
        const r = maxR * ((i + 1) / ringCount) * (0.8 + breathPhase * 0.2);
        ctx.strokeStyle = `rgba(52, 52, 52, ${0.08 + (1 - i / ringCount) * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Center dot
      const coreSize = 2.5 + Math.sin(t * 0.4) * 1;
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 34, 34, 0.8)';
      ctx.fill();
    }
    function resize() { ({ ctx, width, height } = fitCanvas(canvas)); }
    return { draw, resize };
  }

  // Animation types array — 15 total, cycling for pages 11-81
  const animationTypes = [
    createOnePurposeBloom,   // 0
    createTorusKnowledge,    // 1
    createInnerCitadel,      // 2
    createErosion,           // 3
    createReset,             // 4
    createDawn,              // 5
    createTruth,             // 6
    createDye,               // 7
    createStillPoint,        // 8
    createHive,              // 9
    createWaves,             // 10
    createFlowField,         // 11
    createOrbit,             // 12
    createGrid,              // 13
    createBreath,            // 14
  ];

  // Create systems with visibility tracking
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

  // Register pages 1-10 (specific mappings)
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

  // Register pages 11-81 (cycling through types)
  for (let i = 11; i <= 81; i++) {
    const typeIndex = (i - 1) % animationTypes.length;
    registerCanvas('art-' + i, animationTypes[typeIndex]);
  }

  // IntersectionObserver for visibility
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

  // Animation loop - only draw visible systems
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
