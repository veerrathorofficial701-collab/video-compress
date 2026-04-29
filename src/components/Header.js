import { useState } from 'react';

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
      <div className="header-logo">
        <img src="/img/logo.png" alt="VideoCompress AI" className="header-logo-img" />
      </div>
          <button className="header-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">☰</button>
          <nav className={`header-nav${open ? ' open' : ''}`}>
            <a href="/">Home</a>
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#faq">FAQ</a>
            <a href="#top" className="nav-cta">Get Started</a>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
