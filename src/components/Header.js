import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Header() {
  const { user, signOut } = useAuth();
  const [navOpen, setNavOpen]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);

  const initials = user ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <div className="header-logo">
              <img src="/img/logo.png" alt="VideoCompress AI" className="header-logo-img" />
            </div>

            <button className="header-toggle" onClick={() => setNavOpen(o => !o)} aria-label="Toggle menu">☰</button>

            <nav className={`header-nav${navOpen ? ' open' : ''}`}>
              <a href="/">Home</a>
              <a href="#how">How It Works</a>
              <a href="#faq">FAQ</a>

              {!user ? (
                <button className="nav-cta" onClick={() => { setShowModal(true); setNavOpen(false); }}>
                  Sign In
                </button>
              ) : (
                <div className="user-menu">
                  <button className="user-avatar-btn" onClick={() => setDropOpen(o => !o)}>
                    <span className="user-avatar">{initials}</span>
                    <span className="user-name">{user.name.split(' ')[0]}</span>
                    <span className="user-chevron">{dropOpen ? '▲' : '▼'}</span>
                  </button>
                  {dropOpen && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-info">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                      <hr className="user-dropdown-divider" />
                      <button className="user-dropdown-item signout" onClick={() => { signOut(); setDropOpen(false); }}>
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}
