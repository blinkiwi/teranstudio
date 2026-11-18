/**
 * No Plan Studio — Stacked project embeds
 * Lays out every project iframe at its real height and applies a
 * gentle layered parallax while the sheets enter the viewport.
 */

(function () {
  'use strict';

  const BASE_WIDTH = 1024;
  const MIN_TRAVEL = 56;
  const MAX_TRAVEL = 130;
  const MIN_OVERLAP = 56;
  const MAX_OVERLAP = 110;
  const SHEET_PAD = 32;

  const sections = Array.from(document.querySelectorAll('.project-embed'));
  if (!sections.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nav = document.querySelector('.studio-nav-header');
  const revealBySection = new Map();

  let viewportH = window.innerHeight || document.documentElement.clientHeight;
  let travel = 0;
  let overlap = 0;
  let layoutRaf = 0;
  let scrollRaf = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const smoothstep = (value, min, max) => {
    const t = clamp((value - min) / (max - min), 0, 1);
    return t * t * (3 - 2 * t);
  };

  /* Optional CMS overrides: the admin panel can pin the parallax
     travel / overlap through CSS variables. 0 means "auto". */
  function sizeOverride(name) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    const value = parseFloat(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function getTravel() {
    if (reduceMotion.matches) return 0;
    const pinned = sizeOverride('--embed-travel');
    if (pinned) return Math.round(pinned);
    return Math.round(clamp(viewportH * 0.11, MIN_TRAVEL, MAX_TRAVEL));
  }

  function getOverlap() {
    if (reduceMotion.matches) return 0;
    const pinned = sizeOverride('--embed-overlap-base');
    if (pinned) return Math.round(pinned);
    return Math.round(clamp(viewportH * 0.1, MIN_OVERLAP, MAX_OVERLAP));
  }

  /* Remove the in-page menu duplicated by the original pages. The
     general studio nav replaces it both on the host page and inside
     every embedded project. */
  function hidePageChrome(doc) {
    if (!doc) return;
    const topLimit = 140;

    doc.querySelectorAll('.fixed-position-container, .fixed-position-container-top').forEach(container => {
      Array.from(container.children).forEach(el => {
        if (!el || el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;

        // Only pixel-positioned widgets belong to the top chrome;
        // percentages (the project name animations) must stay.
        const top = /px$/.test(el.style.top || '') ? parseFloat(el.style.top) : NaN;
        let hide = Number.isFinite(top) && top >= -10 && top <= topLimit;

        if (!hide) {
          const inner = el.querySelector('img, svg, .rmwidget');
          if (inner && /px$/.test(inner.style.top || '')) {
            const innerTop = parseFloat(inner.style.top);
            if (Number.isFinite(innerTop) && innerTop >= -10 && innerTop <= topLimit) {
              hide = true;
            }
          }
        }

        if (hide) el.classList.add('embed-hide-chrome');
      });
    });
  }

  hidePageChrome(document);

  function setFrameHeight(section, height) {
    const frame = section.querySelector('iframe');
    if (!frame) return;
    frame.style.height = height + 'px';
    frame.dataset.renderedHeight = String(height);
  }

  function layout() {
    viewportH = window.innerHeight || document.documentElement.clientHeight;
    travel = getTravel();
    overlap = getOverlap();

    if (sections[0].parentElement) {
      sections[0].parentElement.style.setProperty('--embed-overlap', overlap + 'px');
    }

    sections.forEach((section, index) => {
      const baseHeight = parseFloat(section.dataset.height) || 800;
      const width = section.clientWidth || document.documentElement.clientWidth || BASE_WIDTH;
      // The embedded canvas is scaled to the full sheet width at every
      // viewport size, so its height follows the same ratio (up on
      // desktop, down on phones) instead of being capped at 1024px.
      const scale = Math.max(0.1, width / BASE_WIDTH);
      const height = Math.round(baseHeight * scale);

      section.style.height = (height + travel + overlap + SHEET_PAD) + 'px';
      section.style.zIndex = String(index + 1);
      section.dataset.pageBg = (
        getComputedStyle(section).getPropertyValue('--page-bg') || ''
      ).trim();
      setFrameHeight(section, height);
    });

    update();
  }

  function update() {
    const limit = viewportH + 160;

    updateTransition();

    sections.forEach(section => {
      const frame = section.querySelector('iframe');
      if (!frame) return;

      const rect = section.getBoundingClientRect();
      if (rect.bottom < -160 || rect.top > limit) return;

      if (reduceMotion.matches) {
        frame.style.transform = 'none';
        frame.style.opacity = '1';
        return;
      }

      // 0 when the sheet enters from the bottom, 1 when its top
      // reaches the top of the viewport. The sheet travels the
      // remaining pixels at a slower speed than the page, while it
      // settles from a slightly smaller scale into full size.
      const progress = clamp(1 - rect.top / viewportH, 0, 1);
      const scale = 1.06 - progress * 0.06;
      frame.style.transform =
        'translate3d(0, ' + (progress * travel).toFixed(2) + 'px, 0) scale(' + scale.toFixed(4) + ')';
      frame.style.opacity = (0.72 + progress * 0.28).toFixed(3);

      // The chapter card wipes away from the top as the sheet settles,
      // uncovering the first elements of the project. A soft fade at
      // the very end removes the last strip without a hard cut.
      const reveal = revealBySection.get(section);
      if (reveal) {
        const wipe = clamp((progress - 0.02) / 0.9, 0, 1);
        const fade = clamp((progress - 0.82) / 0.16, 0, 1);
        reveal.style.clipPath = 'inset(' + (wipe * 100).toFixed(2) + '% 0 0 0)';
        reveal.style.opacity = (1 - fade).toFixed(3);
        reveal.style.visibility = fade >= 0.999 ? 'hidden' : 'visible';
        reveal.style.transform = 'translate3d(0, ' + (-progress * 8).toFixed(2) + 'px, 0)';
      }
    });

    updateNavTheme();
  }

  function hideTransition() {
    transitionEl.style.opacity = '0';
    transitionEl.style.visibility = 'hidden';
    transitionTheme = null;
    transitionSection = null;
  }

  /* The next project's full-screen title card. It appears as the next
     sheet approaches, holds while the boundary crosses the viewport,
     and lifts away to uncover the project. Because it is fixed, it
     feels like a real page change instead of a decoration inside the
     iframe. */
  function updateTransition() {
    if (reduceMotion.matches) {
      hideTransition();
      return;
    }

    let next = null;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top > 0) {
        next = sections[i];
        break;
      }
    }

    if (!next) {
      hideTransition();
      return;
    }

    const index = sections.indexOf(next);
    if (index <= 0) {
      // The intro-to-first-project reveal keeps its compact chapter card.
      hideTransition();
      return;
    }

    const p = clamp(1 - next.getBoundingClientRect().top / viewportH, 0, 1);
    if (p <= 0.025 || p >= 0.965) {
      hideTransition();
      return;
    }

    if (transitionSection !== next) {
      const meta = projectMeta(next, index);
      const bg = (next.dataset.pageBg || getComputedStyle(next).getPropertyValue('--page-bg') || '#f2eddf').trim();
      const dark = luminance(bg) < 0.22;

      transitionIndex.textContent = meta.index;
      transitionTitle.textContent = meta.name;
      transitionCount.textContent = meta.index + ' / ' + meta.total;
      transitionEl.style.setProperty('--transition-bg', bg || '#f2eddf');
      transitionEl.style.setProperty('--transition-ink', dark ? '#f2eddf' : '#111111');
      transitionColors = {
        ink: dark ? '#f2eddf' : '#111111',
        contrast: dark ? '#111111' : '#f2eddf'
      };
      transitionSection = next;
    }

    const enter = smoothstep(p, 0.05, 0.24);
    const exit = smoothstep(p, 0.62, 0.94);
    const opacity = enter * (1 - exit * 0.18);
    const shift = -exit * 102;
    const scale = 1 - exit * 0.025;

    transitionEl.style.opacity = opacity.toFixed(3);
    transitionEl.style.transform =
      'translate3d(0, ' + shift.toFixed(2) + '%, 0) scale(' + scale.toFixed(3) + ')';
    transitionEl.style.visibility =
      opacity <= 0.005 || exit >= 0.999 ? 'hidden' : 'visible';
    transitionEl.style.setProperty('--transition-progress', p.toFixed(4));

    // Keep the menu legible while the card still covers its line.
    transitionTheme = opacity > 0.18 && exit < 0.9 ? transitionColors : null;
  }

  /* The general menu stays transparent, so its ink adapts to the
     sheet currently passing underneath it. */
  function parseHex(color) {
    const value = String(color || '').trim().replace('#', '');
    if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(value)) return null;

    const hex = value.length === 3
      ? value.split('').map(c => c + c).join('')
      : value;

    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }

  function luminance(color) {
    const rgb = parseHex(color);
    if (!rgb) return 1;

    const channels = [rgb.r, rgb.g, rgb.b].map(channel => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function updateNavTheme() {
    if (!nav) return;

    if (transitionTheme) {
      nav.style.setProperty('--nav-ink', transitionTheme.ink);
      nav.style.setProperty('--nav-contrast', transitionTheme.contrast);
      return;
    }

    const line = 29;
    let bg = '#f2eddf';

    // Later sheets paint on top of earlier ones.
    for (let i = sections.length - 1; i >= 0; i--) {
      const rect = sections[i].getBoundingClientRect();
      if (rect.top > line || rect.bottom < line) continue;

      bg = sections[i].dataset.pageBg || bg;
      break;
    }

    const dark = luminance(bg) < 0.22;
    const ink = dark ? '#f2eddf' : '#111111';
    const contrast = dark ? '#111111' : '#f2eddf';

    nav.style.setProperty('--nav-ink', ink);
    nav.style.setProperty('--nav-contrast', contrast);
  }

  function requestUpdate() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      update();
    });
  }

  function requestLayout() {
    if (layoutRaf) return;
    layoutRaf = requestAnimationFrame(() => {
      layoutRaf = 0;
      layout();
    });
  }

  function projectMeta(section, index) {
    const frame = section.querySelector('iframe');
    const label = frame ? frame.getAttribute('title') || '' : '';
    const name = label.split('—')[0].trim() || (section.dataset.page || '').replace(/\.html$/, '');
    return {
      name,
      index: String(index + 1).padStart(2, '0'),
      total: String(sections.length).padStart(2, '0')
    };
  }

  /* The first sheet keeps a compact chapter card; every later
     project-to-project boundary uses the full-screen transition. */
  function buildReveals() {
    sections.forEach((section, index) => {
      if (index > 0) return;

      const meta = projectMeta(section, index);
      const frame = section.querySelector('iframe');
      const bg = getComputedStyle(section).getPropertyValue('--page-bg').trim() || '#f2eddf';
      const dark = luminance(bg) < 0.22;

      const reveal = document.createElement('div');
      reveal.className = 'project-embed-reveal';
      reveal.setAttribute('aria-hidden', 'true');
      reveal.style.setProperty('--reveal-ink', dark ? '#f2eddf' : '#111111');
      reveal.style.setProperty('--reveal-line', dark ? 'rgba(242,237,223,0.24)' : 'rgba(17,17,17,0.16)');

      const kicker = document.createElement('span');
      kicker.className = 'project-embed-reveal-meta';
      kicker.textContent = `Proyecto ${meta.index} / ${meta.total}`;

      const title = document.createElement('strong');
      title.className = 'project-embed-reveal-title';
      title.textContent = meta.name;

      reveal.appendChild(kicker);
      reveal.appendChild(title);
      section.insertBefore(reveal, frame || section.firstChild);
      revealBySection.set(section, reveal);
    });
  }

  buildReveals();

  /* Full-screen chapter transition for project-to-project boundaries.
     It is fixed above the sheets but below the general menu, and is
     driven entirely by scroll progress so the reader never loses the
     scrollbar or native scrolling. */
  const transitionEl = document.createElement('div');
  transitionEl.className = 'project-transition';
  transitionEl.setAttribute('aria-hidden', 'true');
  transitionEl.innerHTML = [
    '<span class="project-transition-index" aria-hidden="true">02</span>',
    '<div class="project-transition-copy">',
    '  <span class="project-transition-kicker">Siguiente proyecto</span>',
    '  <strong class="project-transition-title">Motorkat</strong>',
    '</div>',
    '<div class="project-transition-foot">',
    '  <span class="project-transition-count">02 / 10</span>',
    '  <span class="project-transition-hint">Desplázate para entrar <span aria-hidden="true">&darr;</span></span>',
    '</div>',
    '<span class="project-transition-progress" aria-hidden="true"></span>'
  ].join('');
  document.body.appendChild(transitionEl);

  const transitionIndex = transitionEl.querySelector('.project-transition-index');
  const transitionTitle = transitionEl.querySelector('.project-transition-title');
  const transitionCount = transitionEl.querySelector('.project-transition-count');
  let transitionSection = null;
  let transitionColors = null;
  let transitionTheme = null;

  // Size the sheets before observing them so the lazy loader sees
  // their final positions, not the collapsed placeholders.
  layout();

  /* Only mount a page when the reader is close to it. Heights are
     known up front, so the scroll never jumps while loading. */
  function loadFrame(section) {
    const frame = section.querySelector('iframe');
    if (!frame || frame.dataset.loaded === 'true') return;

    const src = frame.getAttribute('data-src');
    if (!src) return;

    frame.dataset.loaded = 'true';
    frame.src = src;
  }

  if ('IntersectionObserver' in window) {
    const frameLoader = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        loadFrame(entry.target);
        frameLoader.unobserve(entry.target);
      });
    }, { rootMargin: '200% 0px 200% 0px' });

    sections.forEach(section => frameLoader.observe(section));
  } else {
    sections.forEach(loadFrame);
  }

  /* Once an embedded page has fully loaded, trust its real height
     if the calculated one was short (fonts / images). */
  sections.forEach(section => {
    const frame = section.querySelector('iframe');
    if (!frame) return;

    frame.addEventListener('load', () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) return;

        hidePageChrome(doc);

        const actual = Math.max(
          doc.documentElement ? doc.documentElement.scrollHeight : 0,
          doc.body ? doc.body.scrollHeight : 0
        );
        const current = parseFloat(frame.dataset.renderedHeight) || 0;

        if (actual > 0 && actual > current + 8) {
          setFrameHeight(section, actual);
          section.style.height = (actual + travel + overlap + SHEET_PAD) + 'px';
          update();
        }
      } catch (error) {
        // Same-origin pages only; ignore if access is blocked.
      }
    });
  });

  /* Links inside an embedded page should drive the top-level page:
     embedded projects scroll into place, the rest navigate away. */
  function pageKey(href) {
    return href.split('#')[0].split('?')[0].replace(/^\.?\//, '');
  }

  function handleEmbeddedLink(href) {
    if (!href) return;

    if (/^mailto:|^tel:/i.test(href)) {
      window.location.href = href;
      return;
    }

    if (/^(https?:)?\/\//i.test(href)) {
      window.open(href, '_blank', 'noopener');
      return;
    }

    const key = pageKey(href);

    if (key === '' || key === 'index.html') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = sections.find(section => pageKey(section.dataset.page || '') === key);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    window.location.href = href;
  }

  window.addEventListener('message', event => {
    const data = event.data;
    if (!data || data.type !== 'noplan:embed-navigate') return;

    const fromEmbed = sections.some(section => {
      const frame = section.querySelector('iframe');
      return frame && frame.contentWindow === event.source;
    });
    if (!fromEmbed) return;

    handleEmbeddedLink(String(data.href || ''));
  });

  window.addEventListener('scroll', () => {
    // The menu colour should flip immediately, even if the parallax
    // frame is throttled during a fast scroll. The transition state
    // also needs to be current before the nav ink is resolved.
    updateTransition();
    updateNavTheme();
    requestUpdate();
  }, { passive: true });
  window.addEventListener('resize', requestLayout);
  window.addEventListener('load', requestLayout);

  /* The host page draws its own custom cursor, which cannot follow
     the pointer once it enters an iframe. Hide it there and let the
     embedded document use the native pointer. */
  sections.forEach(section => {
    section.addEventListener('mouseenter', () => {
      document.documentElement.classList.add('embed-hover');
    });
    section.addEventListener('mouseleave', () => {
      document.documentElement.classList.remove('embed-hover');
    });
  });

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', layout);
  }

  // studio.js inside each frame scales its article just after load.
  window.setTimeout(layout, 400);
})();
