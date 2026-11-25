/**
 * No Plan Studio — Admin panel (vanilla JS, no build step).
 *
 * Governs: top menu, hero, projects (with per-project images), footer,
 * colors, typography and sizes. Authentication uses the ADMIN_TOKEN.
 */

(function () {
  'use strict';

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');

  const state = {
    content: null,
    tab: 'apariencia',
    projectId: null
  };

  const FONT_PRESETS = [
    { value: "'custom_66210','Mabry',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", label: 'Mabry (original)' },
    { value: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", label: 'Sistema' },
    { value: "Georgia,'Times New Roman',serif", label: 'Georgia (serif)' },
    { value: "'Helvetica Neue',Helvetica,Arial,sans-serif", label: 'Helvetica' },
    { value: "'Courier New',monospace", label: 'Monoespaciada' }
  ];

  /* ── utils ──────────────────────────────────────────────── */

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(message, type) {
    toastEl.textContent = message;
    toastEl.className = `toast show ${type || ''}`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toastEl.className = 'toast'; }, 3200);
  }

  async function api(method, path, body) {
    const options = { method, credentials: 'same-origin' };
    if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  async function uploadFile(file) {
    const response = await fetch(`/api/upload?name=${encodeURIComponent(file.name)}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Fallo al subir');
    return data.url;
  }

  const val = id => {
    const node = document.getElementById(id);
    return node ? node.value : '';
  };
  const num = id => Number(val(id)) || 0;
  const checked = id => {
    const node = document.getElementById(id);
    return node ? node.checked : false;
  };

  /* ── field builders ─────────────────────────────────────── */

  function textField(id, label, value, type = 'text', hint = '') {
    return `<div class="field">
      <label for="${id}">${esc(label)}</label>
      <input id="${id}" type="${type}" value="${esc(value)}">
      ${hint ? `<span class="hint">${esc(hint)}</span>` : ''}
    </div>`;
  }

  function colorField(id, label, value) {
    const safe = /^#[0-9a-f]{3,8}$/i.test(value || '') ? value : '#000000';
    return `<div class="field">
      <label for="${id}">${esc(label)}</label>
      <div class="color-row">
        <input type="color" value="${esc(safe)}" data-sync-color="${id}">
        <input id="${id}" type="text" value="${esc(value)}">
      </div>
    </div>`;
  }

  function checkField(id, label, value) {
    return `<div class="check">
      <input id="${id}" type="checkbox" ${value ? 'checked' : ''}>
      <label for="${id}">${esc(label)}</label>
    </div>`;
  }

  function fontField(id, label, value) {
    const options = FONT_PRESETS
      .map(preset => `<option value="${esc(preset.value)}" ${preset.value === value ? 'selected' : ''}>${esc(preset.label)}</option>`)
      .join('');
    return `<div class="field">
      <label for="${id}">${esc(label)}</label>
      <input id="${id}" type="text" list="${id}-presets" value="${esc(value)}">
      <datalist id="${id}-presets">${options}</datalist>
      <span class="hint">Puedes escribir cualquier stack CSS de fuentes.</span>
    </div>`;
  }

  /* ── login ──────────────────────────────────────────────── */

  function renderLogin(message) {
    app.className = '';
    app.innerHTML = `
      <div class="login">
        <form class="login-card" id="login-form">
          <h1>Panel Terán Studio</h1>
          <p>Introduce el token de acceso configurado en <code>.env</code> (ADMIN_TOKEN).</p>
          ${message ? `<p style="color:var(--accent)">${esc(message)}</p>` : ''}
          <div class="field">
            <label for="token">Token de acceso</label>
            <input id="token" type="password" autocomplete="current-password" autofocus>
          </div>
          <button class="btn primary" type="submit" style="width:100%;justify-content:center">Entrar</button>
        </form>
      </div>`;
  }

  /* ── shell ──────────────────────────────────────────────── */

  const TABS = [
    { id: 'sitio', label: 'Sitio' },
    { id: 'apariencia', label: 'Colores y tipografía' },
    { id: 'menu', label: 'Menú superior' },
    { id: 'hero', label: 'Hero' },
    { id: 'proyectos', label: 'Proyectos' },
    { id: 'footer', label: 'Footer' }
  ];

  function renderShell(body) {
    app.className = '';
    app.innerHTML = `
      <div class="shell">
        <aside class="sidebar">
          <div class="brand">
            <strong>Terán Studio</strong>
            <span>Panel de control</span>
          </div>
          ${TABS.map(tab => `
            <button class="tab ${state.tab === tab.id ? 'active' : ''}" data-tab="${tab.id}">${esc(tab.label)}</button>
          `).join('')}
          <div class="sidebar-foot">
            <a class="tab" href="/index.html" target="_blank" rel="noopener">Ver sitio ↗</a>
            <button class="tab" data-logout>Salir</button>
          </div>
        </aside>
        <main class="main" id="main">${body}</main>
      </div>`;
  }

  function main() {
    return document.getElementById('main');
  }

  /* ── tab: sitio ─────────────────────────────────────────── */

  function assetUrl(value) {
    if (!value) return '';
    if (/^https?:|^\/|^data:/i.test(value)) return value;
    return `/${value}`;
  }

  function renderSitio() {
    const site = state.content.site || {};
    const cache = state.content.cacheVersion || 0;

    return `
      <div class="page-head">
        <h2>Sitio</h2>
        <p>Identidad global: logotipo, favicon, título y descripción.</p>
      </div>

      <div class="card">
        <h3>Título y descripción</h3>
        <div class="grid">
          <div style="grid-column:1/-1">${textField('site-title', 'Título del sitio (pestaña)', site.title)}</div>
          <div style="grid-column:1/-1">
            <div class="field">
              <label for="site-description">Descripción (meta description)</label>
              <textarea id="site-description">${esc(site.description)}</textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Logotipo</h3>
        <div class="field">
          <label for="site-logo">Archivo del logotipo</label>
          <div class="image-src-row">
            <input id="site-logo" type="text" value="${esc(site.logo)}" placeholder="Vacío = usar el texto del menú">
            <label class="btn small" style="cursor:pointer">Subir
              <input type="file" accept="image/*" data-upload-field="site-logo" hidden>
            </label>
          </div>
          <span class="hint">Si hay logotipo, sustituye al texto del menú superior.</span>
        </div>
        <div class="grid">
          ${textField('site-logoAlt', 'Texto alternativo', site.logoAlt)}
          ${textField('site-logoHeight', 'Alto (px)', site.logoHeight, 'number')}
        </div>
        <div class="preview-box"><img data-preview="site-logo" src="${esc(assetUrl(site.logo))}" alt="" ${site.logo ? '' : 'hidden'}></div>
      </div>

      <div class="card">
        <h3>Favicon</h3>
        <div class="field">
          <label for="site-favicon">Archivo del favicon</label>
          <div class="image-src-row">
            <input id="site-favicon" type="text" value="${esc(site.favicon)}">
            <label class="btn small" style="cursor:pointer">Subir
              <input type="file" accept="image/*" data-upload-field="site-favicon" hidden>
            </label>
          </div>
        </div>
        <div class="preview-box preview-box-sm"><img data-preview="site-favicon" src="${esc(assetUrl(site.favicon))}" alt="" ${site.favicon ? '' : 'hidden'}></div>
      </div>

      <div class="btn-row"><button class="btn primary" data-save="sitio">Guardar identidad</button></div>

      <div class="card">
        <h3>Caché</h3>
        <p class="hint" style="margin-top:-8px">
          Fuerza a los navegadores a descargar de nuevo los archivos (HTML, CSS, JS e imágenes)
          incrementando la versión de caché.
        </p>
        <div class="btn-row">
          <button class="btn danger" data-clear-cache>Borrar caché</button>
          <span class="hint" style="align-self:center">Versión actual: <strong id="cache-version">${cache}</strong></span>
        </div>
      </div>`;
  }

  /* ── tab: apariencia ────────────────────────────────────── */

  function renderApariencia() {
    const theme = state.content.theme;
    const sizes = state.content.sizes;

    return `
      <div class="page-head">
        <h2>Colores y tipografía</h2>
        <p>Tokens globales del sitio: paleta, fuentes y tamaños.</p>
      </div>

      <div class="card">
        <h3>Colores</h3>
        <div class="grid">
          ${colorField('theme-bg', 'Fondo', theme.bg)}
          ${colorField('theme-bgDark', 'Fondo oscuro', theme.bgDark)}
          ${colorField('theme-ink', 'Tinta principal', theme.ink)}
          ${colorField('theme-inkMuted', 'Tinta secundaria', theme.inkMuted)}
          ${colorField('theme-inkFaint', 'Tinta tenue', theme.inkFaint)}
          ${colorField('theme-accent', 'Acento', theme.accent)}
          ${colorField('theme-border', 'Borde', theme.border)}
        </div>
      </div>

      <div class="card">
        <h3>Tipografía</h3>
        <div class="grid">
          <div style="grid-column:1/-1">${fontField('theme-fontFamily', 'Familia tipográfica', theme.fontFamily)}</div>
          ${textField('theme-baseFontSize', 'Tamaño base (px)', theme.baseFontSize, 'number')}
          ${textField('theme-navFontSize', 'Tamaño del menú (px)', theme.navFontSize, 'number')}
          ${textField('theme-sectionTitleSize', 'Título de sección (px)', theme.sectionTitleSize, 'number')}
          ${textField('theme-letterSpacing', 'Interletraje (em)', theme.letterSpacing, 'number')}
          ${textField('theme-lineHeight', 'Altura de línea', theme.lineHeight, 'number')}
        </div>
      </div>

      <div class="card">
        <h3>Tamaños y espaciado</h3>
        <div class="grid">
          ${textField('sizes-navHeight', 'Alto del menú (px)', sizes.navHeight, 'number')}
          ${textField('sizes-navPad', 'Espaciador del menú (px)', sizes.navPad, 'number', 'Aire arriba y abajo del logo y los botones.')}
          ${textField('sizes-embedsTravel', 'Parallax — recorrido (px, 0 = auto)', sizes.embedsTravel, 'number')}
          ${textField('sizes-embedsOverlap', 'Parallax — solape (px, 0 = auto)', sizes.embedsOverlap, 'number')}
          ${textField('sizes-sectionPadding', 'Relleno de sección (px)', sizes.sectionPadding, 'number')}
          ${textField('sizes-heroMinHeight', 'Alto mínimo del hero (px)', sizes.heroMinHeight, 'number')}
        </div>
      </div>

      <div class="btn-row">
        <button class="btn primary" data-save="apariencia">Guardar cambios</button>
      </div>`;
  }

  /* ── tab: menu ──────────────────────────────────────────── */

  function renderMenu() {
    const nav = state.content.nav;
    const links = (nav.links || []).map((link, index) => `
      <div class="list-item" data-link="${index}">
        <span class="meta"><strong>${esc(link.label || 'Enlace')}</strong><span>${esc(link.action || 'link')}</span></span>
        <div class="grid" style="grid-column:2">
          <div class="field" style="margin:0">
            <label>Texto</label>
            <input type="text" data-link-label value="${esc(link.label)}">
          </div>
          <div class="field" style="margin:0">
            <label>Acción</label>
            <select data-link-action>
              <option value="link" ${link.action === 'link' ? 'selected' : ''}>Enlace interno</option>
              <option value="external" ${link.action === 'external' ? 'selected' : ''}>Enlace externo</option>
              <option value="drawer" ${link.action === 'drawer' ? 'selected' : ''}>Abrir índice</option>
            </select>
          </div>
          <div class="field" style="margin:0;grid-column:1/-1">
            <label>Destino (href)</label>
            <input type="text" data-link-href value="${esc(link.href)}">
          </div>
        </div>
        <div class="row-actions">
          <button class="icon-btn" data-link-up title="Subir">↑</button>
          <button class="icon-btn" data-link-down title="Bajar">↓</button>
          <button class="icon-btn" data-link-remove title="Eliminar">✕</button>
        </div>
      </div>`).join('');

    return `
      <div class="page-head">
        <h2>Menú superior</h2>
        <p>Logotipo y enlaces de la barra fija.</p>
      </div>

      <div class="card">
        <h3>Logotipo</h3>
        <div class="grid">
          ${textField('nav-logoText', 'Texto del logo', nav.logoText)}
          ${textField('nav-logoHref', 'Enlace del logo', nav.logoHref)}
        </div>
      </div>

      <div class="card">
        <h3>Enlaces</h3>
        <div class="list" id="nav-links">${links || '<div class="empty">Sin enlaces</div>'}</div>
        <div class="btn-row"><button class="btn small" data-add-link>+ Añadir enlace</button></div>
      </div>

      <div class="btn-row"><button class="btn primary" data-save="menu">Guardar menú</button></div>`;
  }

  /* ── tab: hero ──────────────────────────────────────────── */

  function renderHero() {
    const hero = state.content.hero;
    const heroImages = hero.images || {};
    const canvasBg = state.content.canvasBg || {};
    return `
      <div class="page-head">
        <h2>Hero</h2>
        <p>Bloque principal y cinta animada de portada.</p>
      </div>

      <div class="card">
        <h3>Bloque de portada</h3>
        ${checkField('hero-enabled', 'Mostrar bloque de hero sobre el lienzo', hero.enabled)}
        <div class="grid">
          ${textField('hero-title', 'Título', hero.title)}
          ${textField('hero-accentWord', 'Palabra destacada (2.ª línea)', hero.accentWord, 'text', 'Se muestra en cursiva con el color de acento.')}
          <div style="grid-column:1/-1">
            <div class="field">
              <label for="hero-subtitle">Subtítulo</label>
              <textarea id="hero-subtitle">${esc(hero.subtitle)}</textarea>
            </div>
          </div>
          ${textField('hero-ctaLabel', 'Texto del botón', hero.ctaLabel)}
          ${textField('hero-ctaHref', 'Enlace del botón', hero.ctaHref)}
          ${textField('hero-ctaGhostLabel', 'Texto del enlace secundario', hero.ctaGhostLabel)}
          ${textField('hero-ctaGhostHref', 'Enlace secundario', hero.ctaGhostHref)}
          <div style="grid-column:1/-1">${textField('hero-chips', 'Etiquetas (separadas por comas)', (hero.chips || []).join(', '), 'text', 'Se muestran como chips bajo el subtítulo.')}</div>
        </div>
      </div>

      <div class="card">
        <h3>Cinta animada</h3>
        <div class="grid">
          <div style="grid-column:1/-1">${textField('hero-marqueeText', 'Texto de la cinta', hero.marqueeText, 'text', 'Se repite automáticamente en bucle.')}</div>
        </div>
        ${checkField('hero-showStamps', 'Mostrar sellos animados del lienzo', hero.showStamps)}
      </div>

      <div class="card">
        <h3>Composición visual</h3>
        <p class="hint" style="margin-top:-8px;margin-bottom:16px">Fotografías en capas del hero: principal y detalle pequeño.</p>
        <h4>Foto principal</h4>
        <div class="grid">
          <div style="grid-column:1/-1" class="field">
            <label for="hero-main-src">Imagen principal</label>
            <div class="image-src-row">
              <input id="hero-main-src" type="text" value="${esc(heroImages.main && heroImages.main.src)}" placeholder="assets/uploads/… o URL">
              <label class="btn small" style="cursor:pointer">Subir
                <input type="file" accept="image/*" data-upload-field="hero-main-src" hidden>
              </label>
            </div>
          </div>
          ${textField('hero-main-alt', 'Texto alternativo', heroImages.main && heroImages.main.alt)}
          ${textField('hero-main-caption', 'Pie de foto', heroImages.main && heroImages.main.caption)}
          <div class="preview-box" style="grid-column:1/-1"><img data-preview="hero-main-src" src="${esc(assetUrl(heroImages.main && heroImages.main.src))}" alt="" ${heroImages.main && heroImages.main.src ? '' : 'hidden'}></div>
        </div>
        <h4>Detalle (imagen pequeña)</h4>
        <div class="grid">
          <div style="grid-column:1/-1" class="field">
            <label for="hero-small-src">Imagen pequeña</label>
            <div class="image-src-row">
              <input id="hero-small-src" type="text" value="${esc(heroImages.small && heroImages.small.src)}" placeholder="assets/uploads/… o URL">
              <label class="btn small" style="cursor:pointer">Subir
                <input type="file" accept="image/*" data-upload-field="hero-small-src" hidden>
              </label>
            </div>
          </div>
          ${textField('hero-small-alt', 'Texto alternativo', heroImages.small && heroImages.small.alt)}
          ${textField('hero-small-caption', 'Pie de foto', heroImages.small && heroImages.small.caption)}
          <div class="preview-box" style="grid-column:1/-1"><img data-preview="hero-small-src" src="${esc(assetUrl(heroImages.small && heroImages.small.src))}" alt="" ${heroImages.small && heroImages.small.src ? '' : 'hidden'}></div>
        </div>
        <div class="grid" style="grid-column:1/-1;margin-top:8px">
          ${textField('hero-badgeText', 'Texto del anillo giratorio', hero.badgeText)}
          ${textField('hero-glassText', 'Etiqueta sobre la foto', hero.glassText, 'text', 'p. ej. est. 2016')}
        </div>
      </div>

      <div class="card">
        <h3>Fondo del hero</h3>
        <p class="hint" style="margin-top:-8px;margin-bottom:16px">
          Afecta solo a la portada (el lienzo con los sellos y la cinta), no a los proyectos.
        </p>
        <div class="field">
          <label for="hero-bgType">Tipo de fondo</label>
          <select id="hero-bgType">
            <option value="" ${!hero.bgType ? 'selected' : ''}>Original (sin cambios)</option>
            <option value="color" ${hero.bgType === 'color' ? 'selected' : ''}>Color</option>
            <option value="image" ${hero.bgType === 'image' ? 'selected' : ''}>Imagen</option>
          </select>
        </div>
        ${colorField('hero-bgColor', 'Color de fondo', hero.bgColor)}
        <div class="field">
          <label for="hero-bgImage">Imagen de fondo</label>
          <div class="image-src-row">
            <input id="hero-bgImage" type="text" value="${esc(hero.bgImage)}" placeholder="assets/uploads/… o URL">
            <label class="btn small" style="cursor:pointer">Subir
              <input type="file" accept="image/*" data-upload-field="hero-bgImage" hidden>
            </label>
          </div>
        </div>
        <div class="grid">
          <div class="field">
            <label for="hero-bgSize">Ajuste de la imagen</label>
            <select id="hero-bgSize">
              <option value="cover" ${hero.bgSize === 'cover' ? 'selected' : ''}>Cubrir (cover)</option>
              <option value="contain" ${hero.bgSize === 'contain' ? 'selected' : ''}>Contener (contain)</option>
              <option value="auto" ${hero.bgSize === 'auto' ? 'selected' : ''}>Tamaño original</option>
            </select>
          </div>
          ${textField('hero-bgPosition', 'Posición', hero.bgPosition, 'text', 'p. ej. center, top, 50% 30%')}
        </div>
        <div class="preview-box"><img data-preview="hero-bgImage" src="${esc(assetUrl(hero.bgImage))}" alt="" ${hero.bgImage ? '' : 'hidden'}></div>
      </div>

      <div class="card">
        <h3>Fondo del lienzo (page-fixed-bg-container)</h3>
        <p class="hint" style="margin-top:-8px;margin-bottom:16px">El fondo fijo que va justo después del hero, debajo de los sellos y la cinta.</p>
        ${checkField('canvasBg-enabled', 'Mostrar el bloque de fondo del lienzo', canvasBg.enabled)}
        <div class="grid">
          ${colorField('canvasBg-color', 'Color de fondo', canvasBg.color)}
          ${textField('canvasBg-opacity', 'Opacidad del bloque (%)', canvasBg.opacity, 'number', '0 – 100')}
          <div style="grid-column:1/-1" class="field">
            <label for="canvasBg-image">Imagen de fondo</label>
            <div class="image-src-row">
              <input id="canvasBg-image" type="text" value="${esc(canvasBg.image)}" placeholder="assets/uploads/… o URL">
              <label class="btn small" style="cursor:pointer">Subir
                <input type="file" accept="image/*" data-upload-field="canvasBg-image" hidden>
              </label>
            </div>
          </div>
          <div class="field">
            <label for="canvasBg-imageSize">Ajuste de la imagen</label>
            <select id="canvasBg-imageSize">
              <option value="cover" ${canvasBg.imageSize === 'cover' ? 'selected' : ''}>Cubrir (cover)</option>
              <option value="contain" ${canvasBg.imageSize === 'contain' ? 'selected' : ''}>Contener (contain)</option>
              <option value="auto" ${canvasBg.imageSize === 'auto' ? 'selected' : ''}>Tamaño original</option>
            </select>
          </div>
          ${textField('canvasBg-imagePosition', 'Posición', canvasBg.imagePosition, 'text', 'p. ej. center, top, 50% 30%')}
        </div>
        <div class="preview-box"><img data-preview="canvasBg-image" src="${esc(assetUrl(canvasBg.image))}" alt="" ${canvasBg.image ? '' : 'hidden'}></div>
        <div class="btn-row"><button class="btn primary" data-save="canvasBg">Guardar fondo del lienzo</button></div>
      </div>

      <div class="btn-row"><button class="btn primary" data-save="hero">Guardar hero</button></div>`;
  }

  /* ── tab: footer ────────────────────────────────────────── */

  function renderFooter() {
    const footer = state.content.footer;

    const columns = (footer.columns || []).map((column, ci) => `
      <div class="list-item" data-column="${ci}" style="display:block">
        <div class="field">
          <label>Título de columna</label>
          <input type="text" data-column-title value="${esc(column.title)}">
        </div>
        <div class="list">
          ${(column.links || []).map((link, li) => `
            <div class="image-src-row" data-column-link="${li}">
              <input type="text" data-column-link-label value="${esc(link.label)}" placeholder="Texto">
              <input type="text" data-column-link-href value="${esc(link.href)}" placeholder="href">
              <button class="icon-btn" data-column-link-remove title="Eliminar">✕</button>
            </div>`).join('')}
        </div>
        <div class="btn-row">
          <button class="btn small" data-column-add-link>+ Enlace</button>
          <button class="btn small danger" data-column-remove>Eliminar columna</button>
        </div>
      </div>`).join('');

    const social = (footer.social || []).map((link, index) => `
      <div class="image-src-row" data-social="${index}">
        <input type="text" data-social-label value="${esc(link.label)}" placeholder="Red">
        <input type="text" data-social-href value="${esc(link.href)}" placeholder="href">
        <button class="icon-btn" data-social-remove title="Eliminar">✕</button>
      </div>`).join('');

    return `
      <div class="page-head">
        <h2>Footer</h2>
        <p>Pie de página, columnas de enlaces y distintivo flotante.</p>
      </div>

      <div class="card">
        <h3>General</h3>
        ${checkField('footer-enabled', 'Mostrar footer', footer.enabled)}
        <div class="grid">
          ${textField('footer-brand', 'Marca', footer.brand)}
          ${textField('footer-tagline', 'Lema', footer.tagline)}
          <div style="grid-column:1/-1">${textField('footer-copyright', 'Copyright', footer.copyright)}</div>
        </div>
      </div>

      <div class="card">
        <h3>Columnas</h3>
        <div class="list" id="footer-columns">${columns || '<div class="empty">Sin columnas</div>'}</div>
        <div class="btn-row"><button class="btn small" data-add-column>+ Añadir columna</button></div>
      </div>

      <div class="card">
        <h3>Redes sociales</h3>
        <div class="list" id="footer-social">${social || '<div class="empty">Sin redes</div>'}</div>
        <div class="btn-row"><button class="btn small" data-add-social>+ Añadir red</button></div>
      </div>

      <div class="card">
        <h3>Distintivo flotante</h3>
        <div class="grid">
          ${textField('footer-badgeText', 'Texto', footer.badgeText)}
          ${colorField('footer-badgeDot', 'Color del punto', footer.badgeDot)}
        </div>
      </div>

      <div class="btn-row"><button class="btn primary" data-save="footer">Guardar footer</button></div>`;
  }

  /* ── tab: proyectos ─────────────────────────────────────── */

  function currentProject() {
    return state.content.projects.find(project => project.id === state.projectId) || null;
  }

  function renderProyectos() {
    const projects = state.content.projects;
    if (!state.projectId && projects.length) state.projectId = projects[0].id;
    const project = currentProject();
    const ps = state.content.projectsSection || {};

    const chips = projects.map(item => `
      <button class="chip ${item.id === state.projectId ? 'active' : ''} ${item.enabled ? '' : 'off'}" data-project="${item.id}">
        ${esc(item.title)}${item.inStack ? '' : ' ·página'}${item.enabled ? '' : ' · borrador'}
      </button>`).join('');

    if (!project) {
      return `<div class="page-head"><h2>Proyectos</h2></div><div class="empty">No hay proyectos.</div>`;
    }

    const images = (project.images || []).map((image, index) => `
      <div class="image-item" data-image="${image.id}" data-position="${esc(JSON.stringify(image.position || {}))}">
        <img class="image-thumb" src="/${esc(image.src)}" alt="" loading="lazy">
        <div class="image-fields">
          <div class="image-src-row">
            <input type="text" data-image-src value="${esc(image.src)}">
            <label class="btn small" style="cursor:pointer">
              Subir
              <input type="file" accept="image/*" data-image-upload hidden>
            </label>
          </div>
          <input type="text" data-image-alt value="${esc(image.alt)}" placeholder="Texto alternativo (alt)">
          <input type="text" data-image-caption value="${esc(image.caption)}" placeholder="Pie de imagen (opcional)">
          <div class="image-pos-row">
            <label class="pos-field"><span>X (left)</span><input type="text" data-image-left value="${esc(image.position.left || '')}" placeholder="50%"></label>
            <label class="pos-field"><span>Y (top)</span><input type="text" data-image-top value="${esc(image.position.top || '')}" placeholder="120px"></label>
            <label class="pos-field"><span>Ancho</span><input type="text" data-image-width value="${esc(image.position.width || '')}" placeholder="133px"></label>
            <label class="pos-field"><span>Alto</span><input type="text" data-image-height value="${esc(image.position.height || '')}" placeholder="133px"></label>
          </div>
          <span class="hint">
            Posición en <code>px</code> o <code>%</code>. Déjalo vacío para mantener el valor original.
            ${image.position.chrome ? '<span class="image-badge">chrome</span>' : ''}
          </span>
        </div>
        <div class="row-actions">
          <button class="icon-btn" data-image-up ${index === 0 ? 'disabled' : ''} title="Subir">↑</button>
          <button class="icon-btn" data-image-down ${index === (project.images.length - 1) ? 'disabled' : ''} title="Bajar">↓</button>
          <button class="icon-btn" data-image-remove title="Eliminar">✕</button>
        </div>
      </div>`).join('');

    return `
      <div class="page-head">
        <h2>Proyectos</h2>
        <p>Edita el bloque de sección que sigue al hero, cada proyecto y sus imágenes.</p>
      </div>

      <div class="card">
        <h3>Cabecera de la sección (bloque tras el hero)</h3>
        <p class="hint" style="margin-top:-8px;margin-bottom:16px">Activa o desactiva el bloque completo de proyectos y ajusta sus textos y colores.</p>
        ${checkField('ps-enabled', 'Mostrar la sección de proyectos', ps.enabled)}
        <div class="grid">
          ${textField('ps-kicker', 'Antetítulo', ps.kicker)}
          ${textField('ps-title', 'Título', ps.title)}
          <div style="grid-column:1/-1">
            <div class="field">
              <label for="ps-note">Nota</label>
              <textarea id="ps-note">${esc(ps.note)}</textarea>
            </div>
          </div>
        </div>
        <div class="grid">
          ${colorField('ps-bg', 'Fondo', ps.bg)}
          ${colorField('ps-ink', 'Color del título', ps.ink)}
          ${colorField('ps-muted', 'Color textos secundarios', ps.muted)}
          ${colorField('ps-accent', 'Color de acento', ps.accent)}
          ${colorField('ps-border', 'Borde superior', ps.border)}
        </div>
        <p class="hint" style="margin-top:-6px;margin-bottom:0">Vacío = usa los colores globales de “Colores y tipografía”.</p>
        <div class="btn-row"><button class="btn primary" data-save="projectsSection">Guardar cabecera</button></div>
      </div>

      <div class="project-picker">${chips}</div>

      <div class="card">
        <h3>Datos del proyecto</h3>
        <div class="grid">
          ${textField('project-title', 'Título', project.title)}
          ${textField('project-subtitle', 'Categoría', project.subtitle)}
          ${colorField('project-color', 'Color de fondo', project.color)}
          ${textField('project-slug', 'Slug', project.slug)}
          ${textField('project-page', 'Archivo (página)', project.page)}
          ${textField('project-pageHeight', 'Alto de página (px)', project.pageHeight, 'number')}
        </div>
        ${checkField('project-inStack', 'Incluir en la pila del inicio', project.inStack)}
        <div class="field">
          <label for="project-status">Estado</label>
          <select id="project-status">
            <option value="1" ${project.enabled ? 'selected' : ''}>Publicado — visible en el sitio</option>
            <option value="0" ${project.enabled ? '' : 'selected'}>Borrador — oculto</option>
          </select>
          <span class="hint">Los borradores no salen en el inicio ni en el índice, y su página responde 404.</span>
        </div>
        <div class="btn-row">
          <button class="btn primary" data-save="project">Guardar proyecto</button>
          <button class="btn" data-project-up>↑ Subir en el orden</button>
          <button class="btn" data-project-down>↓ Bajar en el orden</button>
          <button class="btn danger" data-project-delete>Eliminar proyecto</button>
        </div>
      </div>

      <div class="card">
        <h3>Barra inferior del proyecto</h3>
        <p class="hint" style="margin-top:-8px;margin-bottom:16px">
          Es la franja que aparece al final del scroll de esta página: el nombre repetido a la
          izquierda y el botón «+info» a la derecha.
        </p>
        ${checkField('project-showBar', 'Mostrar barra inferior', project.showBar)}
        <div class="grid">
          <div style="grid-column:1/-1">
            ${textField('project-footerTitle', 'Nombre al final (izquierda)', project.footerTitle, 'text', 'Vacío = usa el título del proyecto.')}
          </div>
          ${textField('project-infoLabel', 'Texto del botón (derecha)', project.infoLabel)}
          ${textField('project-infoHref', 'Enlace del botón', project.infoHref, 'text', 'Opcional: página o URL.')}
        </div>
        <div class="btn-row">
          <button class="btn primary" data-save="project">Guardar proyecto</button>
        </div>
      </div>

      <div class="card">
        <h3>Imágenes (${(project.images || []).length})</h3>
        <p class="hint" style="margin-top:-8px;margin-bottom:16px">
          Puedes cambiar el archivo, el <em>alt</em>, el pie y la <strong>posición</strong>.
          Los campos de posición vienen rellenos con el valor original: si no los tocas,
          la imagen se queda exactamente donde está.
        </p>
        <div class="list" id="project-images">${images || '<div class="empty">Sin imágenes</div>'}</div>
        <div class="btn-row">
          <button class="btn small" data-add-image>+ Añadir imagen</button>
        </div>
      </div>`;
  }

  /* ── render dispatcher ──────────────────────────────────── */

  function renderTab() {
    if (!state.content) return;
    const builders = {
      sitio: renderSitio,
      apariencia: renderApariencia,
      menu: renderMenu,
      hero: renderHero,
      proyectos: renderProyectos,
      footer: renderFooter
    };
    main().innerHTML = (builders[state.tab] || renderApariencia)();
  }

  async function reload() {
    // The panel needs drafts too, so it uses the authenticated endpoint.
    state.content = await api('GET', '/api/admin/content');
    renderTab();
  }

  function refreshSidebar() {
    document.querySelectorAll('.tab[data-tab]').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === state.tab);
    });
  }

  /* ── save handlers ──────────────────────────────────────── */

  function collectNav() {
    const links = Array.from(document.querySelectorAll('#nav-links [data-link]')).map(item => ({
      label: item.querySelector('[data-link-label]').value,
      action: item.querySelector('[data-link-action]').value,
      href: item.querySelector('[data-link-href]').value
    }));
    return { logoText: val('nav-logoText'), logoHref: val('nav-logoHref'), links };
  }

  function collectFooter() {
    const columns = Array.from(document.querySelectorAll('#footer-columns [data-column]')).map(column => ({
      title: column.querySelector('[data-column-title]').value,
      links: Array.from(column.querySelectorAll('[data-column-link]')).map(link => ({
        label: link.querySelector('[data-column-link-label]').value,
        href: link.querySelector('[data-column-link-href]').value
      }))
    }));
    const social = Array.from(document.querySelectorAll('#footer-social [data-social]')).map(item => ({
      label: item.querySelector('[data-social-label]').value,
      href: item.querySelector('[data-social-href]').value
    }));
    return {
      enabled: checked('footer-enabled'),
      brand: val('footer-brand'),
      tagline: val('footer-tagline'),
      copyright: val('footer-copyright'),
      badgeText: val('footer-badgeText'),
      badgeDot: val('footer-badgeDot'),
      columns,
      social
    };
  }

  async function save(group) {
    try {
      if (group === 'sitio') {
        await api('PUT', '/api/settings/site', {
          title: val('site-title'),
          description: val('site-description'),
          logo: val('site-logo'),
          logoAlt: val('site-logoAlt'),
          logoHeight: num('site-logoHeight'),
          favicon: val('site-favicon')
        });
      } else if (group === 'apariencia') {
        await api('PUT', '/api/settings/theme', {
          bg: val('theme-bg'),
          bgDark: val('theme-bgDark'),
          ink: val('theme-ink'),
          inkMuted: val('theme-inkMuted'),
          inkFaint: val('theme-inkFaint'),
          accent: val('theme-accent'),
          border: val('theme-border'),
          fontFamily: val('theme-fontFamily'),
          baseFontSize: num('theme-baseFontSize'),
          navFontSize: num('theme-navFontSize'),
          sectionTitleSize: num('theme-sectionTitleSize'),
          letterSpacing: num('theme-letterSpacing'),
          lineHeight: num('theme-lineHeight')
        });
        await api('PUT', '/api/settings/sizes', {
          navHeight: num('sizes-navHeight'),
          navPad: num('sizes-navPad'),
          embedsTravel: num('sizes-embedsTravel'),
          embedsOverlap: num('sizes-embedsOverlap'),
          sectionPadding: num('sizes-sectionPadding'),
          heroMinHeight: num('sizes-heroMinHeight')
        });
      } else if (group === 'menu') {
        await api('PUT', '/api/settings/nav', collectNav());
      } else if (group === 'hero') {
        await api('PUT', '/api/settings/hero', {
          enabled: checked('hero-enabled'),
          title: val('hero-title'),
          accentWord: val('hero-accentWord'),
          subtitle: val('hero-subtitle'),
          ctaLabel: val('hero-ctaLabel'),
          ctaHref: val('hero-ctaHref'),
          ctaGhostLabel: val('hero-ctaGhostLabel'),
          ctaGhostHref: val('hero-ctaGhostHref'),
          chips: String(val('hero-chips')).split(',').map(s => s.trim()).filter(Boolean),
          marqueeText: val('hero-marqueeText'),
          showStamps: checked('hero-showStamps'),
          bgType: val('hero-bgType'),
          bgColor: val('hero-bgColor'),
          bgImage: val('hero-bgImage'),
          bgSize: val('hero-bgSize'),
          bgPosition: val('hero-bgPosition'),
          images: {
            main: {
              src: val('hero-main-src'),
              alt: val('hero-main-alt'),
              caption: val('hero-main-caption')
            },
            small: {
              src: val('hero-small-src'),
              alt: val('hero-small-alt'),
              caption: val('hero-small-caption')
            }
          },
          badgeText: val('hero-badgeText'),
          glassText: val('hero-glassText')
        });
      } else if (group === 'footer') {
        await api('PUT', '/api/settings/footer', collectFooter());
      } else if (group === 'projectsSection') {
        await api('PUT', '/api/settings/projectsSection', {
          enabled: checked('ps-enabled'),
          kicker: val('ps-kicker'),
          title: val('ps-title'),
          note: val('ps-note'),
          bg: val('ps-bg'),
          ink: val('ps-ink'),
          muted: val('ps-muted'),
          accent: val('ps-accent'),
          border: val('ps-border')
        });
      } else if (group === 'canvasBg') {
        await api('PUT', '/api/settings/canvasBg', {
          enabled: checked('canvasBg-enabled'),
          color: val('canvasBg-color'),
          image: val('canvasBg-image'),
          imageSize: val('canvasBg-imageSize'),
          imagePosition: val('canvasBg-imagePosition'),
          opacity: num('canvasBg-opacity')
        });
      } else if (group === 'project') {
        const project = currentProject();
        await api('PUT', `/api/projects/${project.id}`, {
          title: val('project-title'),
          subtitle: val('project-subtitle'),
          color: val('project-color'),
          slug: val('project-slug'),
          page: val('project-page'),
          pageHeight: num('project-pageHeight'),
          inStack: checked('project-inStack'),
          enabled: val('project-status') !== '0',
          showBar: checked('project-showBar'),
          footerTitle: val('project-footerTitle'),
          infoLabel: val('project-infoLabel'),
          infoHref: val('project-infoHref')
        });
      }
      toast('Cambios guardados', 'ok');
      await reload();
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  async function saveImage(imageId, fields) {
    try {
      await api('PUT', `/api/images/${imageId}`, fields);
      toast('Imagen guardada', 'ok');
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  async function reorderImages(project) {
    const ids = project.images.map(image => image.id);
    try {
      await api('PUT', '/api/images/order', { ids });
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  /* ── event delegation ───────────────────────────────────── */

  function moveInArray(array, from, to) {
    if (to < 0 || to >= array.length) return;
    const [item] = array.splice(from, 1);
    array.splice(to, 0, item);
  }

  document.addEventListener('click', async event => {
    const target = event.target.closest('button, a, label');
    if (!target) return;

    /* sidebar */
    const tab = target.closest('[data-tab]');
    if (tab) {
      state.tab = tab.dataset.tab;
      refreshSidebar();
      renderTab();
      return;
    }

    if (target.closest('[data-logout]')) {
      await api('POST', '/api/logout');
      renderLogin();
      return;
    }

    /* cache */
    if (target.closest('[data-clear-cache]')) {
      try {
        const result = await api('POST', '/api/cache/clear');
        state.content.cacheVersion = result.version;
        const label = document.getElementById('cache-version');
        if (label) label.textContent = result.version;
        toast(`Caché borrada · nueva versión ${result.version}`, 'ok');
      } catch (error) {
        toast(error.message, 'error');
      }
      return;
    }

    /* save buttons */
    const saveBtn = target.closest('[data-save]');
    if (saveBtn) {
      saveBtn.disabled = true;
      await save(saveBtn.dataset.save);
      saveBtn.disabled = false;
      return;
    }

    /* nav links */
    if (target.closest('[data-add-link]')) {
      const nav = collectNav();
      nav.links.push({ label: 'Nuevo enlace', action: 'link', href: '' });
      await api('PUT', '/api/settings/nav', nav);
      await reload();
      return;
    }
    const linkItem = target.closest('[data-link]');
    if (linkItem) {
      const index = Number(linkItem.dataset.link);
      const nav = collectNav();
      if (target.closest('[data-link-up]')) moveInArray(nav.links, index, index - 1);
      else if (target.closest('[data-link-down]')) moveInArray(nav.links, index, index + 1);
      else if (target.closest('[data-link-remove]')) nav.links.splice(index, 1);
      else return;
      await api('PUT', '/api/settings/nav', nav);
      await reload();
      return;
    }

    /* footer columns */
    if (target.closest('[data-add-column]')) {
      const footer = collectFooter();
      footer.columns.push({ title: 'Nueva columna', links: [] });
      await api('PUT', '/api/settings/footer', footer);
      await reload();
      return;
    }
    const column = target.closest('[data-column]');
    if (column) {
      const ci = Number(column.dataset.column);
      const footer = collectFooter();
      if (target.closest('[data-column-remove]')) {
        footer.columns.splice(ci, 1);
      } else if (target.closest('[data-column-add-link]')) {
        footer.columns[ci].links.push({ label: 'Enlace', href: '' });
      } else {
        const linkRow = target.closest('[data-column-link]');
        if (linkRow && target.closest('[data-column-link-remove]')) {
          footer.columns[ci].links.splice(Number(linkRow.dataset.columnLink), 1);
        } else return;
      }
      await api('PUT', '/api/settings/footer', footer);
      await reload();
      return;
    }

    /* footer social */
    if (target.closest('[data-add-social]')) {
      const footer = collectFooter();
      footer.social.push({ label: 'Nueva red', href: '' });
      await api('PUT', '/api/settings/footer', footer);
      await reload();
      return;
    }
    const socialItem = target.closest('[data-social]');
    if (socialItem && target.closest('[data-social-remove]')) {
      const footer = collectFooter();
      footer.social.splice(Number(socialItem.dataset.social), 1);
      await api('PUT', '/api/settings/footer', footer);
      await reload();
      return;
    }

    /* projects */
    const chip = target.closest('[data-project]');
    if (chip) {
      state.projectId = Number(chip.dataset.project);
      renderTab();
      return;
    }

    const project = currentProject();
    if (project && target.closest('[data-project-up]')) {
      const ids = state.content.projects.map(item => item.id);
      const index = ids.indexOf(project.id);
      moveInArray(ids, index, index - 1);
      await api('PUT', '/api/projects/order', { ids });
      await reload();
      return;
    }
    if (project && target.closest('[data-project-down]')) {
      const ids = state.content.projects.map(item => item.id);
      const index = ids.indexOf(project.id);
      moveInArray(ids, index, index + 1);
      await api('PUT', '/api/projects/order', { ids });
      await reload();
      return;
    }
    if (project && target.closest('[data-project-delete]')) {
      if (!confirm(`¿Eliminar «${project.title}» y sus imágenes?`)) return;
      await api('DELETE', `/api/projects/${project.id}`);
      state.projectId = null;
      await reload();
      return;
    }

    /* images */
    const imageItem = target.closest('[data-image]');
    if (imageItem && project) {
      const imageId = Number(imageItem.dataset.image);
      const index = project.images.findIndex(image => image.id === imageId);

      if (target.closest('[data-image-up]')) {
        moveInArray(project.images, index, index - 1);
        await reorderImages(project);
        renderTab();
        return;
      }
      if (target.closest('[data-image-down]')) {
        moveInArray(project.images, index, index + 1);
        await reorderImages(project);
        renderTab();
        return;
      }
      if (target.closest('[data-image-remove]')) {
        if (!confirm('¿Eliminar esta imagen del proyecto?')) return;
        await api('DELETE', `/api/images/${imageId}`);
        await reload();
        return;
      }
    }

    if (target.closest('[data-add-image]') && project) {
      const src = prompt('Ruta de la imagen (assets/… o URL). Déjalo vacío para subir un archivo.');
      if (src === null) return;
      let finalSrc = src.trim();
      if (!finalSrc) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
          try {
            finalSrc = await uploadFile(input.files[0]);
            await api('POST', `/api/projects/${project.id}/images`, { src: finalSrc, alt: '' });
            toast('Imagen añadida', 'ok');
            await reload();
          } catch (error) {
            toast(error.message, 'error');
          }
        };
        input.click();
        return;
      }
      await api('POST', `/api/projects/${project.id}/images`, { src: finalSrc, alt: '' });
      await reload();
      return;
    }
  });

  /* image field blur/change persistence */
  document.addEventListener('change', async event => {
    const target = event.target;

    if (target.matches('[data-sync-color]')) {
      const input = document.getElementById(target.dataset.syncColor);
      if (input) input.value = target.value;
      return;
    }

    // Publish / draft switch saves straight away.
    if (target.matches('#project-status')) {
      const project = currentProject();
      if (!project) return;
      try {
        await api('PUT', `/api/projects/${project.id}`, { enabled: target.value === '1' });
        toast(target.value === '1' ? 'Proyecto publicado' : 'Proyecto guardado como borrador', 'ok');
        await reload();
      } catch (error) {
        toast(error.message, 'error');
      }
      return;
    }

    const fieldUpload = target.closest('[data-upload-field]');
    if (fieldUpload && fieldUpload.files && fieldUpload.files[0]) {
      const inputId = fieldUpload.dataset.uploadField;
      try {
        const url = await uploadFile(fieldUpload.files[0]);
        const input = document.getElementById(inputId);
        if (input) input.value = url;
        const preview = document.querySelector(`[data-preview="${inputId}"]`);
        if (preview) {
          preview.src = assetUrl(url);
          preview.hidden = false;
        }
        toast('Archivo subido · pulsa Guardar para aplicar', 'ok');
      } catch (error) {
        toast(error.message, 'error');
      }
      return;
    }

    const upload = target.closest('[data-image-upload]');
    if (upload) {
      const item = upload.closest('[data-image]');
      if (!item || !upload.files[0]) return;
      try {
        const url = await uploadFile(upload.files[0]);
        await saveImage(Number(item.dataset.image), { src: url });
        await reload();
      } catch (error) {
        toast(error.message, 'error');
      }
      return;
    }
  });

  document.addEventListener('blur', async event => {
    const target = event.target;
    const item = target.closest && target.closest('[data-image]');
    if (!item) return;
    if (!target.matches('[data-image-src], [data-image-alt], [data-image-caption], [data-image-left], [data-image-top], [data-image-width], [data-image-height]')) return;

    // Keep the stored metadata (z-index, zoom, chrome flag…) and only
    // replace the editable position values.
    let base = {};
    try { base = JSON.parse(item.dataset.position || '{}'); } catch (_) { base = {}; }

    const fields = {
      src: item.querySelector('[data-image-src]').value,
      alt: item.querySelector('[data-image-alt]').value,
      caption: item.querySelector('[data-image-caption]').value,
      position: {
        ...base,
        left: item.querySelector('[data-image-left]').value,
        top: item.querySelector('[data-image-top]').value,
        width: item.querySelector('[data-image-width]').value,
        height: item.querySelector('[data-image-height]').value
      }
    };
    await saveImage(Number(item.dataset.image), fields);
    const thumb = item.querySelector('.image-thumb');
    if (thumb) thumb.src = '/' + fields.src;
  }, true);

  /* ── login submit ───────────────────────────────────────── */

  document.addEventListener('submit', async event => {
    if (event.target.id !== 'login-form') return;
    event.preventDefault();
    const token = document.getElementById('token').value.trim();
    try {
      await api('POST', '/api/login', { token });
      await boot();
    } catch (error) {
      renderLogin(error.message);
    }
  });

  /* ── boot ───────────────────────────────────────────────── */

  async function boot() {
    try {
      const session = await api('GET', '/api/session');
      if (!session.authenticated) {
        renderLogin();
        return;
      }
      state.content = await api('GET', '/api/admin/content');

      // Mirror the site favicon in the panel tab.
      const favicon = state.content.site && state.content.site.favicon;
      if (favicon) {
        const link = document.querySelector('link[rel~="icon"]');
        if (link) link.setAttribute('href', assetUrl(favicon));
      }

      renderShell('');
      renderTab();
    } catch (error) {
      renderLogin(error.message);
    }
  }

  boot();
})();
