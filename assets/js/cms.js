/**
 * Terán Studio — CMS hydration layer.
 *
 * Loads the editable content from the API and paints it onto the public
 * site: theme tokens, top menu, hero, project stack, footer and the
 * images of every project page.
 *
 * It also loads studio.js / embeds.js *after* hydration so their
 * measurements run against the final markup.
 */

(function () {
  'use strict';

  if (window.__TERANSTUDIO_CMS__) return;
  window.__TERANSTUDIO_CMS__ = true;

  const API = '/api/content';
  const MARQUEE_WIDGET = '65eb824cda7f23003dcb2a6e';
  const MARQUEE_REPEAT = 12;

  const slug = (function () {
    const file = (window.location.pathname.split('/').pop() || 'index').replace(/\.html?$/i, '');
    return file || 'index';
  })();

  const pageFile = (function () {
    const file = window.location.pathname.split('/').pop() || 'index.html';
    return file || 'index.html';
  })();

  /* A project page is linked by its FILE (`page`), not by the editable
     slug: changing the slug in the panel must not disconnect the page
     from its colour, images and bottom bar. */
  function findProjectForPage(content) {
    const projects = content.projects || [];
    return projects.find(project => String(project.page || '').toLowerCase() === pageFile.toLowerCase())
      || projects.find(project => project.slug === slug)
      || null;
  }

  const isIndex = !!document.querySelector('.projects-embeds') || slug === 'index';

  /* Safety net: the original Readymag top-menu chrome was removed from
     the HTML, so this normally finds nothing. Kept so any page that
     still carries the export's fixed menu never shows it over the
     sticky menu. studio.js repeats the same rule (idempotent). */
  function hideTopChrome(doc) {
    const topLimit = 140;

    doc.querySelectorAll('.fixed-position-container, .fixed-position-container-top').forEach(container => {
      Array.from(container.children).forEach(node => {
        if (!node || node.tagName === 'STYLE' || node.tagName === 'SCRIPT') return;

        const top = /px$/.test(node.style.top || '') ? parseFloat(node.style.top) : NaN;
        let hide = Number.isFinite(top) && top >= -10 && top <= topLimit;

        if (!hide) {
          const inner = node.querySelector('img, svg, .rmwidget');
          if (inner && /px$/.test(inner.style.top || '')) {
            const innerTop = parseFloat(inner.style.top);
            if (Number.isFinite(innerTop) && innerTop >= -10 && innerTop <= topLimit) hide = true;
          }
        }

        if (hide) node.classList.add('embed-hide-chrome');
      });
    });
  }

  try {
    hideTopChrome(document);
  } catch (_) {
    // Never let the classification break the rest of the hydration.
  }

  /* ── helpers ────────────────────────────────────────────── */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function hexToRgba(hex, alpha) {
    const value = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(value)) return null;
    const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function loadScript(src) {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = resolve;
      document.body.appendChild(script);
    });
  }

  /* ── Google Fonts ───────────────────────────────────────── */

  const GOOGLE_FONTS_DATA = '/assets/data/google-fonts.json';
  const loadedGoogleFonts = new Set();
  let googleFontsPromise = null;

  function fontFamilyOf(stack) {
    const first = String(stack || '').split(',')[0].trim();
    return first.replace(/^['"]|['"]$/g, '').trim();
  }

  /* Loads the Google Fonts stylesheet for a stack saved in the panel.
     Unknown families (local fonts, system stacks) are ignored silently. */
  function ensureGoogleFont(stack) {
    const family = fontFamilyOf(stack);
    if (!family || loadedGoogleFonts.has(family.toLowerCase())) return;

    if (!googleFontsPromise) {
      googleFontsPromise = fetch(GOOGLE_FONTS_DATA)
        .then(response => (response.ok ? response.json() : []))
        .catch(() => []);
    }

    googleFontsPromise.then(fonts => {
      const font = (fonts || []).find(item => item.family.toLowerCase() === family.toLowerCase());
      if (!font) return;
      const key = font.family.toLowerCase();
      if (loadedGoogleFonts.has(key)) return;
      loadedGoogleFonts.add(key);

      const weights = font.weights && font.weights.length ? font.weights : [400];
      const axis = font.italic
        ? `ital,wght@${weights.map(weight => `0,${weight}`).join(';')};1,400`
        : `wght@${weights.join(';')}`;

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}:${axis}&display=swap`;
      document.head.appendChild(link);
    });
  }

  /* ── theme (colors, typography, sizes) ──────────────────── */

  function applyTheme(content) {
    const t = content.theme || {};
    const s = content.sizes || {};
    const accentSoft = hexToRgba(t.accent, 0.12);

    ensureGoogleFont(t.fontFamily);

    const lines = [];
    const set = (name, value) => {
      if (value === undefined || value === null || value === '') return;
      lines.push(`  ${name}: ${value};`);
    };

    set('--bg', t.bg);
    set('--bg-dark', t.bgDark);
    set('--ink', t.ink);
    set('--ink-muted', t.inkMuted);
    set('--ink-faint', t.inkFaint);
    set('--accent', t.accent);
    if (accentSoft) set('--accent-soft', accentSoft);
    set('--border', t.border);
    set('--font', t.fontFamily);

    const rules = [];
    rules.push(`:root {\n${lines.join('\n')}\n}`);

    if (t.baseFontSize) rules.push(`html { font-size: ${Number(t.baseFontSize)}px; }`);
    if (t.fontFamily) rules.push(`html body { font-family: var(--font); }`);
    if (t.lineHeight) rules.push(`body { line-height: ${Number(t.lineHeight)}; }`);

    if (t.navFontSize) {
      rules.push(`.studio-nav-link, .projects-drawer-item, .studio-nav-logo { font-size: ${Number(t.navFontSize)}px; }`);
    }
    if (t.sectionTitleSize) {
      rules.push(`.projects-embeds-title { font-size: ${Number(t.sectionTitleSize)}px; }`);
    }
    if (t.letterSpacing) {
      rules.push(`.projects-embeds-title, .studio-hero-title { letter-spacing: ${Number(t.letterSpacing)}em; }`);
    }
    if (s.navHeight) {
      rules.push(`:root { --nav-height: ${Number(s.navHeight)}px; }`);
    }
    if (s.navPad) {
      rules.push(`:root { --nav-pad: ${Number(s.navPad)}px; }`);
    }
    if (s.sectionPadding) {
      rules.push(`.projects-embeds-head { padding-top: ${Number(s.sectionPadding)}px; padding-bottom: ${Number(s.sectionPadding)}px; }`);
    }
    if (s.heroMinHeight) {
      rules.push(`.studio-hero { min-height: ${Number(s.heroMinHeight)}px; }`);
    }
    if (s.embedsTravel) rules.push(`:root { --embed-travel: ${Number(s.embedsTravel)}px; }`);
    if (s.embedsOverlap) rules.push(`:root { --embed-overlap-base: ${Number(s.embedsOverlap)}px; }`);

    let style = document.getElementById('cms-theme');
    if (!style) {
      style = document.createElement('style');
      style.id = 'cms-theme';
      document.head.appendChild(style);
    }
    style.textContent = rules.join('\n');
  }

  /* ── brand: title, description, favicon, logo ───────────── */

  function setMetaDescription(text) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', text);
  }

  function setFavicon(href) {
    let link = document.querySelector('link[rel~="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'icon');
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
    // Keep any apple-touch-icon in sync as well.
    const apple = document.querySelector('link[rel="apple-touch-icon"]');
    if (apple) apple.setAttribute('href', href);
  }

  function applySite(content) {
    const site = content.site;
    if (!site) return;

    // Only the home page owns the global title/description: internal
    // project pages keep their own.
    if (isIndex) {
      if (site.title) document.title = site.title;
      if (site.description) setMetaDescription(site.description);
    }
    if (site.favicon) setFavicon(site.favicon);

    const logo = document.querySelector('.studio-nav-logo');
    if (!logo) return;
    if (content.nav && content.nav.logoHref) logo.setAttribute('href', content.nav.logoHref);

    if (site.logo) {
      logo.innerHTML = '';
      const img = document.createElement('img');
      img.className = 'studio-nav-logo-img';
      img.src = site.logo;
      img.alt = site.logoAlt || '';
      if (site.logoHeight) img.style.height = `${Number(site.logoHeight)}px`;
      logo.appendChild(img);
    }
  }

  /* ── top menu ───────────────────────────────────────────── */

  function applyNav(nav) {
    if (!nav) return;

    const logo = document.querySelector('.studio-nav-logo');
    if (logo) {
      logo.setAttribute('href', nav.logoHref || 'index.html');
      const span = logo.querySelector('span') || logo;
      span.textContent = nav.logoText || '';
    }

    const links = document.querySelector('.studio-nav-links');
    if (links && Array.isArray(nav.links)) {
      links.innerHTML = '';
      for (const link of nav.links) {
        if (!link || !link.label) continue;
        const label = link.label;
        const action = link.action || 'link';

        if (action === 'drawer') {
          const button = el('button', 'studio-nav-link projects-toggle', label);
          button.type = 'button';
          links.appendChild(button);
        } else {
          const a = el('a', 'studio-nav-link', label);
          a.href = link.href || '#';
          if (action === 'external') {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
          }
          const target = String(link.href || '').split('/').pop().replace(/\.html?$/i, '');
          if (target && target === slug) a.classList.add('active');
          links.appendChild(a);
        }
      }
    }
  }

  /* ── drawer (project index) ─────────────────────────────── */

  function applyDrawer(content) {
    const list = document.querySelector('.projects-drawer-list');
    if (!list) return;

    list.innerHTML = '';

    const home = el('a', 'projects-drawer-item' + (slug === 'index' ? ' active' : ''));
    home.href = 'index.html';
    home.appendChild(el('span', null, (content.nav && content.nav.logoText) || ''));
    home.appendChild(el('span', 'item-num', 'Studio Home'));
    list.appendChild(home);

    content.projects
      .filter(project => project.enabled)
      .forEach((project, index) => {
        const item = el('a', 'projects-drawer-item');
        item.href = project.page;
        if (String(project.page || '').replace(/\.html?$/i, '') === slug) item.classList.add('active');
        item.appendChild(el('span', null, project.title));
        const num = String(index + 1).padStart(2, '0');
        item.appendChild(el('span', 'item-num', `${num} / ${project.subtitle || ''}`.trim()));
        list.appendChild(item);
      });
  }

  /* ── hero ───────────────────────────────────────────────── */

  /* Optional per-hero typography. Every value is painted as a CSS custom
     property on the hero block, so the stylesheet keeps its defaults and
     the panel only overrides what the editor actually set. */
  function applyHeroTypography(block, hero) {
    const setVar = (name, value) => {
      if (value === undefined || value === null) return;
      const text = String(value).trim();
      if (!text) return;
      block.style.setProperty(name, text);
    };
    const px = value => {
      const size = Number(value);
      return size > 0 ? size : 0;
    };

    if (hero.fontFamily) setVar('--hero-font', hero.fontFamily);
    ensureGoogleFont(hero.fontFamily);
    if (px(hero.titleSize)) setVar('--hero-title-size', `min(${px(hero.titleSize)}px, 13vw)`);
    if (hero.titleWeight) {
      if (hero.titleWeight === 'italic') setVar('--hero-title-style', 'italic');
      else setVar('--hero-title-weight', hero.titleWeight);
    }
    if (Number(hero.titleLineHeight) > 0) setVar('--hero-title-line', Number(hero.titleLineHeight));
    if (hero.titleLetterSpacing) setVar('--hero-title-tracking', hero.titleLetterSpacing);
    if (px(hero.subtitleSize)) setVar('--hero-subtitle-size', `min(${px(hero.subtitleSize)}px, 5vw)`);
    if (px(hero.chipSize)) setVar('--hero-meta-size', `${px(hero.chipSize)}px`);
    if (px(hero.ctaSize)) setVar('--hero-cta-size', `${px(hero.ctaSize)}px`);
    if (hero.titleColor) setVar('--hero-title-color', hero.titleColor);
    if (hero.accentColor) setVar('--hero-accent-color', hero.accentColor);
    if (hero.subtitleColor) setVar('--hero-subtitle-color', hero.subtitleColor);
    if (hero.chipColor) setVar('--hero-meta-color', hero.chipColor);
    if (hero.chipBg) setVar('--hero-meta-bg', hero.chipBg);
    if (hero.ctaBg) setVar('--hero-cta-bg', hero.ctaBg);
    if (hero.ctaColor) setVar('--hero-cta-color', hero.ctaColor);
    if (hero.ghostColor) setVar('--hero-ghost-color', hero.ghostColor);
  }

  function applyHero(hero) {
    if (!hero) return;

    // The marquee ribbon lives inside the Readymag canvas.
    const marquee = document.querySelector(`[data-id="${MARQUEE_WIDGET}"] p`);
    if (marquee && hero.marqueeText) {
      marquee.textContent = String(hero.marqueeText).repeat(MARQUEE_REPEAT);
    }

    if (hero.showStamps === false) {
      document.documentElement.classList.add('cms-hide-stamps');
    } else {
      document.documentElement.classList.remove('cms-hide-stamps');
    }

    const block = document.getElementById('site-hero');
    if (!block) return;

    if (!hero.enabled) {
      block.hidden = true;
      block.innerHTML = '';
      return;
    }

    block.hidden = false;
    block.innerHTML = '';
    applyHeroTypography(block, hero);

    // Atmosphere, then the editorial grid with the copy and the visual.
    block.appendChild(el('div', 'studio-hero-aurora'));
    block.appendChild(el('div', 'studio-hero-grain'));

    const grid = el('div', 'studio-hero-grid');
    const copy = el('div', 'studio-hero-copy');

    if (hero.title || hero.accentWord) {
      const title = el('h1', 'studio-hero-title');
      if (hero.title) {
        const line = el('span', 'studio-hero-line');
        line.setAttribute('data-reveal', '');
        line.textContent = hero.title;
        title.appendChild(line);
      }
      if (hero.accentWord) {
        const line = el('span', 'studio-hero-line studio-hero-accent');
        line.setAttribute('data-reveal', '');
        line.textContent = hero.accentWord;
        title.appendChild(line);
      }
      copy.appendChild(title);
    }

    if (hero.subtitle) {
      const sub = el('p', 'studio-hero-subtitle');
      sub.setAttribute('data-reveal', '');
      sub.textContent = hero.subtitle;
      copy.appendChild(sub);
    }

    if ((hero.ctaLabel && hero.ctaHref) || (hero.ctaGhostLabel && hero.ctaGhostHref)) {
      const actions = el('div', 'studio-hero-actions');
      actions.setAttribute('data-reveal', '');
      if (hero.ctaLabel && hero.ctaHref) {
        const cta = el('a', 'studio-hero-cta', hero.ctaLabel);
        cta.href = hero.ctaHref;
        cta.setAttribute('data-magnetic', '');
        actions.appendChild(cta);
      }
      if (hero.ctaGhostLabel && hero.ctaGhostHref) {
        const ghost = el('a', 'studio-hero-ghost', '');
        ghost.href = hero.ctaGhostHref;
        ghost.appendChild(document.createTextNode(hero.ctaGhostLabel));
        ghost.appendChild(el('span', 'studio-hero-ghost-arrow', '→'));
        actions.appendChild(ghost);
      }
      copy.appendChild(actions);
    }

    if (Array.isArray(hero.chips) && hero.chips.length) {
      const meta = el('div', 'studio-hero-meta');
      meta.setAttribute('data-reveal', '');
      hero.chips.forEach(chip => meta.appendChild(el('span', 'studio-hero-chip', chip)));
      copy.appendChild(meta);
    }

    grid.appendChild(copy);

    const images = hero.images || {};
    const hasVisual = (images.main && images.main.src) || (images.small && images.small.src) || hero.badgeText;
    if (hasVisual) {
      const visual = el('div', 'studio-hero-visual');
      visual.setAttribute('data-reveal', '');
      visual.setAttribute('data-spotlight', '');

      if (images.main && images.main.src) {
        const figure = el('figure', 'studio-hero-photo studio-hero-photo-main');
        const img = document.createElement('img');
        img.src = images.main.src;
        img.alt = images.main.alt || '';
        img.loading = 'eager';
        img.setAttribute('fetchpriority', 'high');
        img.decoding = 'async';
        figure.appendChild(img);
        if (images.main.caption) {
          const cap = el('figcaption', 'studio-hero-caption');
          cap.appendChild(el('span', 'studio-hero-caption-num', '01'));
          cap.appendChild(document.createTextNode(images.main.caption));
          figure.appendChild(cap);
        }
        visual.appendChild(figure);
      }

      if (images.small && images.small.src) {
        const figure = el('figure', 'studio-hero-photo studio-hero-photo-small');
        const img = document.createElement('img');
        img.src = images.small.src;
        img.alt = images.small.alt || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        figure.appendChild(img);
        if (images.small.caption) {
          figure.appendChild(el('figcaption', 'studio-hero-caption studio-hero-caption-small', images.small.caption));
        }
        visual.appendChild(figure);
      }

      if (hero.badgeText) {
        visual.appendChild(buildHeroBadge(hero.badgeText));
      }

      if (hero.glassText) {
        const glass = el('div', 'studio-hero-glass', hero.glassText);
        glass.setAttribute('aria-hidden', 'true');
        visual.appendChild(glass);
      }

      grid.appendChild(visual);
    } else {
      grid.classList.add('studio-hero-grid--solo');
    }

    block.appendChild(grid);

    // Staggered entrance, magnetic CTA, cursor glow, scroll parallax.
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveal = block.querySelectorAll('[data-reveal]');
    reveal.forEach((node, index) => node.style.setProperty('--rd', `${index * 90}ms`));

    if (!reduced && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      reveal.forEach(node => io.observe(node));
    } else {
      reveal.forEach(node => node.classList.add('is-in'));
    }

    if (reduced) return;

    const spotlight = block.querySelector('[data-spotlight]');
    if (spotlight) {
      spotlight.addEventListener('pointermove', event => {
        const rect = spotlight.getBoundingClientRect();
        spotlight.style.setProperty('--sx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
        spotlight.style.setProperty('--sy', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      });
    }

    const magnetic = block.querySelector('[data-magnetic]');
    if (magnetic) {
      magnetic.addEventListener('pointermove', event => {
        const rect = magnetic.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        magnetic.style.setProperty('--mx', `${(x * 12).toFixed(1)}px`);
        magnetic.style.setProperty('--my', `${(y * 12).toFixed(1)}px`);
      });
      magnetic.addEventListener('pointerleave', () => {
        magnetic.style.setProperty('--mx', '0px');
        magnetic.style.setProperty('--my', '0px');
      });
    }

    const photos = block.querySelectorAll('.studio-hero-photo');
    if (photos.length) {
      let raf = 0;
      const parallax = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const rect = block.getBoundingClientRect();
          const progress = Math.min(Math.max((window.innerHeight - rect.top) / (rect.height + window.innerHeight), 0), 1);
          photos.forEach((photo, index) => {
            const travel = (index % 2 === 0 ? -1 : 1) * 24 * progress;
            photo.style.setProperty('--py', `${travel.toFixed(1)}px`);
          });
          raf = 0;
        });
      };
      window.addEventListener('scroll', parallax, { passive: true });
      parallax();
    }
  }

  /** Rotating SVG circular badge (text on a ring path). */
  function buildHeroBadge(label) {
    const ns = 'http://www.w3.org/2000/svg';
    const badge = el('div', 'studio-hero-badge');
    badge.setAttribute('aria-hidden', 'true');

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');

    const defs = document.createElementNS(ns, 'defs');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0');
    path.setAttribute('id', 'studio-hero-badge-path');
    defs.appendChild(path);

    const textEl = document.createElementNS(ns, 'text');
    const textPath = document.createElementNS(ns, 'textPath');
    textPath.setAttribute('href', '#studio-hero-badge-path');
    textPath.textContent = label;
    textEl.appendChild(textPath);

    svg.appendChild(defs);
    svg.appendChild(textEl);
    badge.appendChild(svg);
    return badge;
  }

  /* ── hero background (colour or image) ──────────────────── */

  function applyHeroBackground(hero) {
    if (!hero) return;

    let style = document.getElementById('cms-hero-bg');
    const type = hero.bgType || '';

    if (!type) {
      if (style) style.textContent = '';
      return;
    }

    if (!style) {
      style = document.createElement('style');
      style.id = 'cms-hero-bg';
      document.head.appendChild(style);
    }

    const surfaces = '#mags, article.page, .page, #site-hero';
    const canvas = '.page-fixed-bg-container, .widget-background';
    const color = hero.bgColor || 'transparent';

    if (type === 'color') {
      style.textContent =
        `${surfaces}, ${canvas} { background-color: ${color} !important; background-image: none !important; }`;
      return;
    }

    style.textContent = [
      `${surfaces} { background-color: ${color} !important; }`,
      `${canvas} {`,
      `  background-color: ${color} !important;`,
      `  background-image: url("${hero.bgImage}") !important;`,
      `  background-size: ${hero.bgSize || 'cover'} !important;`,
      `  background-position: ${hero.bgPosition || 'center'} !important;`,
      `  background-repeat: no-repeat !important;`,
      `}`
    ].join('\n');
  }

  /* ── canvas fixed background (page-fixed-bg-container) ──── */

  function applyCanvasBg(section) {
    if (!section) return;
    const container = document.querySelector('.page-fixed-bg-container');
    if (!container) return;

    let style = document.getElementById('cms-canvas-bg');
    if (!style) {
      style = document.createElement('style');
      style.id = 'cms-canvas-bg';
      document.head.appendChild(style);
    }

    if (section.enabled === false) {
      container.style.display = 'none';
      style.textContent = '';
      return;
    }

    container.style.display = '';
    const color = section.color || '#f2eddf';
    const opacity = Math.max(0, Math.min(100, Number(section.opacity) || 100)) / 100;
    const image = section.image ? `url("${section.image}")` : 'none';

    style.textContent = [
      `.page-fixed-bg-container .widget-background {`,
      `  background-color: ${color} !important;`,
      `  background-image: ${image} !important;`,
      `  background-size: ${section.imageSize || 'cover'} !important;`,
      `  background-position: ${section.imagePosition || 'center'} !important;`,
      `  background-repeat: no-repeat !important;`,
      `}`,
      `.page-fixed-bg-container { opacity: ${opacity}; }`
    ].join('\n');
  }

  /* ── projects section head ──────────────────────────────── */

  function applyProjectsSection(section) {
    if (!section) return;
    const block = document.getElementById('proyectos');
    if (!block) return;

    // Entire block toggle (header + stacked projects).
    block.hidden = section.enabled === false;

    const head = block.querySelector('.projects-embeds-head');
    if (!head) return;

    const kicker = head.querySelector('.projects-embeds-kicker');
    const title = head.querySelector('.projects-embeds-title');
    const note = head.querySelector('.projects-embeds-note');

    if (kicker && section.kicker) kicker.textContent = section.kicker;
    if (title && section.title) title.textContent = section.title;
    if (note && section.note) note.textContent = section.note;

    // Per-section palette (empty = fall back to the global theme).
    const palette = {
      '--ps-bg': section.bg,
      '--ps-ink': section.ink,
      '--ps-muted': section.muted,
      '--ps-accent': section.accent,
      '--ps-border': section.border
    };
    Object.keys(palette).forEach(name => {
      if (palette[name]) block.style.setProperty(name, palette[name]);
    });
  }

  /* ── project stack (index) ──────────────────────────────── */

  function buildStack(content) {
    const section = document.querySelector('.projects-embeds');
    if (!section) return;

    const stack = content.projects.filter(project => project.inStack && project.enabled);
    const total = String(stack.length).padStart(2, '0');

    section.querySelectorAll('.project-embed').forEach(node => node.remove());

    const fragment = document.createDocumentFragment();
    stack.forEach((project, index) => {
      const article = el('article', 'project-embed');
      article.dataset.page = project.page;
      article.dataset.height = String(project.pageHeight || 800);
      article.style.setProperty('--page-bg', project.color || '#f2eddf');
      if (project.bgImage) {
        article.classList.add('has-bg');
        article.dataset.bgImage = project.bgImage;
        article.dataset.bgSize = project.bgSize || 'cover';
        article.dataset.bgPosition = project.bgPosition || 'center';
        article.dataset.bgOverlay = project.bgOverlay || '';
        article.dataset.bgOverlayOpacity = String(Number(project.bgOverlayOpacity) || 0);
      }

      const backdrop = el('div', 'project-embed-backdrop');
      backdrop.setAttribute('aria-hidden', 'true');

      const frame = el('iframe', 'project-embed-frame');
      frame.dataset.src = `${project.page}?embed=1`;
      const num = String(index + 1).padStart(2, '0');
      frame.title = `${project.title} — proyecto ${num} de ${total}`;

      article.appendChild(backdrop);
      article.appendChild(frame);
      fragment.appendChild(article);
    });

    section.appendChild(fragment);
  }

  /* ── footer + badge ─────────────────────────────────────── */

  function applyFooter(footer) {
    if (!footer) return;

    const badge = document.querySelector('.studio-demo-badge');
    if (badge) {
      if (footer.badgeText) {
        const span = badge.querySelector('span');
        if (span) span.textContent = footer.badgeText;
      }
      const dot = badge.querySelector('.badge-dot');
      if (dot && footer.badgeDot) dot.style.background = footer.badgeDot;
    }

    const block = document.getElementById('site-footer');
    if (!block) return;

    if (!footer.enabled) {
      block.hidden = true;
      return;
    }

    block.hidden = false;
    block.innerHTML = '';

    const inner = el('div', 'studio-footer-inner');

    const brand = el('div', 'studio-footer-brand');
    brand.appendChild(el('strong', 'studio-footer-title', footer.brand || ''));
    if (footer.tagline) brand.appendChild(el('span', 'studio-footer-tagline', footer.tagline));
    inner.appendChild(brand);

    (footer.columns || []).forEach(column => {
      const col = el('div', 'studio-footer-col');
      col.appendChild(el('span', 'studio-footer-heading', column.title || ''));
      (column.links || []).forEach(link => {
        const a = el('a', 'studio-footer-link', link.label || '');
        a.href = link.href || '#';
        if (/^https?:/i.test(link.href || '')) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
        col.appendChild(a);
      });
      inner.appendChild(col);
    });

    if ((footer.social || []).length) {
      const col = el('div', 'studio-footer-col');
      col.appendChild(el('span', 'studio-footer-heading', 'Social'));
      footer.social.forEach(link => {
        const a = el('a', 'studio-footer-link', link.label || '');
        a.href = link.href || '#';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        col.appendChild(a);
      });
      inner.appendChild(col);
    }

    block.appendChild(inner);
    if (footer.copyright) block.appendChild(el('div', 'studio-footer-copy', footer.copyright));
  }

  /* ── project page images (positions preserved) ──────────── */

  function setWidgetImage(widget, src) {
    const bg = widget.querySelector('.bgpic');
    if (bg) {
      bg.setAttribute('url', src);
      bg.style.backgroundImage = `url("${src}")`;
    }
    const img = widget.querySelector('img');
    if (img) {
      img.removeAttribute('srcset');
      img.setAttribute('src', src);
    }
  }

  /* Position overrides coming from the panel. Empty values keep the
     original layout, so an untouched image never moves. */
  function applyWidgetPosition(widget, position) {
    if (!position) return;

    const apply = (prop, value) => {
      if (value === undefined || value === null || String(value).trim() === '') return;
      widget.style[prop] = String(value).trim();
    };

    apply('left', position.left);
    apply('top', position.top);
    apply('width', position.width);
    apply('height', position.height);
    apply('zIndex', position.zIndex);
  }

  function applyProjectImages(project) {
    if (!project || !Array.isArray(project.images)) return;

    // Images removed from the panel stay hidden: the exported HTML still
    // contains the original asset, so the slot must be switched off here.
    (project.hiddenWidgets || []).forEach(widgetId => {
      const node = document.querySelector(`[data-id="${widgetId}"]`);
      if (node) node.style.display = 'none';
    });

    const fallback = Array.from(document.querySelectorAll('.rmwidget.widget-picture'));
    const claimed = new Set();

    project.images.forEach(image => {
      // Images with a widgetId belong to a concrete slot: if it is not on
      // this page (or is repeated) they are ignored. Only rows without a
      // widgetId (added manually) use the next free slot, so they can
      // never overwrite a real image.
      let widget = null;
      if (image.widgetId) {
        widget = document.querySelector(`[data-id="${image.widgetId}"]`);
        if (widget && claimed.has(widget)) widget = null;
        if (!widget) return;
      } else {
        widget = fallback.find(node => !claimed.has(node)) || null;
        if (!widget) return;
      }
      claimed.add(widget);

      setWidgetImage(widget, image.src);
      applyWidgetPosition(widget, image.position);

      const img = widget.querySelector('img');
      if (img && image.alt) img.setAttribute('alt', image.alt);
      if (image.caption) widget.setAttribute('data-caption', image.caption);
    });
  }

  /* ── project page background ────────────────────────────── */

  function applyProjectBackground(project) {
    if (!project) return;

    const color = project.color || '';
    const image = String(project.bgImage || '').trim();
    const embed = /[?&]embed=1(?:&|$)/.test(window.location.search);

    let style = document.getElementById('cms-project-bg');
    if (!style) {
      style = document.createElement('style');
      style.id = 'cms-project-bg';
      document.head.appendChild(style);
    }

    const surfaces = 'html, body, #mags, article.page, .page';
    const inner = '.page-fixed-bg-container, .widget-background, .content-scroll-wrapper, .content-bounds, .page-content-container';

    if (!image) {
      if (!color) return;
      style.textContent = [
        `${surfaces} { background-color: ${color} !important; background-image: none !important; }`,
        `${inner} { background-color: ${color} !important; }`
      ].join('\n');
      document.documentElement.style.setProperty('--page-bg', color);
      return;
    }

    const opacity = Math.max(0, Math.min(100, Number(project.bgOverlayOpacity) || 0)) / 100;
    const overlay = project.bgOverlay ? hexToRgba(project.bgOverlay, opacity) : '';
    const layers = overlay
      ? `linear-gradient(${overlay}, ${overlay}), url("${image}")`
      : `url("${image}")`;
    const size = project.bgSize || 'cover';
    const position = project.bgPosition || 'center';
    const attachment = project.bgFixed === false ? 'scroll' : 'fixed';

    if (embed) {
      // Inside the home stack the background is painted by the host page
      // (sticky layer), so this document must stay transparent above it.
      style.textContent = `${surfaces}, ${inner} { background: transparent !important; }`;
    } else {
      // Standalone project page: the image stays fixed while the page
      // scrolls, with the project colour underneath and the optional
      // overlay on top.
      style.textContent = [
        `${surfaces}, ${inner} { background: transparent !important; }`,
        `html, body { background-color: ${color || 'transparent'} !important; background-image: ${layers} !important; background-size: ${size} !important; background-position: ${position} !important; background-repeat: no-repeat !important; background-attachment: ${attachment} !important; }`
      ].join('\n');
    }

    document.documentElement.style.setProperty('--page-bg', color || '#f2eddf');
  }

  /* ── project page bottom bar (name + "+info" button) ────── */

  function findBottomBar() {
    const roots = document.querySelectorAll('.fixed-position-container, .fixed-position-container-top');
    let name = null;
    let button = null;
    let hotspot = null;

    roots.forEach(root => {
      root.querySelectorAll('.rmwidget').forEach(node => {
        const style = node.getAttribute('style') || '';
        const hasBottom = /(?:^|;)\s*bottom\s*:/.test(style);
        const hasTop = /(?:^|;)\s*top\s*:/.test(style);
        if (!hasBottom || hasTop) return;

        if (!name && node.classList.contains('widget-text-v3') && /(?:^|;)\s*left\s*:/.test(style)) {
          name = node;
        }
        if (!button && node.classList.contains('widget-button')) button = node;
        if (!hotspot && node.classList.contains('widget-hotspot')) hotspot = node;
      });
    });

    return { name, button, hotspot };
  }

  function applyProjectBar(project) {
    if (!project) return;

    const bar = findBottomBar();
    if (!bar.name && !bar.button && !bar.hotspot) return;

    const show = project.showBar !== false;
    [bar.name, bar.button, bar.hotspot].forEach(node => {
      if (node) node.style.display = show ? '' : 'none';
    });
    if (!show) return;

    // Bottom-left: the project name repeated at the end of the sheet.
    if (bar.name) {
      const label = String(project.footerTitle || '').trim() || project.title || '';
      const target = bar.name.querySelector('p') || bar.name;
      target.textContent = label;
    }

    // Bottom-right: the "+info" button label.
    if (bar.button) {
      const text = bar.button.querySelector('.common-button .text') || bar.button.querySelector('.text');
      if (text) text.textContent = project.infoLabel === undefined || project.infoLabel === null ? 'Info' : project.infoLabel;
    }

    // Optional destination for the "+info" button.
    const href = String(project.infoHref || '').trim();
    const clickable = bar.hotspot || bar.button;
    if (href && clickable) {
      clickable.style.pointerEvents = 'auto';
      clickable.style.cursor = 'pointer';
      clickable.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (/^(https?:)?\/\//i.test(href) || /^mailto:|^tel:/i.test(href)) {
          window.open(href, '_blank', 'noopener');
        } else if (window.parent && window.parent !== window) {
          const origin = window.location.origin === 'null' ? '*' : window.location.origin;
          window.parent.postMessage({ type: 'teranstudio:embed-navigate', href }, origin);
        } else {
          window.location.href = href;
        }
      });
    }
  }

  /* ── per-page block overrides (generic editor) ──────────── */

  function makeClickable(node, href) {
    node.style.pointerEvents = 'auto';
    node.style.cursor = 'pointer';
    node.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (/^(https?:)?\/\//i.test(href) || /^mailto:|tel:/i.test(href)) {
        window.open(href, '_blank', 'noopener');
      } else if (window.parent && window.parent !== window) {
        const origin = window.location.origin === 'null' ? '*' : window.location.origin;
        window.parent.postMessage({ type: 'teranstudio:embed-navigate', href }, origin);
      } else {
        window.location.href = href;
      }
    });
  }

  /* Paints the overrides saved by the “Páginas” tab. Runs on every page
     after the structured blocks (nav, hero, stack, footer, project) so a
     hand-edited widget always wins over the generated defaults. */
  function applyBlocks(content) {
    const page = content.blocks && content.blocks[slug];
    if (!page) return;

    if (page.meta) {
      if (page.meta.title) document.title = page.meta.title;
      if (page.meta.description) setMetaDescription(page.meta.description);
    }

    Object.keys(page).forEach(blockId => {
      if (blockId === 'meta') return;
      const override = page[blockId];
      if (!override) return;

      const node = document.querySelector(`.rmwidget[data-id="${blockId}"], [data-id="${blockId}"]`);
      if (!node) return;

      if (override.hidden) {
        node.style.display = 'none';
        return;
      }

      if (typeof override.html === 'string' && override.html !== '') {
        const viewer = node.querySelector('.text-viewer');
        if (viewer) viewer.innerHTML = override.html;
      }

      if (override.label !== undefined) {
        const text = node.querySelector('.common-button .text, .text');
        if (text) text.textContent = override.label;
      }

      if (override.src) setWidgetImage(node, override.src);

      if (override.alt) {
        const img = node.querySelector('img');
        if (img) img.setAttribute('alt', override.alt);
      }

      if (override.href !== undefined) {
        const href = String(override.href || '').trim();
        const a = node.querySelector('a');
        if (a) {
          if (!href) a.removeAttribute('href');
          else {
            a.setAttribute('href', href);
            if (/^(https?:)?\/\//i.test(href)) {
              a.setAttribute('target', '_blank');
              a.setAttribute('rel', 'noopener noreferrer');
            }
          }
        } else if (href) {
          makeClickable(node, href);
        }
      }
    });
  }

  /* Project indexes in the exported pages (the side list and the bottom
     pager) keep the original names in static HTML. Both are repainted from
     the panel projects so renames show up everywhere. */
  function projectForHref(content, href) {
    if (!href || /^(?:#|https?:|mailto:|tel:|javascript:)/i.test(href)) return null;
    const file = href.split('/').pop().split(/[?#]/)[0].toLowerCase();
    if (!file) return null;
    return (content.projects || []).find(project => String(project.page || '').toLowerCase() === file) || null;
  }

  function applyProjectIndexLinks(content) {
    document.querySelectorAll('.rmwidget.widget-text-v3 a[href]').forEach(link => {
      const project = projectForHref(content, link.getAttribute('href'));
      if (project && project.title) link.textContent = project.title;
    });
  }

  function applyProjectPager(content) {
    const pager = document.querySelector('.studio-pager');
    if (!pager) return;

    const stack = (content.projects || []).filter(project => project.inStack && project.enabled);
    const index = stack.findIndex(project => String(project.page || '').toLowerCase() === pageFile.toLowerCase());
    const links = Array.from(pager.querySelectorAll('a'));
    if (index < 0 || stack.length < 2 || links.length < 3) return;

    const prev = stack[(index - 1 + stack.length) % stack.length];
    const next = stack[(index + 1) % stack.length];

    const write = (link, name, arrow, first) => {
      link.textContent = '';
      const label = document.createElement('span');
      label.textContent = name;
      const glyph = document.createElement('span');
      glyph.textContent = arrow;
      if (first) {
        link.appendChild(glyph);
        link.appendChild(document.createTextNode(' '));
        link.appendChild(label);
      } else {
        link.appendChild(label);
        link.appendChild(document.createTextNode(' '));
        link.appendChild(glyph);
      }
    };

    links[0].setAttribute('href', prev.page);
    links[0].setAttribute('title', `Proyecto anterior: ${prev.title}`);
    write(links[0], prev.title, '←', true);

    links[1].setAttribute('title', 'Ver todos los proyectos');
    links[1].textContent = `Índice (${index + 1}/${stack.length})`;

    links[2].setAttribute('href', next.page);
    links[2].setAttribute('title', `Siguiente proyecto: ${next.title}`);
    write(links[2], next.title, '→', false);
  }

  /* ── run ────────────────────────────────────────────────── */

  async function run() {
    let content = null;

    try {
      const response = await fetch(API, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      content = await response.json();
    } catch (error) {
      console.warn('[cms] No se pudo cargar el contenido editable:', error.message);
    }

    if (content) {
      applyTheme(content);

      // Menu, logo and drawer are shared by every page; several inner
      // pages ship their own static copy, so they are repainted here too.
      applyNav(content.nav);
      applySite(content);
      applyDrawer(content);

      if (isIndex) {
        applyHero(content.hero);
        applyHeroBackground(content.hero);
        applyCanvasBg(content.canvasBg);
        applyProjectsSection(content.projectsSection);
        buildStack(content);
        // Fixed canvas images of the home page, managed as the “Inicio”
        // pseudo-project in the panel.
        applyProjectImages(content.home);
        applyFooter(content.footer);
      } else {
        const project = findProjectForPage(content);
        applyProjectBackground(project);
        applyProjectImages(project);
        applyProjectBar(project);
      }

      applyBlocks(content);
      applyProjectIndexLinks(content);
      applyProjectPager(content);
    }

    // Load the animation engine after hydration so it measures the
    // final markup (marquee text, project stack, images).
    await loadScript('assets/js/studio.js');
    if (isIndex) await loadScript('assets/js/embeds.js');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
