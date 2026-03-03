(function () {
  const sections = Array.from(document.querySelectorAll('.page'));
  const railLinks = Array.from(document.querySelectorAll('.rail-link'));
  const indicator = document.getElementById('pageIndicator');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const anchors = sections.map((s) => String(s.dataset.anchor || '').trim()).filter(Boolean);
  const anchorSet = new Set(anchors);
  const anchorToSection = new Map(anchors.map((a, i) => [a, sections[i]]));
  const anchorToIndex = new Map(anchors.map((a, i) => [a, i + 1]));

  const MAX_PAGE = anchors.length;
  let activeAnchor = anchors[0] || 'cover';
  let activeIndex = 1;

  function normalizeAnchor(raw) {
    const key = String(raw || '').replace(/^#/, '').trim();
    return anchorSet.has(key) ? key : anchors[0];
  }

  function parseHash() {
    return normalizeAnchor(window.location.hash);
  }

  function updateActiveUI(anchor) {
    const n = normalizeAnchor(anchor);
    activeAnchor = n;
    activeIndex = anchorToIndex.get(n) || 1;
    indicator.textContent = `${String(activeIndex).padStart(3, '0')} / ${String(MAX_PAGE).padStart(3, '0')}`;
    railLinks.forEach((link) => {
      link.classList.toggle('active', String(link.dataset.anchor) === n);
    });
  }

  function setHash(anchor) {
    const n = normalizeAnchor(anchor);
    const next = `#${n}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', next);
    }
  }

  function goTo(anchor, smooth) {
    const n = normalizeAnchor(anchor);
    const section = anchorToSection.get(n);
    if (!section) return;
    section.scrollIntoView({
      behavior: smooth && !reducedMotion ? 'smooth' : 'auto',
      block: 'start',
    });
    updateActiveUI(n);
    setHash(n);
  }

  function goRelative(delta) {
    const next = Math.max(1, Math.min(MAX_PAGE, activeIndex + delta));
    goTo(anchors[next - 1], true);
  }

  railLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(link.dataset.anchor, true);
    });
  });

  window.addEventListener('hashchange', () => goTo(parseHash(), false));

  const randomBtn = document.getElementById('randomBtn');
  if (randomBtn) {
    const quoteAnchors = anchors.filter((a) => /^q\d+$/.test(a));
    randomBtn.addEventListener('click', () => {
      const pick = quoteAnchors[Math.floor(Math.random() * quoteAnchors.length)];
      goTo(pick, true);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goRelative(1); }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goRelative(-1); }
  });

  let scrollTicking = false;
  function updateActiveFromScroll() {
    const centerY = window.innerHeight * 0.5;
    let nearestAnchor = activeAnchor;
    let nearestDist = Infinity;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      const dist = Math.abs(rect.top + rect.height * 0.5 - centerY);
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

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      updateActiveFromScroll();
      scrollTicking = false;
    });
  }, { passive: true });

  /* ─── Art System ─── */

  const artSystems = [];
  const artCanvases = document.querySelectorAll('canvas[data-art]');
  const registry = window.MEDICI_ART ? window.MEDICI_ART.ART_REGISTRY : {};

  artCanvases.forEach((canvas) => {
    const raw = canvas.dataset.art;
    const id = /^\d+$/.test(raw) ? parseInt(raw, 10) : raw;
    const factory = registry[id];
    if (factory) {
      artSystems.push({ canvas, system: factory(canvas) });
    }
  });

  function onResize() {
    artSystems.forEach(({ system }) => system.resize());
    updateActiveFromScroll();
  }

  window.addEventListener('resize', onResize);
  onResize();

  const initial = parseHash();
  if (!window.location.hash) {
    window.history.replaceState(null, '', `#${anchors[0]}`);
  }
  updateActiveUI(initial);
  setTimeout(() => goTo(initial, false), 30);

  /* ─── Animation Loop ─── */

  let lastFrame = 0;
  const frameInterval = reducedMotion ? 1000 : 1000 / 30;

  function animate(now) {
    if (now - lastFrame >= frameInterval) {
      // Only animate visible canvases for performance
      for (const { canvas, system } of artSystems) {
        const rect = canvas.getBoundingClientRect();
        if (rect.bottom > -100 && rect.top < window.innerHeight + 100) {
          system.draw(now);
        }
      }
      lastFrame = now;
    }
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
