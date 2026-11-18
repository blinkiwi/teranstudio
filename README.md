# No Plan Studio — Clon Demostrativo de Alta Fidelidad

Este proyecto es un clon demostrativo e interactivo del sitio web oficial de **[No Plan Studio](https://noplan.studio/)** (Takoma Park, MD), enfocado en preservar con máxima fidelidad sus estilos, colores característicos, tipografía artesanal, animaciones e interconexión fluida de páginas y casos de estudio internos.

---

## 🎨 Características Implementadas

1. **Estilos, Paleta y Atmósfera:**
   - Color base distintivo: Tono crema papel de imprenta artesanal (`#f2eddf`).
   - Tipografía auténtica: Fuente **Mabry** (`custom_66210`), descargada e integrada localmente en `assets/fonts/mabry.ttf`.
   - Elementos visuales letterpress, bordes y acabados tipográficos originales.

2. **Imágenes y Multimedia 100% Locales:**
   - 152 recursos gráficos, fotografías de casos de estudio, stickers, logotipos e ilustraciones descargados en `assets/images/` (~42 MB).
   - Sin dependencias de CDNs externas para que funcione completamente offline.

3. **Efectos e Interactividad:**
   - **Giro de Sellos y Badges (1080°):** Efecto de rotación suave con aceleración *ease-in-out* al pasar el cursor sobre los sellos, stickers y gráficos.
   - **Cinta / Ribbon animado:** Desplazamiento horizontal continuo en portada (*"Design & Art Studio..."*).
   - **Cursor de imprenta interactivo:** Puntero circular que reacciona e interactúa con elementos clickeables y sellos.
   - **Auto-escalado responsivo:** Adaptación dinámica proporcional para pantallas desktop, laptops, tablets y móviles.
   - **Botón flotante "Volver arriba":** Con transición de opacidad y desplazamiento suave.

4. **Estructura Completa de Páginas y Vinculaciones:**
   Todas las páginas internas están interconectadas mediante enlaces relativos locales y accesibles desde el menú desplegable del estudio:

   - **[Inicio / Portada](index.html)** (`index.html`) — Visión general con collage de proyectos y sellos animados.
   - **[Lost Sock Roasters](lost-sock.html)** (`lost-sock.html`) — Identidad y branding para cafetería y tostador de café en Washington, DC.
   - **[Motorkat](motorkat.html)** (`motorkat.html`) — Parrilla a leña, bar de mariscos y restaurante temático.
   - **[Zinnia](zinnia.html)** (`zinnia.html`) — Concepto multi-restaurante en la icónica Mrs. K's Tollhouse.
   - **[People’s Book](peoples-book.html)** (`peoples-book.html`) — Identidad visual para librería local en Takoma Park.
   - **[SOKO](soko.html)** (`soko.html`) — Carnicería y deli tradicional "old-school".
   - **[Indigro](indigro.html)** (`indigro.html`) — Tienda de plantas de interior boutique.
   - **[Goodnight Shiva](atlantic-rhythms-1.html)** (`atlantic-rhythms-1.html`) — Diseño de cassette J-Card para sello Atlantic Rhythms.
   - **[Miru Mira](atlantic-rhythms-2.html)** (`atlantic-rhythms-2.html`) — Diseño de cassette y portada artística.
   - **[No Way](no-way.html)** (`no-way.html`) — Mural a gran escala de 2.100 pies cuadrados en Metropolitan Branch Trail (NoMa).
   - **[ABCDC](abcdc.html)** (`abcdc.html`) — Escultura de cerezo para el National Cherry Blossom Festival.
   - **[About](about.html)** (`about.html`) — Manifiesto, biografía, filosofía y equipo del estudio.
   - **[Contact](contact.html)** (`contact.html`) — Formulario y enlaces de contacto directo.

5. **Navegación Mejorada:**
   - **Barra de navegación general fija y transparente:** Con acceso al logo (inicio), Proyectos, About, Shop y Contact. Permanece sin fondo sólido al hacer scroll y adapta su tinta (clara u oscura) según el color de la página que pasa por debajo.
   - **Menú cajón (Drawer) de proyectos:** Despliegue interactivo con la lista completa de proyectos numerados y categorías.
   - **Paginador inferior en casos de estudio:** Navegación secuencial (`← Proyecto Anterior | Índice | Siguiente Proyecto →`).
   - **Sin menús duplicados:** El hero y todas las páginas (incrustadas o abiertas por separado) ocultan su menú original (logo, About, Shop, Contact, Projects e iconos superiores); toda la navegación queda en la barra general, que ocupa el ancho completo con un margen lateral fluido.
   - **Menú original eliminado del marcado:** los widgets del menú original del lienzo Readymag (logo, About/Proyectos/Shop/Contact e iconos de la franja superior) se han **borrado** del HTML —no solo ocultado—, de modo que no queda ninguna capa tapada debajo ni parpadeo al cargar.

6. **Stack de Proyectos con Parallax (index.html):**
   - Debajo del hero se incrustan, en orden, las diez páginas de proyecto mediante `iframe` a altura completa.
   - **Ancho completo y móvil:** El lienzo original de 1024 px se escala proporcionalmente al ancho visible: hacia arriba en escritorio (sin franjas laterales) y hacia abajo en móvil. El hero, las páginas incrustadas, las páginas individuales y el menú usan el mismo ancho fluido.
   - Cada página funciona como una hoja apilada: al entrar en el viewport se desplaza a menor velocidad que el scroll y termina de encajar con una leve escala, generando un efecto parallax entre páginas.
   - **Transición de capítulo:** cada hoja entra con una tarjeta a todo el ancho (número y nombre del proyecto) en el color de su propia página; a medida que el proyecto se asienta, la tarjeta se retira desde arriba con un barrido y un desvanecido final, presentando gradualmente sus primeros elementos.
   - Cada hoja se superpone unos píxeles a la anterior y proyecta una sombra en su borde superior, de modo que la siguiente página parece deslizarse por encima de la anterior.
   - El fondo de cada hoja se tiñe con el color propio del proyecto para que las transiciones no muestren cortes.
   - Los enlaces internos de las páginas incrustadas se redirigen al index (scroll a la hoja correspondiente o navegación normal).

---

## 🚀 Cómo Visualizar el Clon

### Opción 1: Apertura Directa en el Navegador
Al estar estructurado con rutas relativas e imágenes locales, puedes abrir directamente el archivo `index.html` haciendo doble clic sobre él o arrastrándolo a cualquier navegador (Google Chrome, Edge, Firefox, Safari).

### Opción 2: Servidor full stack (Node.js, sin dependencias)
El proyecto incluye un servidor con API y panel de administración, sin ninguna dependencia npm (usa el SQLite integrado de Node).

```bash
npm start          # o: node --no-warnings server.js
```

Luego abre tu navegador en:
```
Sitio:  http://localhost:3000
Panel:  http://localhost:3000/admin
```

> Requiere Node.js ≥ 22.5 (por `node:sqlite`). Probado con Node 24.

---

## 🔐 Panel de Administración (CMS full stack)

El sitio público ahora se hidrata desde una API respaldada por SQLite. El panel
`/admin` gobierna todo el contenido editable:

| Área del panel | Qué controla |
| --- | --- |
| **Sitio** | Título de la pestaña, **descripción** (meta description), **logotipo** (subida de imagen), **favicon** (subida de imagen) y botón **borrar caché**. |
| **Colores y tipografía** | Paleta completa (fondo, tintas, acento, bordes), familia tipográfica, tamaños base/menú/título, interletraje y altura de línea. |
| **Menú superior** | Texto y enlace del logo, y la lista de enlaces (internos, externos o abrir índice). |
| **Hero** | Bloque de portada opcional (antetítulo, título, subtítulo, botón) y el texto de la cinta animada + sellos. |
| **Proyectos** | Cada proyecto (título, categoría, color, slug, archivo, alto, orden, visibilidad) y **todas sus imágenes**. |
| **Footer** | Marca, lema, columnas de enlaces, redes sociales, copyright y el distintivo flotante. |

### Autenticación
El acceso se controla con un **token único** definido en `.env`:

```bash
cp .env.example .env
# Edita .env y define ADMIN_TOKEN=tu-token-secreto
```

Al introducir el token, el panel crea una cookie de sesión `HttpOnly`; el navegador
nunca guarda el token en claro. Para scripts también se admite `Authorization: Bearer <token>`
o `Authorization: Token <token>`.

### Imágenes por proyecto (posición preservada)
Cada proyecto conserva el layout Readymag exacto: el panel lista **todas las
imágenes de cada página** (la cantidad varía por proyecto) y permite cambiar el
archivo, el `alt` y el pie, reordenar o eliminar. El CMS **solo sustituye el `src`**
del slot original — nunca mueve, redimensiona ni reposiciona ninguna imagen — así que
las posiciones originales se mantienen intactas.

Puedes subir imágenes nuevas (se guardan en `assets/uploads/`) o apuntar a una ruta/URL existente.

### API (resumen)
```
GET    /api/content                → contenido público completo
GET    /api/projects/:slug         → un proyecto con sus imágenes
POST   /api/login                  → { token } → cookie de sesión
POST   /api/logout
GET    /api/session
PUT    /api/settings/:grupo        → theme | sizes | nav | hero | projectsSection | footer
POST   /api/projects               → crear proyecto
PUT    /api/projects/:id           → editar proyecto
DELETE /api/projects/:id
PUT    /api/projects/order         → { ids: [] }
POST   /api/projects/:id/images    → añadir imagen
PUT    /api/images/:id             → editar imagen (src, alt, caption)
DELETE /api/images/:id
PUT    /api/images/order           → { ids: [] }
PUT    /api/upload?name=           → subir imagen (cuerpo binario)
GET    /api/media                  → listar imágenes subidas
```

### Identidad (logotipo, favicon y descripción)
- **Logotipo:** si subes una imagen en *Sitio → Logotipo*, sustituye al texto del menú superior en todo el sitio (alto y texto alternativo configurables). Si lo dejas vacío, se usa el texto del menú.
- **Favicon:** la imagen subida se aplica a la pestaña del sitio público y del panel.
- **Descripción:** se escribe en `<meta name="description">` de la portada (las páginas internas conservan su propio título).
- Los archivos subidos se guardan en `assets/uploads/`.

### Borrar caché
El botón **Borrar caché** (pestaña *Sitio*) incrementa una versión interna que forma parte del `ETag`
de cada archivo servido. Al cambiar, los navegadores revalidan y **descargan de nuevo** HTML, CSS, JS
e imágenes, garantizando que vean la última versión. La versión actual se muestra junto al botón.

```
POST /api/cache/clear   → { ok: true, version: N }
```

### Base de datos y contenido versionado
El contenido vive en SQLite (`data/noplan.db`, **no se sube a git**), y cada cambio
del panel se copia automáticamente a **`content/site.json`**, que sí se versiona.

Así un clon limpio arranca con todo tu contenido: al primer `npm start`, si la base
está vacía, se importa `content/site.json` (textos, colores, menú, hero, footer,
proyectos, imágenes, posiciones y estado publicado/borrador). Si ese archivo no
existe, se generan los valores por defecto desde el sitio estático.

```bash
npm run seed           # sembrar solo si está vacía (importa content/site.json)
npm run reset          # reiniciar todo el contenido desde content/site.json
npm run export         # reescribir content/site.json a mano
```

Recuerda: al clonar, crea el `.env` con tu `ADMIN_TOKEN` (usa `.env.example`).
Tras cada sesión de edición, haz commit de `content/site.json` para conservar los cambios.

---

## 📁 Estructura del Proyecto

```
NoPlan/
├── index.html                 # Página de inicio del estudio
├── lost-sock.html             # Caso de estudio: Lost Sock Roasters
├── motorkat.html              # Caso de estudio: Motorkat
├── zinnia.html                # Caso de estudio: Zinnia
├── peoples-book.html          # Caso de estudio: People's Book
├── soko.html                  # Caso de estudio: SOKO
├── indigro.html               # Caso de estudio: Indigro
├── atlantic-rhythms-1.html    # Caso de estudio: Goodnight Shiva
├── atlantic-rhythms-2.html    # Caso de estudio: Miru Mira
├── no-way.html                # Caso de estudio: No Way (Mural)
├── abcdc.html                 # Caso de estudio: ABCDC (Escultura)
├── about.html                 # Página About
├── contact.html               # Página Contact
├── server.js                  # Servidor full stack (estático + API + admin)
├── package.json               # Scripts npm (sin dependencias)
├── .env.example               # Plantilla de variables (ADMIN_TOKEN, PORT)
├── lib/
│   ├── env.js                 # Cargador de .env sin dependencias
│   ├── content.js             # Modelo de contenido y valores por defecto
│   ├── db.js                  # SQLite (node:sqlite): esquema y acceso a datos
│   ├── auth.js                # Token único + sesiones con cookie HttpOnly
│   ├── contentfile.js         # Exporta/importa content/site.json
│   └── seed.js                # Siembra desde content/site.json o el sitio estático
├── content/
│   └── site.json              # Contenido del panel versionado en git
├── admin/
│   ├── index.html             # Panel de administración (SPA vanilla)
│   ├── admin.css              # Estilos del panel
│   └── admin.js               # Lógica del panel (menú, hero, proyectos, footer…)
├── data/                      # Base de datos SQLite (noplan.db)
├── scripts/
│   ├── cms-seed.js            # Sembrar / reiniciar el contenido
│   └── cms-export.js          # Escribir content/site.json a mano
├── validate_clone.js          # Validador de integridad de enlaces e imágenes
├── generate_pages.js          # Script generador maestro
├── assets/
│   ├── css/
│   │   ├── fonts.css          # Definición de tipografía Mabry
│   │   ├── viewer.css         # Estilos base del visor y maquetación
│   │   ├── studio.css         # Estilos custom, animaciones, drawer y paginador
│   │   ├── embeds.css         # Stack de proyectos y efecto parallax del index
│   │   └── cms.css            # Estilos del hero y footer gobernados por el CMS
│   ├── fonts/
│   │   └── mabry.ttf          # Archivo de fuente tipográfica original
│   ├── images/                # 152 imágenes locales de alta resolución
│   ├── uploads/               # Imágenes subidas desde el panel
│   └── js/
│       ├── cms.js             # Hidratación del sitio público desde la API
│       ├── studio.js          # Control de interactividad, giros de sellos y responsive
│       └── embeds.js          # Alturas, parallax y enlaces del stack de proyectos
└── README.md                  # Documentación del proyecto
```

*Nota: Proyecto realizado con carácter estrictamente demostrativo y educativo.*
