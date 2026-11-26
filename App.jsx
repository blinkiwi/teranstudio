const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#f80d0d",
  "primaryColor": "#3d5afe",
  "radius": 12,
  "darkMode": false
}/*EDITMODE-END*/;

const STYLES = `
:root {
  --color-bg: oklch(0.97 0.01 250);
  --color-surface: oklch(1 0 0);
  --color-text: oklch(0.2 0.01 250);
  --color-text-muted: oklch(0.5 0.01 250);
  --color-border: oklch(0.9 0.01 250);
  --color-accent: var(--ocd-tweak-accent-color, #f80d0d);
  --color-primary: var(--ocd-tweak-primary-color, #3d5afe);

  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-xxl: 4rem;

  --font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-loose: 1.75;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: calc(var(--ocd-tweak-radius, 12) * 1px);
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.02);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;
}

[data-theme="dark"] {
  --color-bg: oklch(0.14 0.01 250);
  --color-surface: oklch(0.19 0.01 250);
  --color-text: oklch(0.94 0.01 250);
  --color-text-muted: oklch(0.62 0.01 250);
  --color-border: oklch(0.28 0.01 250);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 16px; }
body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text);
  background-color: var(--color-bg);
  transition: background-color var(--transition-normal), color var(--transition-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
a { color: inherit; text-decoration: none; transition: color var(--transition-fast); }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font-family: inherit; font-size: inherit; }

h1, h2, h3, h4, h5, h6 { line-height: var(--line-height-tight); font-weight: 600; color: var(--color-text); }
h1 { font-size: var(--font-size-5xl); }
h2 { font-size: var(--font-size-4xl); }
h3 { font-size: var(--font-size-3xl); }
h4 { font-size: var(--font-size-xl); }

.section-container { width: min(100% - 2rem, 1200px); margin-inline: auto; }

.btn {
  display: inline-block;
  padding: 0.85rem 1.75rem;
  border-radius: var(--radius-full);
  font-weight: 600;
  transition: all var(--transition-fast);
  cursor: pointer;
  border: none;
  text-align: center;
}
.btn-primary { background-color: var(--color-primary); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.btn-primary:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

/* Nav */
.nav {
  position: fixed; top: 0; left: 0; right: 0;
  padding: var(--spacing-md);
  background-color: transparent;
  z-index: 100;
  transition: background-color var(--transition-normal), box-shadow var(--transition-normal);
}
.nav-scrolled {
  background-color: color-mix(in oklch, var(--color-surface) 88%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
}
.nav-container {
  display: flex; justify-content: space-between; align-items: center;
  width: min(100% - 2rem, 1200px); margin: 0 auto;
}
.nav-logo { font-size: var(--font-size-xl); font-weight: 700; letter-spacing: -0.02em; color: var(--color-text); }
.nav-right { display: flex; align-items: center; gap: var(--spacing-lg); }
.nav-links { display: flex; gap: var(--spacing-lg); list-style: none; }
.nav-links a { color: var(--color-text); font-weight: 500; padding: var(--spacing-xs) 0; position: relative; }
.nav-links a::after {
  content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 2px;
  background-color: var(--color-accent); transition: width var(--transition-fast);
}
.nav-links a:hover::after { width: 100%; }
.theme-toggle {
  background: transparent; border: 1px solid var(--color-border);
  color: var(--color-text); border-radius: var(--radius-full);
  padding: 0.4rem 0.9rem; cursor: pointer; font-size: var(--font-size-sm); font-weight: 500;
  transition: all var(--transition-fast);
}
.theme-toggle:hover { border-color: var(--color-accent); color: var(--color-accent); }
.nav-toggle { display: none; flex-direction: column; background: transparent; border: none; cursor: pointer; padding: var(--spacing-xs); }
.nav-toggle span { width: 25px; height: 2px; background-color: var(--color-text); margin: 3px 0; transition: all var(--transition-fast); }

@media (max-width: 768px) {
  .nav-links {
    position: fixed; top: 70px; right: 0; bottom: 0; width: 250px;
    background-color: var(--color-surface); flex-direction: column;
    padding: var(--spacing-lg); transform: translateX(100%);
    transition: transform var(--transition-normal); box-shadow: -2px 0 10px rgba(0,0,0,0.1);
  }
  .nav-links.active { transform: translateX(0); }
  .nav-toggle { display: flex; }
}

/* Hero */
.hero { min-height: 100vh; display: flex; align-items: center; padding: var(--spacing-xxl) var(--spacing-md); }
.hero-container {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); align-items: center;
  width: min(100% - 2rem, 1200px); margin: 0 auto;
}
.hero-eyebrow {
  display: inline-block; font-size: var(--font-size-sm); font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-accent);
  margin-bottom: var(--spacing-md);
}
.hero-title { font-size: clamp(2.5rem, 8vw, 4.25rem); line-height: 1.05; letter-spacing: -0.03em; margin-bottom: var(--spacing-md); }
.hero-title .hero-accent { color: var(--color-accent); }
.hero-subtitle { font-size: var(--font-size-lg); color: var(--color-text-muted); margin-bottom: var(--spacing-lg); max-width: 42ch; }
.hero-visual { display: flex; justify-content: center; }
.hero-image-placeholder {
  width: 100%; max-width: 440px; aspect-ratio: 4/5;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
}

@media (max-width: 1024px) { .hero-container { grid-template-columns: 1fr; } .hero-visual { order: -1; } }

/* Section */
.section { padding: var(--spacing-xxl) var(--spacing-md); }
.section-alt { background-color: var(--color-surface); }
.section-header { text-align: center; margin-bottom: var(--spacing-xxl); }
.section-title { font-size: var(--font-size-4xl); letter-spacing: -0.02em; margin-bottom: var(--spacing-sm); }
.section-subtitle { color: var(--color-text-muted); font-size: var(--font-size-lg); }

/* Projects */
.projects-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-lg); }
.project-card {
  background-color: var(--color-surface); border-radius: var(--radius-lg); overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
  animation: fadeInUp var(--transition-slow) both; animation-delay: var(--delay, 0s);
}
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.project-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
.project-card-media { aspect-ratio: 16/10; overflow: hidden; }
.project-card-image {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.85 0.08 200), oklch(0.75 0.08 280));
  transition: transform var(--transition-fast);
}
.project-card:nth-child(2n) .project-card-image { background: linear-gradient(135deg, oklch(0.85 0.1 30), oklch(0.78 0.1 350)); }
.project-card:nth-child(3n) .project-card-image { background: linear-gradient(135deg, oklch(0.86 0.09 140), oklch(0.78 0.09 200)); }
.project-card:hover .project-card-image { transform: scale(1.05); }
.project-card-content { padding: var(--spacing-md); }
.project-card-title { font-size: var(--font-size-lg); margin-bottom: var(--spacing-xs); }
.project-card-description { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-bottom: var(--spacing-md); }
.project-card-link { color: var(--color-primary); font-weight: 600; }
.project-card-link:hover { color: var(--color-accent); }

@media (max-width: 1024px) { .projects-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .projects-grid { grid-template-columns: 1fr; } }

/* About */
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); align-items: center; }
.about-image-placeholder {
  aspect-ratio: 4/5;
  background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
  border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
}
.about-content p { margin-bottom: var(--spacing-md); line-height: var(--line-height-loose); color: var(--color-text-muted); }
.about-stats { display: flex; gap: var(--spacing-xl); margin-top: var(--spacing-lg); }
.stat { text-align: left; }
.stat-number { display: block; font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-accent); }
.stat-label { font-size: var(--font-size-sm); color: var(--color-text-muted); }

@media (max-width: 1024px) { .about-grid { grid-template-columns: 1fr; } }

/* Contact */
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xxl); align-items: start; }
.contact-info { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.contact-item h4 { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--spacing-xs); }
.contact-form { display: flex; flex-direction: column; gap: var(--spacing-md); }
.form-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
.form-group input, .form-group textarea {
  padding: var(--spacing-md); border: 1px solid var(--color-border); border-radius: var(--radius-md);
  background-color: var(--color-bg); color: var(--color-text);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.form-group input:focus, .form-group textarea:focus {
  outline: none; border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-accent) 25%, transparent);
}
.form-group input::placeholder, .form-group textarea::placeholder { color: var(--color-text-muted); }

@media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr; } }

/* Footer */
.footer { background-color: var(--color-surface); padding: var(--spacing-xxl) var(--spacing-md) var(--spacing-lg); border-top: 1px solid var(--color-border); }
.footer-container {
  display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: var(--spacing-lg); align-items: start;
  width: min(100% - 2rem, 1200px); margin: 0 auto var(--spacing-lg);
}
.footer-brand h3 { font-size: var(--font-size-xl); margin-bottom: var(--spacing-xs); letter-spacing: -0.02em; }
.footer-brand p { color: var(--color-text-muted); font-size: var(--font-size-sm); }
.footer-col h5 { font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted); margin-bottom: var(--spacing-sm); }
.footer-col { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.footer-col a { color: var(--color-text-muted); font-weight: 500; }
.footer-col a:hover { color: var(--color-accent); }
.footer-copyright { text-align: center; color: var(--color-text-muted); font-size: var(--font-size-sm); padding-top: var(--spacing-lg); border-top: 1px solid var(--color-border); width: min(100% - 2rem, 1200px); margin: 0 auto; }

@media (max-width: 768px) { .footer-container { grid-template-columns: 1fr; text-align: left; } }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--color-bg); }
::-webkit-scrollbar-thumb { background: var(--color-primary); border-radius: var(--radius-full); }
::-webkit-scrollbar-thumb:hover { background: var(--color-accent); }

:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
  }
}
`;

