const { useState, useEffect } = React;

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      navLinks.classList.toggle('active');
    }
  };

  return (
    React.createElement('nav', 
      { className: `nav ${scrolled ? 'nav-scrolled' : ''}` },
      React.createElement('div', { className: 'nav-container' },
        React.createElement('a', { href: '#home', className: 'nav-logo' }, 'noplan'),
        React.createElement('ul', { className: 'nav-links' },
          React.createElement('li', null, React.createElement('a', { href: '#projects' }, 'Projects')),
          React.createElement('li', null, React.createElement('a', { href: '#about' }, 'About')),
          React.createElement('li', null, React.createElement('a', { href: '#contact' }, 'Contact'))
        ),
        React.createElement('button', 
          { className: 'nav-toggle', 'aria-label': 'Toggle menu', onClick: toggleMobileMenu },
          React.createElement('span', null),
          React.createElement('span', null),
          React.createElement('span', null)
        )
      )
    )
  );
};

const HeroSection = () => React.createElement('section', { id: 'home', className: 'hero' },
  React.createElement('div', { className: 'hero-container' },
    React.createElement('div', { className: 'hero-content' },
      React.createElement('h1', { className: 'hero-title' },
        'Studio ',
        React.createElement('span', { className: 'hero-accent' }, 'No Plan')
      ),
      React.createElement('p', { className: 'hero-subtitle' }, 'Creative agency crafting digital experiences'),
      React.createElement('a', { href: '#projects', className: 'btn btn-primary' }, 'View Work')
    ),
    React.createElement('div', { className: 'hero-visual' },
      React.createElement('div', { className: 'hero-image-placeholder', 'aria-hidden': 'true' })
    )
  )
);

const ProjectCard = ({ project, index }) => {
  const delay = index * 0.1;
  return React.createElement('div', { className: 'project-card', style: { '--delay': `${delay}s` } },
    React.createElement('div', { className: 'project-card-media' },
      React.createElement('div', { className: 'project-card-image', 'aria-hidden': 'true' })
    ),
    React.createElement('div', { className: 'project-card-content' },
      React.createElement('h3', { className: 'project-card-title' }, project.title),
      React.createElement('p', { className: 'project-card-description' }, project.description),
      React.createElement('a', { href: project.href, className: 'project-card-link' }, 
        `View project →`)
    )
  );
};

const ProjectsSection = () => {
  const projects = [
    { title: "Brand Identity", description: "Visual identity system for modern brands", href: "#project-1" },
    { title: "Digital Experience", description: "Interactive web experiences that captivate", href: "#project-2" },
    { title: "Product Design", description: "End-to-end product design solutions", href: "#project-3" },
    { title: "Motion Graphics", description: "Animated storytelling for digital media", href: "#project-4" }
  ];
  
  return React.createElement('section', { id: 'projects', className: 'section' },
    React.createElement('div', { className: 'section-container' },
      React.createElement('div', { className: 'section-header' },
        React.createElement('h2', { className: 'section-title' }, 'Featured Work'),
        React.createElement('p', { className: 'section-subtitle' }, 'A selection of projects we are proud of')
      ),
      React.createElement('div', { className: 'projects-grid' },
        projects.map((project, index) => 
          React.createElement(ProjectCard, { key: project.title, project, index })
        )
      )
    )
  );
};

const AboutSection = () => React.createElement('section', { id: 'about', className: 'section section-alt' },
  React.createElement('div', { className: 'section-container' },
    React.createElement('div', { className: 'about-grid' },
      React.createElement('div', { className: 'about-image-placeholder', 'aria-hidden': 'true' }),
      React.createElement('div', { className: 'about-content' },
        React.createElement('h2', { className: 'section-title' }, 'About Us'),
        React.createElement('p', null, 'We are a collective of designers, developers, and storytellers working together to create meaningful digital experiences. Our approach is rooted in curiosity, collaboration, and craft.'),
        React.createElement('div', { className: 'about-stats' },
          React.createElement('div', { className: 'stat' },
            React.createElement('span', { className: 'stat-number' }, '15+'),
            React.createElement('span', { className: 'stat-label' }, 'Projects')
          ),
          React.createElement('div', { className: 'stat' },
            React.createElement('span', { className: 'stat-number' }, '5+'),
            React.createElement('span', { className: 'stat-label' }, 'Years')
          ),
          React.createElement('div', { className: 'stat' },
            React.createElement('span', { className: 'stat-number' }, '100%'),
            React.createElement('span', { className: 'stat-label' }, 'Passion')
          )
        )
      )
    )
  )
);

const ContactSection = () => {
  const handleSubmit = (e) => e.preventDefault();
  return React.createElement('section', { id: 'contact', className: 'section' },
    React.createElement('div', { className: 'section-container' },
      React.createElement('div', { className: 'section-header' },
        React.createElement('h2', { className: 'section-title' }, 'Get in Touch'),
        React.createElement('p', { className: 'section-subtitle' }, 'Let\'s create something amazing together')
      ),
      React.createElement('div', { className: 'contact-grid' },
        React.createElement('div', { className: 'contact-info' },
          React.createElement('div', { className: 'contact-item' },
            React.createElement('h4', null, 'Email'),
            React.createElement('p', null, 'hello@noplan.studio')
          ),
          React.createElement('div', { className: 'contact-item' },
            React.createElement('h4', null, 'Location'),
            React.createElement('p', null, 'Remote • Worldwide')
          )
        ),
        React.createElement('form', { className: 'contact-form', onSubmit: handleSubmit },
          React.createElement('div', { className: 'form-group' },
            React.createElement('input', { type: 'text', placeholder: 'Your name', required: true })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('input', { type: 'email', placeholder: 'Your email', required: true })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('textarea', { placeholder: 'Your message', rows: '4', required: true })
          ),
          React.createElement('button', { type: 'submit', className: 'btn btn-primary' }, 'Send Message')
        )
      )
    )
  );
};

const Footer = () => React.createElement('footer', { className: 'footer' },
  React.createElement('div', { className: 'footer-container' },
    React.createElement('div', { className: 'footer-brand' },
      React.createElement('h3', null, 'noplan'),
      React.createElement('p', null, 'Creative digital studio')
    ),
    React.createElement('div', { className: 'footer-links' },
      React.createElement('a', { href: '#projects' }, 'Projects'),
      React.createElement('a', { href: '#about' }, 'About'),
      React.createElement('a', { href: '#contact' }, 'Contact')
    ),
    React.createElement('div', { className: 'footer-social' },
      React.createElement('a', { href: '#', 'aria-label': 'Twitter' }, 'Twitter'),
      React.createElement('a', { href: '#', 'aria-label': 'Instagram' }, 'Instagram'),
      React.createElement('a', { href: '#', 'aria-label': 'LinkedIn' }, 'LinkedIn')
    ),
    React.createElement('div', { className: 'footer-copyright' },
      React.createElement('p', null, '&copy; 2024 No Plan Studio. All rights reserved.')
    )
  )
);

const App = () => React.createElement('div', { className: 'App' },
  React.createElement(Navigation, null),
  React.createElement(HeroSection, null),
  React.createElement(ProjectsSection, null),
  React.createElement(AboutSection, null),
  React.createElement(ContactSection, null),
  React.createElement(Footer, null)
);

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));