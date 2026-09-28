import { useState, type FormEvent } from 'react';
import { Crosshair, Eye, EyeOff, KeyRound, Lock, Mail, ShieldAlert, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('student@predictor.edu');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) setError(signInError);
  };

  const fillDemo = () => {
    setEmail('student@predictor.edu');
    setPassword('VibeCraft#Mission2026');
  };

  return (
    <main className="login-shell">
      <div className="scanlines" />
      <div className="login-card">
        <div className="login-header">
          <div className="brand-mark"><Crosshair size={22} /></div>
          <div className="brand-kicker">ATTENDANCE TELEMETRY</div>
          <h1>THE ATTENDANCE <span>PREDICTOR</span></h1>
          <p>Student access terminal. Authenticate to launch your mission control.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span><Mail size={13} /> Student email</span>
            <div className="input-wrap">
              <UserIcon size={15} className="input-icon" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@predictor.edu" required autoComplete="email" />
            </div>
          </label>

          <label className="login-field">
            <span><KeyRound size={13} /> Password</span>
            <div className="input-wrap">
              <Lock size={15} className="input-icon" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" />
              <button type="button" className="toggle-pw" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          {error && <div className="login-error"><ShieldAlert size={15} /> {error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'AUTHENTICATING…' : 'LAUNCH MISSION CONTROL'}
          </button>
        </form>

        <div className="demo-credentials">
          <div className="demo-label">TEMPORARY STUDENT CREDENTIALS</div>
          <div className="demo-row"><span>Email</span><code>student@predictor.edu</code></div>
          <div className="demo-row"><span>Password</span><code>VibeCraft#Mission2026</code></div>
          <button className="demo-fill" onClick={fillDemo}>Auto-fill credentials</button>
        </div>
      </div>
    </main>
  );
}
