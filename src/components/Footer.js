function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-logo">
            <img src="/img/logo.png" alt="VideoCompress AI" className="footer-logo-img" />
          </div>
          <nav className="footer-nav">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/contact">Contact</a>
          </nav>
          <p className="footer-copy">© {new Date().getFullYear()} VideoCompress AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
