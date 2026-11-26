'use strict';

/**
 * Content model for the Terán Studio CMS.
 *
 * Every editable area of the public site is described here as a JSON
 * group stored in the `settings` table. `DEFAULT_CONTENT` is the
 * authoritative fallback: it mirrors the design that shipped before the
 * CMS existed, so the site looks identical until an editor changes it.
 */

const DEFAULT_CONTENT = {
  site: {
    title: 'Terán Studio — Design and Art Web Studio',
    description: 'Terán Studio — Design & Art Web Studio. Estudio de diseño gráfico, letterpress y dirección creativa.',
    logo: '',
    logoAlt: 'Terán Studio',
    logoHeight: 30,
    favicon: 'assets/images/Favicon-39e6daeb-f233-4a04-a635-_7478052d.png',
    // When true, the fixed canvas images of the home page are managed by
    // the virtual “Inicio” project in the Projects tab.
    manageHomeImages: true
  },
  theme: {
    bg: '#f2eddf',
    bgDark: '#e8e2d2',
    ink: '#111111',
    inkMuted: '#555555',
    inkFaint: '#999999',
    accent: '#d84315',
    border: 'rgba(0,0,0,0.10)',
    fontFamily: "'custom_66210','Mabry',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    baseFontSize: 16,
    navFontSize: 12,
    sectionTitleSize: 64,
    letterSpacing: 0,
    lineHeight: 1.5
  },
  sizes: {
    navHeight: 58,
    navPad: 0,
    embedsTravel: 0,
    embedsOverlap: 0,
    sectionPadding: 0,
    heroMinHeight: 0
  },
  nav: {
    logoText: 'Terán Studio',
    logoHref: 'index.html',
    links: [
      { label: 'Proyectos', action: 'drawer', href: '' },
      { label: 'About', action: 'link', href: 'about.html' },
      { label: 'Shop', action: 'external', href: 'https://www.noplan.press/' },
      { label: 'Contact', action: 'link', href: 'contact.html' }
    ]
  },
  hero: {
    enabled: true,
    title: 'Design & Art',
    accentWord: 'Web Studio',
    subtitle: 'A graphic design, letterpress and art studio in Takoma Park, MD.',
    ctaLabel: '',
    ctaHref: '',
    ctaGhostLabel: 'About the studio',
    ctaGhostHref: 'about.html',
    chips: ['Branding', 'Art direction', 'Letterpress', 'Editorial'],
    marqueeText: 'Design & Art Studio—',
    showStamps: true,
    // Hero canvas background: '' = keep the original export colour.
    bgType: '',
    bgColor: '#f2eddf',
    bgImage: '',
    bgSize: 'cover',
    bgPosition: 'center',
    images: {
      main: { src: 'assets/uploads/hero-print.png', alt: 'Prensa tipográfica del estudio', caption: 'Letterpress — prensa del estudio' },
      small: { src: 'assets/uploads/hero-type.png', alt: 'Tipos de madera y plomo sobre papel crema', caption: 'Tipos de madera y plomo' }
    },
    badgeText: 'Graphic Design • Letterpress • Art',
    glassText: 'est. 2016',
    // Per-hero typography. Empty/0 values fall back to the global theme.
    fontFamily: '',
    titleSize: 0,
    titleWeight: '',
    titleLineHeight: 0,
    titleLetterSpacing: '',
    subtitleSize: 0,
    chipSize: 0,
    ctaSize: 0,
    titleColor: '',
    accentColor: '',
    subtitleColor: '',
    chipColor: '',
    chipBg: '',
    ctaBg: '',
    ctaColor: '',
    ghostColor: ''
  },
  projectsSection: {
    enabled: true,
    kicker: '01 — 10 · Terán Studio Archive',
    title: 'Proyectos',
    note: 'Selected branding, art direction & letterpress projects. Scroll to explore.',
    // Empty = fall back to the global theme tokens.
    bg: '',
    ink: '',
    muted: '',
    accent: '',
    border: ''
  },
  // Fixed canvas background (the .page-fixed-bg-container block).
  canvasBg: {
    enabled: true,
    color: '#f2eddf',
    image: '',
    imageSize: 'cover',
    imagePosition: 'center',
    opacity: 100
  },
  footer: {
    enabled: true,
    brand: 'Terán Studio',
    tagline: 'Design & Art Studio',
    columns: [
      {
        title: 'Studio',
        links: [
          { label: 'About', href: 'about.html' },
          { label: 'Contact', href: 'contact.html' }
        ]
      },
      {
        title: 'Tienda',
        links: [
          { label: 'Terán Studio Press', href: 'https://www.noplan.press/' }
        ]
      }
    ],
    social: [
      { label: 'Instagram', href: 'https://www.instagram.com/' }
    ],
    copyright: '© Terán Studio — Design & Art Web Studio',
    badgeText: 'Terán Studio — Design & Art Web Studio',
    badgeDot: '#d84315'
  },
  // Per-page overrides for the widgets of the exported pages (generic
  // block editor). Shape: { "<pageKey>": { "meta": {…}, "<widgetId>": {…} } }.
  blocks: {},
  // Internal: bumped by the “clear cache” action, never edited by hand.
  cache: {
    version: 0
  }
};

const GROUPS = Object.keys(DEFAULT_CONTENT);

/** Deep clone that only handles JSON-safe data (this content is JSON). */
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/** Merge a stored override on top of a default, group by group. */
function deepMerge(base, override) {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? clone(override) : clone(base);
  }
  if (base && typeof base === 'object') {
    const out = clone(base);
    if (override && typeof override === 'object' && !Array.isArray(override)) {
      for (const key of Object.keys(override)) {
        out[key] = key in base ? deepMerge(base[key], override[key]) : clone(override[key]);
      }
    }
    return out;
  }
  return override === undefined || override === null ? base : override;
}

/** Coerce a stored group so a bad value never breaks the public site. */
function normalizeGroup(group, value) {
  const defaults = DEFAULT_CONTENT[group];
  if (!defaults) return clone(value);
  if (!value || typeof value !== 'object') return clone(defaults);
  return deepMerge(defaults, value);
}

module.exports = { DEFAULT_CONTENT, GROUPS, clone, deepMerge, normalizeGroup };