const Navigation = ({ theme, onToggleTheme }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="nav-container">
        <a href="#home" className="nav-logo">Terán Studio<span style={{ color: 'var(--color-accent)' }}>.</span></a>
        <div className="nav-right">
          <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            <li><a href="#projects" onClick={() => setMobileMenuOpen(false)}>Projects</a></li>
            <li><a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a></li>
            <li><a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a></li>
          </ul>
          <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle color theme">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button className="nav-toggle" aria-label="Toggle menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(o => !o)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const HeroSection = () => (
  <section id="home" className="hero">
    <div className="hero-container">
      <div className="hero-content">
        <span className="hero-eyebrow">Creative Studio</span>
        <h1 className="hero-title">We build with <span className="hero-accent">intent</span>, not a template</h1>
        <p className="hero-subtitle">
          An independent design collective crafting brand identities, interfaces, and digital experiences that move people.
        </p>
        <a href="#projects" className="btn btn-primary">View our work</a>
      </div>
      <div className="hero-visual">
        <div className="hero-image-placeholder" aria-hidden="true"></div>
      </div>
    </div>
  </section>
);

const PricingCard = ({ plan, index }) => (
  <div className="pricing-card">
    <div className="pricing-card-header">
      <h3 className="pricing-card-title">{plan.name}</h3>
      <p className="pricing-card-subtitle">{plan.subtitle}</p>
    </div>
    <div className="pricing-card-price">
      <span className="currency">$</span><span className="amount">{plan.price}</span><span className="period">/mo</span>
    </div>
    <ul className="pricing-features">
      {plan.features.map((feature, idx) => (
        <li key={idx} className="pricing-feature">
          <span className="pricing-feature-icon" aria-hidden="true">✓</span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <a href={plan.cta.href} className="pricing-cta">{plan.cta.text}</a>
  </div>
);

const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      subtitle: "Perfect for small projects",
      price: "29",
      features: [
        "Up to 3 active projects",
        "Basic analytics",
        "Email support",
        "Community forum access"
      ],
      cta: { text: "Get started", href: "#pricing" }
    },
    {
      name: "Professional",
      subtitle: "Ideal for growing businesses",
      price: "79",
      features: [
        "Unlimited projects",
        "Advanced analytics",
        "Priority email support",
        "Phone support (business hours)",
        "API access"
      ],
      cta: { text: "Get started", href: "#pricing" }
    },
    {
      name: "Enterprise",
      subtitle: "For large organizations",
      price: "199",
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom SLA",
        "On-premise deployment"
      ],
      cta: { text: "Contact sales", href: "#pricing" }
    }
  ];
  return (
    <section id="pricing" className="section section-alt">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">Pricing</h2>
          <p className="section-subtitle">Simple, transparent pricing</p>
        </div>
        <div className="pricing-cards">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const AboutSection = () => (
  <section id="about" className="section section-alt">
    <div className="section-container">
      <div className="about-grid">
        <div className="about-image-placeholder" aria-hidden="true"></div>
        <div className="about-content">
          <h2 className="section-title">About the studio</h2>
          <p>
            We are a collective of designers, developers, and storytellers working together to create meaningful
            digital experiences. Our approach is rooted in curiosity, collaboration, and craft.
          </p>
          <p>
            No rigid processes, no bloated decks — just sharp thinking and work that ships.
          </p>
          <div className="about-stats">
            <div className="stat"><span className="stat-number">42</span><span className="stat-label">Projects shipped</span></div>
            <div className="stat"><span className="stat-number">6</span><span className="stat-label">Years running</span></div>
            <div className="stat"><span className="stat-number">18</span><span className="stat-label">Happy clients</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ContactSection = () => {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="section">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">Get in touch</h2>
          <p className="section-subtitle">Let's create something worth remembering</p>
        </div>
        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-item"><h4>Email</h4><p>hello@noplan.studio</p></div>
            <div className="contact-item"><h4>Location</h4><p>Remote • Worldwide</p></div>
            <div className="contact-item"><h4>Availability</h4><p>Booking Q3 2025</p></div>
          </div>
          <form className="contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <div className="form-group"><input type="text" placeholder="Your name" required aria-label="Your name" /></div>
            <div className="form-group"><input type="email" placeholder="Your email" required aria-label="Your email" /></div>
            <div className="form-group"><textarea placeholder="Tell us about your project" rows="4" required aria-label="Your message"></textarea></div>
            <button type="submit" className="btn btn-primary">{sent ? 'Thanks — we\'ll reply soon' : 'Send message'}</button>
          </form>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="footer">
    <div className="footer-container">
      <div className="footer-brand">
        <h3>Terán Studio<span style={{ color: 'var(--color-accent)' }}>.</span></h3>
        <p>Creative digital studio building with intent, not templates.</p>
      </div>
      <div className="footer-col">
        <h5>Navigate</h5>
        <a href="#projects">Projects</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </div>
      <div className="footer-col">
        <h5>Social</h5>
        <a href="#contact">Twitter</a>
        <a href="#contact">Instagram</a>
        <a href="#contact">LinkedIn</a>
      </div>
    </div>
    <div className="footer-copyright">
      <p>© 2025 Terán Studio. All rights reserved.</p>
    </div>
  </footer>
);

function App() {
  const [theme, setTheme] = useState(TWEAK_DEFAULTS.darkMode ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="App">
      <style>{STYLES}</style>
      <Navigation theme={theme} onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} />
      <HeroSection />
      <ProjectsSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
