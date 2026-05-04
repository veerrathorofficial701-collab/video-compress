import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIREBASE_ERRORS = {
  'auth/email-already-in-use':    'An account with this email already exists.',
  'auth/invalid-email':           'Please enter a valid email address.',
  'auth/weak-password':           'Password must be at least 6 characters.',
  'auth/user-not-found':          'No account found with this email.',
  'auth/wrong-password':          'Incorrect password. Please try again.',
  'auth/invalid-credential':      'Incorrect email or password.',
  'auth/too-many-requests':       'Too many attempts. Please try again later.',
  'auth/popup-closed-by-user':    'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/network-request-failed':  'Network error. Check your connection.',
};

function friendlyError(err) {
  return FIREBASE_ERRORS[err?.code] || err?.message || 'Something went wrong. Please try again.';
}

export default function AuthModal({ onClose }) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode]         = useState('signin');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const reset = (m) => { setMode(m); setError(''); setName(''); setEmail(''); setPassword(''); setConfirm(''); };

  const validate = () => {
    if (mode === 'signup' && !name.trim()) return 'Please enter your full name.';
    if (!EMAIL_RE.test(email))             return 'Please enter a valid email address.';
    if (password.length < 6)               return 'Password must be at least 6 characters.';
    if (mode === 'signup' && password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setLoading(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(name, email, password);
      onClose();
    } catch (ex) {
      setError(friendlyError(ex));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(''); setGLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (ex) {
      setError(friendlyError(ex));
    } finally {
      setGLoading(false);
    }
  };

  const busy = loading || gLoading;

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="auth-logo">🎬</div>
        <h2 className="auth-title">{mode === 'signin' ? 'Welcome back' : 'Create account'}</h2>
        <p className="auth-sub">
          {mode === 'signin' ? 'Sign in to your VideoCompress AI account' : 'Join millions compressing files for free'}
        </p>

        {/* Google Sign-In */}
        <button className="btn-google" onClick={handleGoogle} disabled={busy}>
          {gLoading
            ? <><span className="spinner spinner-dark" /> Signing in…</>
            : <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="google-icon" /> Continue with Google</>
          }
        </button>

        <div className="auth-divider"><span>or</span></div>

        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'signin' ? ' active' : ''}`} onClick={() => reset('signin')}>Sign In</button>
          <button className={`auth-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => reset('signup')}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <div className="auth-field">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" value={name} autoComplete="name"
                onChange={(e) => setName(e.target.value)} disabled={busy} />
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={email} autoComplete="email"
              onChange={(e) => setEmail(e.target.value)} disabled={busy} />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-pw-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                value={password}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                onChange={(e) => setPassword(e.target.value)} disabled={busy}
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(p => !p)}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div className="auth-field">
              <label>Confirm Password</label>
              <div className="auth-pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirm} autoComplete="new-password"
                  onChange={(e) => setConfirm(e.target.value)} disabled={busy}
                />
              </div>
            </div>
          )}

          {error && <div className="auth-error">⚠️ {error}</div>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {loading
              ? <><span className="spinner" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
              : mode === 'signin' ? '🔐 Sign In' : '🚀 Create Account'
            }
          </button>
        </form>

        <p className="auth-footer-note">
          {mode === 'signin'
            ? <>Don't have an account? <button className="auth-link" onClick={() => reset('signup')}>Sign up free</button></>
            : <>Already have an account? <button className="auth-link" onClick={() => reset('signin')}>Sign in</button></>
          }
        </p>

        <p className="auth-privacy">🔒 Secured by Firebase Authentication</p>
      </div>
    </div>
  );
}
