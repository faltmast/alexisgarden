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

  function safeCreate(id, createFn) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    return createFn(canvas);
  }

  const systems = [
    safeCreate('art-bloom', createOnePurposeBloom),
    safeCreate('art-torus', createTorusKnowledge),
    safeCreate('art-citadel', createInnerCitadel),
  ].filter(Boolean);

  function onResize() {
    systems.forEach((system) => system.resize());
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

  let lastFrame = 0;
  const frameInterval = reducedMotion ? 1000 : 1000 / 24;

  function animate(now) {
    if (now - lastFrame >= frameInterval) {
      systems.forEach((system) => system.draw(now));
      lastFrame = now;
    }
    window.requestAnimationFrame(animate);
  }

  window.requestAnimationFrame(animate);
})();
