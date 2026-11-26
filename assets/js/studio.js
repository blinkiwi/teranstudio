/**
 * Terán Studio Clone — Animation Engine v2
 * Single rAF game-loop, LERP smoothing, scroll-driven stamp rotation,
 * scroll-linked marquee, parallax layers, fade reveals, page transitions,
 * magnetic cursor, mobile nav, scroll progress bar, lazy images.
 */

(function () {
  'use strict';

  // ============================================================
  // UTILS
  // ============================================================
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const qs = (sel, ctx) => (ctx || document).querySelector(sel);
  const qsa = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /** Embedded inside the stacked project showcase on index.html */
  const IS_EMBED = new URLSearchParams(window.location.search).has('embed');

  /** Returns true if user prefers reduced motion */
  const reducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================================
  // STATE — shared by the main animation loop
  // ============================================================
  const state = {
    // Scroll
    scrollY:       0,     // raw scroll position
    scrollYSmooth: 0,     // lerped scroll (for smooth-driven effects)
    scrollVel:     0,     // scroll velocity
    lastScrollY:   0,

    // Mouse
    mouseX: window.innerWidth  / 2,
    mouseY: window.innerHeight / 2,
    cursorX:  window.innerWidth  / 2,
    cursorY:  window.innerHeight / 2,
    dotX:     window.innerWidth  / 2,
    dotY:     window.innerHeight / 2,
    isHovering:  false,
    isClicking:  false,

    // Page
    pageH: 1,
    tick:  0,
  };

  // ============================================================
  // 1. SCROLL PROGRESS BAR
  // ============================================================
  let progressBar;
  function initProgressBar() {
    progressBar = document.createElement('div');
    progressBar.className = 'studio-progress-bar';
    document.body.prepend(progressBar);
  }

  function updateProgressBar() {
    if (!progressBar) return;
    const pct = state.pageH > 0
      ? clamp((state.scrollY / state.pageH) * 100, 0, 100)
      : 0;
    progressBar.style.width = pct + '%';
  }

  // ============================================================
  // 2. HEADER — becomes solid on scroll
  // ============================================================
  let navHeader;
  function initHeader() {
    navHeader = qs('.studio-nav-header');
  }

  function updateHeader() {
    if (!navHeader) return;
    if (state.scrollY > 30) {
      navHeader.classList.add('scrolled');
    } else {
      navHeader.classList.remove('scrolled');
    }
  }

  // ============================================================
  // 3. SCROLL-DRIVEN STAMP ROTATION (rAF-smooth)
  // ============================================================
  const STAMP_CFG = {
    '65eb824cda7f23003dcb2994': -1,
    '65eb824cda7f23003dcb2995':  1,
    '65eb824cda7f23003dcb29b8': -1,
    '65eb824cda7f23003dcb29b9':  1,
  };
  const MAX_DEG = 9000;

  const stampEls = {};
  let stampSmooth = {}; // per-stamp smooth deg value

  function initStamps() {
    Object.keys(STAMP_CFG).forEach(id => {
      const el = qs(`[data-id="${id}"]`);
      if (el) {
        stampEls[id] = el;
        stampSmooth[id] = 0;
        el.style.willChange = 'transform';
        el.style.transformOrigin = 'center center';
      }
    });
  }

  function updateStamps() {
    const ids = Object.keys(stampEls);
    if (!ids.length) return;

    const progress = state.pageH > 0
      ? clamp(state.scrollY / state.pageH, 0, 1)
      : 0;

    ids.forEach(id => {
      const targetDeg = progress * MAX_DEG * STAMP_CFG[id];
      // Smooth lerp towards target
      stampSmooth[id] = lerp(stampSmooth[id], targetDeg, 0.09);
      stampEls[id].style.transform = `rotate(${stampSmooth[id].toFixed(2)}deg)`;
    });
  }

  // ============================================================
  // 4. MARQUEE RIBBON — scroll-linked translateX
  // ============================================================
  const MARQUEE_IDS = ['65eb824cda7f23003dcb2a6e'];
  const marqueeEls = [];
  let marqueeReady = false;

  function initMarquee() {
    MARQUEE_IDS.forEach(id => {
      const el = qs(`[data-id="${id}"]`);
      if (!el) return;

      // Duplicate content for seamless loop
      const original = el.innerHTML;
      el.innerHTML = `<span class="marquee-inner">${original}&nbsp;&nbsp;&nbsp;${original}&nbsp;&nbsp;&nbsp;</span>`;
      el.style.overflow    = 'hidden';
      el.style.whiteSpace  = 'nowrap';

      const inner = el.querySelector('.marquee-inner');
      if (!inner) return;
      inner.style.display    = 'inline-block';
      inner.style.willChange = 'transform';

      marqueeEls.push({ el, inner, halfW: 0 });
    });
    marqueeReady = true;
  }

  let marqueeSmoothX = 0;

  function updateMarquee() {
    if (!marqueeReady || !marqueeEls.length) return;

    marqueeEls.forEach(m => {
      if (!m.halfW) {
        m.halfW = m.inner.scrollWidth / 2;
      }
      const halfW = m.halfW || 1;
      // Scroll-linked + auto drift
      const targetX = -(state.scrollY * 0.35) % halfW;
      marqueeSmoothX = lerp(marqueeSmoothX, targetX, 0.06);
      m.inner.style.transform = `translateX(${marqueeSmoothX.toFixed(2)}px)`;
    });
  }

  // ============================================================
  // 5. MULTI-LAYER PARALLAX
  // ============================================================
  const parallaxSlots = []; // { el, speed, baseY }

  function initParallax() {
    if (reducedMotion()) return;

    // Background images — slow (0.15x)
    qsa('.page-fixed-bg-container .widget-picture img, .page-fixed-bg-container img').forEach(img => {
      img.style.willChange = 'transform';
      img.style.transformOrigin = 'center top';
      parallaxSlots.push({ el: img, speed: 0.18 });
    });

    // Widget backgrounds — very slow (0.08x)
    qsa('.widget-background').forEach(el => {
      el.style.willChange = 'transform';
      parallaxSlots.push({ el, speed: 0.08 });
    });
  }

  function updateParallax() {
    if (!parallaxSlots.length) return;
    const sy = state.scrollYSmooth;
    parallaxSlots.forEach(({ el, speed }) => {
      el.style.transform = `translateY(${(sy * speed).toFixed(2)}px)`;
    });
  }

  // ============================================================
  // 6. FADE-REVEAL on scroll (IntersectionObserver)
  // ============================================================
  function initRevealObserver() {
    if (reducedMotion()) {
      // Just show everything immediately
      qsa('.reveal-on-scroll').forEach(el => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -50px 0px' });

    // Target: widget-picture and widget-text-v3 elements NOT in fixed containers
    // and NOT already the scroll-rotation stamps
    const stampIdSet = new Set(Object.keys(STAMP_CFG));
    const skipZones = new Set(
      qsa('.fixed-position-container .rmwidget, .page-fixed-bg-container .rmwidget')
    );

    let siblingCount = {};

    qsa('.widget-picture, .widget-text-v3, .widget-shape').forEach((el, i) => {
      const id = el.dataset && el.dataset.id;
      if (id && stampIdSet.has(id)) return;
      if (skipZones.has(el)) return;

      // Skip elements near top of page (above 70% of first viewport)
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.7) return;

      el.classList.add('reveal-on-scroll');

      // Stagger siblings within same parent
      const parentKey = el.parentElement ? el.parentElement.dataset.id || i : i;
      siblingCount[parentKey] = (siblingCount[parentKey] || 0) + 1;
      const delay = Math.min(siblingCount[parentKey], 5);
      if (delay > 1) el.dataset.delay = delay;

      observer.observe(el);
    });
  }

  // ============================================================
  // 7. HOVER SPIN on animation-container (original behavior)
  // ============================================================
  function initHoverSpins() {
    qsa('.animation-container').forEach(container => {
      const styleTag = qs('style', container);
      if (!styleTag) return;

      const match = styleTag.textContent.match(/@keyframes\s+([a-zA-Z0-9_-]+)/);
      if (!match) return;

      const animName = match[1];
      let spinning = false;

      container.addEventListener('mouseenter', () => {
        if (spinning) return;
        spinning = true;
        container.style.animation = 'none';
        void container.offsetWidth; // reflow
        container.style.animation = `${animName} 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards`;
        setTimeout(() => { spinning = false; }, 1500);
      });

      container.addEventListener('mouseleave', () => {
        // Keep spin going to end, don't interrupt
      });
    });
  }

  // ============================================================
  // 8. LAZY IMAGE LOADING (blur-up)
  // ============================================================
  function initLazyImages() {
    if (!('IntersectionObserver' in window)) return;

    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        // If srcset already pointing to local asset it's already loaded
        img.classList.add('loaded');
        imgObserver.unobserve(img);
      });
    }, { rootMargin: '200px 0px' });

    qsa('img').forEach(img => {
      img.classList.add('lazy');
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
        imgObserver.observe(img);
      }
    });
  }

  // ============================================================
  // 9. CUSTOM DUAL CURSOR (ring + dot, smooth lerp)
  // ============================================================
  let cursorRing, cursorDot;

  function initCursor() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    cursorRing = qs('.custom-studio-cursor');
    cursorDot  = document.createElement('div');
    cursorDot.className = 'custom-studio-cursor-dot';
    document.body.appendChild(cursorDot);

    document.addEventListener('mousemove', e => {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
    });

    document.addEventListener('mousedown', () => {
      state.isClicking = true;
      if (cursorRing) cursorRing.classList.add('clicking');
    });
    document.addEventListener('mouseup', () => {
      state.isClicking = false;
      if (cursorRing) cursorRing.classList.remove('clicking');
    });

    // Hover detection
    const hoverEls = qsa('a, button, .animation-container, [data-id], input, textarea, label');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => {
        state.isHovering = true;
        if (cursorRing) cursorRing.classList.add('hovering');
      });
      el.addEventListener('mouseleave', () => {
        state.isHovering = false;
        if (cursorRing) cursorRing.classList.remove('hovering');
      });
    });
  }

  function updateCursor() {
    if (!cursorRing && !cursorDot) return;

    // Ring follows with medium lag
    state.cursorX = lerp(state.cursorX, state.mouseX, 0.14);
    state.cursorY = lerp(state.cursorY, state.mouseY, 0.14);

    // Dot follows tightly
    state.dotX = lerp(state.dotX, state.mouseX, 0.65);
    state.dotY = lerp(state.dotY, state.mouseY, 0.65);

    if (cursorRing) {
      const size = state.isHovering ? 48 : state.isClicking ? 12 : 18;
      cursorRing.style.left = `${state.cursorX.toFixed(2)}px`;
      cursorRing.style.top  = `${state.cursorY.toFixed(2)}px`;
      cursorRing.style.transform = `translate(-50%, -50%)`;
      cursorRing.style.width  = `${size}px`;
      cursorRing.style.height = `${size}px`;
    }

    if (cursorDot) {
      cursorDot.style.left = `${state.dotX.toFixed(2)}px`;
      cursorDot.style.top  = `${state.dotY.toFixed(2)}px`;
      cursorDot.style.transform = `translate(-50%, -50%)`;
    }
  }

  // ============================================================
  // 10. BACK-TO-TOP BUTTON
  // ============================================================
  function initBackToTop() {
    const btn = qs('.back-to-top-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function updateBackToTop() {
    const btn = qs('.back-to-top-btn');
    if (!btn) return;
    btn.classList.toggle('visible', state.scrollY > 500);
  }

  // ============================================================
  // 11. PAGER hide near footer
  // ============================================================
  function updatePager() {
    const pager = qs('.studio-pager');
    if (!pager) return;
    const nearBottom = (state.scrollY + window.innerHeight) > (state.pageH + window.innerHeight - 120);
    pager.classList.toggle('hidden', nearBottom);
  }

  // ============================================================
  // 12. PROJECTS DRAWER
  // ============================================================
  function initDrawer() {
    const toggleBtns = qsa('.projects-toggle, [data-action="toggle-projects"]');
    const drawer     = qs('#projects-drawer');
    const closeBtn   = qs('.projects-drawer-close');

    function open()  {
      if (!drawer) return;
      drawer.classList.add('open');
      toggleBtns.forEach(b => b.classList.add('open'));
    }
    function close() {
      if (!drawer) return;
      drawer.classList.remove('open');
      toggleBtns.forEach(b => b.classList.remove('open'));
    }
    function toggle(e) {
      if (e) e.preventDefault();
      drawer && drawer.classList.contains('open') ? close() : open();
    }

    toggleBtns.forEach(b => b.addEventListener('click', toggle));
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('click', e => {
      if (!drawer || !drawer.classList.contains('open')) return;
      if (!drawer.contains(e.target) && !e.target.closest('.projects-toggle')) close();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });

    // In-page original widget bindings
    const logoW  = qs('[data-id="65eb824cda7f23003dcb29bb"]');
    const menuW  = qs('[data-id="65eb824cda7f23003dcb29b7"]');
    const projW  = qs('[data-id="65eb824cda7f23003dcb29ba"]');

    if (logoW) {
      logoW.style.cursor = 'pointer';
      logoW.addEventListener('click', () => window.location.href = 'index.html');
    }
    if (menuW) {
      menuW.style.cursor = 'pointer';
      menuW.addEventListener('click', toggle);
    }
    if (projW) {
      projW.style.cursor = 'pointer';
      projW.addEventListener('click', toggle);
    }
  }

  // ============================================================
  // 13. MOBILE NAVIGATION
  // ============================================================
  function initMobileNav() {
    // Build the toggle when the markup does not provide one.
    let toggleBtn = qs('.studio-nav-mobile-toggle');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'studio-nav-mobile-toggle';
      toggleBtn.setAttribute('aria-label', 'Abrir menú');
      toggleBtn.innerHTML = '<span></span><span></span><span></span>';
      (navHeader || document.body).appendChild(toggleBtn);
    }

    // Build overlay
    const overlay = document.createElement('nav');
    overlay.className = 'studio-mobile-nav';
    overlay.innerHTML = `
      <a href="index.html">Projects</a>
      <a href="about.html">About</a>
      <a href="https://www.noplan.press/" target="_blank" rel="noopener">Shop</a>
      <a href="contact.html">Contact</a>
    `;
    document.body.appendChild(overlay);

    function openMobileNav() {
      overlay.classList.add('open');
      toggleBtn.classList.add('open');
      if (navHeader) navHeader.classList.add('mobile-open');
      document.body.style.overflow = 'hidden';
    }
    function closeMobileNav() {
      overlay.classList.remove('open');
      toggleBtn.classList.remove('open');
      if (navHeader) navHeader.classList.remove('mobile-open');
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', () => {
      overlay.classList.contains('open') ? closeMobileNav() : openMobileNav();
    });

    overlay.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  // ============================================================
  // 14. PAGE TRANSITIONS (wipe in/out)
  // ============================================================
  function initPageTransitions() {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);

    // Entrance: wipe out upward on load
    overlay.classList.add('entering');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('leaving');
        setTimeout(() => {
          overlay.classList.remove('entering', 'leaving');
        }, 600);
      });
    });

    // Exit: wipe down on internal link click
    qsa('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || href.startsWith('tel')) return;

      a.addEventListener('click', e => {
        e.preventDefault();
        const dest = href;
        overlay.style.transition = 'clip-path 0.4s cubic-bezier(0.65, 0, 0.35, 1)';
        overlay.classList.add('entering');
        setTimeout(() => {
          window.location.href = dest;
        }, 420);
      });
    });
  }

  // ============================================================
  // 15. SCROLL VELOCITY + STATE UPDATE
  // ============================================================
  function updateScrollState() {
    state.scrollY  = window.scrollY;
    state.pageH    = document.documentElement.scrollHeight - window.innerHeight;
    state.scrollVel = state.scrollY - state.lastScrollY;
    state.lastScrollY = state.scrollY;

    // Smooth scroll position (lerp) — used for parallax
    state.scrollYSmooth = lerp(state.scrollYSmooth, state.scrollY, 0.10);
  }

  // ============================================================
  // 16. MAIN ANIMATION LOOP (single rAF)
  // ============================================================
  function animLoop() {
    state.tick++;

    updateScrollState();

    // Every frame
    updateCursor();
    updateStamps();
    updateMarquee();
    updateParallax();

    // Every 2 frames (less critical)
    if (state.tick % 2 === 0) {
      updateProgressBar();
      updateHeader();
      updateBackToTop();
      updatePager();
    }

    requestAnimationFrame(animLoop);
  }

  // ============================================================
  // 17. RESPONSIVE SCALE (article canvas)
  // ============================================================
  function initResponsiveScale() {
    const article = qs('article.page');
    const magsEl  = qs('#mags');
    const BASE_W  = 1024;

    function scale() {
      if (!article) return;

      // Measure the actual flex parent of the canvas. On short pages
      // the body can scroll internally and give #mags a width smaller
      // than documentElement.clientWidth; using the parent width keeps
      // the scaled canvas flush with both visible edges.
      const parentWidth = magsEl
        ? magsEl.getBoundingClientRect().width
        : document.documentElement.clientWidth;
      const vw = parentWidth || document.documentElement.clientWidth || window.innerWidth || BASE_W;
      const origH = parseFloat(article.getAttribute('data-original-height') || '800');
      const s = Math.max(0.1, vw / BASE_W);

      // The page canvas fills the full viewport at every width:
      // scale it up on wide screens and down on phones. Origin
      // `top center` keeps the centred article visually flush with
      // both edges. The negative/positive bottom margin turns the
      // layout box back into the scaled height.
      article.style.transform       = `scale(${s})`;
      article.style.transformOrigin = 'top center';
      article.style.height          = `${origH}px`;
      article.style.marginBottom    = `${origH * (s - 1)}px`;

      if (magsEl) {
        magsEl.style.height   = `${origH * s}px`;
        magsEl.style.overflow = 'hidden';
      }
    }

    window.addEventListener('resize', scale);

    // The iframe width can change without a window resize event on
    // some browsers; keep the embedded canvas in sync as well.
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(scale);
      if (magsEl) observer.observe(magsEl);
    }

    scale();
  }

  // ============================================================
  // 18. EMBED MODE — host page owns navigation
  // ============================================================

  /* Relative luminance of a CSS colour, used to keep the transparent
     general menu readable on every page surface. */
  function colorLuminance(color) {
    const text = String(color || '').trim();
    let r = 242;
    let g = 237;
    let b = 223;

    const rgbMatch = text.match(/^rgba?\(([^)]+)\)$/i);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(',').map(value => parseFloat(value));
      [r, g, b] = parts;
    } else {
      let hex = text.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      }
    }

    const channels = [r, g, b].map(channel => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function initNavInk() {
    if (!navHeader) return;

    // The index stack themes the menu per sheet from embeds.js.
    if (qs('.project-embed')) return;

    const bgEl = qs('.widget-background');
    let color = bgEl ? getComputedStyle(bgEl).backgroundColor : '';
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
      color = getComputedStyle(document.body).backgroundColor;
    }

    const dark = colorLuminance(color) < 0.22;
    navHeader.style.setProperty('--nav-ink', dark ? '#f2eddf' : '#111111');
    navHeader.style.setProperty('--nav-contrast', dark ? '#111111' : '#f2eddf');
  }

  /* The original Readymag pages carry their own fixed menu (logo,
     About / Shop / Contact / Projects, social icons) in the top
     fixed layer. The general sticky menu replaces it everywhere,
     so remove only that top band of chrome. */
  function initEmbedChrome() {
    const topLimit = 140;

    qsa('.fixed-position-container, .fixed-position-container-top').forEach(container => {
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

  function initEmbedLinks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;

      event.preventDefault();

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: 'teranstudio:embed-navigate', href },
          window.location.origin === 'null' ? '*' : window.location.origin
        );
      } else {
        window.location.href = href;
      }
    }, true);
  }

  // ============================================================
  // BOOT
  // ============================================================
  function boot() {
    if (IS_EMBED) {
      // The host page owns the scroll, so keep the embedded document
      // static: no cursor, overlays, observers or animation loop.
      document.documentElement.classList.add('embed-mode');
      initEmbedChrome();
      initHoverSpins();
      initResponsiveScale();
      initEmbedLinks();
      return;
    }

    initProgressBar();
    initHeader();
    initNavInk();
    initEmbedChrome();
    initStamps();
    initMarquee();
    initParallax();
    initRevealObserver();
    initHoverSpins();
    initLazyImages();
    initCursor();
    initBackToTop();
    initDrawer();
    initMobileNav();
    initPageTransitions();
    initResponsiveScale();

    // Kick off the unified animation loop
    requestAnimationFrame(animLoop);

    console.log(
      '%cTerán Studio%c Animation Engine v2 loaded',
      'background:#111;color:#f2eddf;padding:3px 8px;border-radius:3px;font-weight:700;',
      'color:#555;padding:3px 0;'
    );
  }

  // The CMS hydration layer loads this script asynchronously, after
  // DOMContentLoaded may already have fired; boot immediately in that
  // case instead of waiting for an event that will never come again.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();
