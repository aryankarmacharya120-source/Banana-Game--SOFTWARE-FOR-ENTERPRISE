import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await (mode === 'login' ? login : register)(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="hero">
        <h1>Banana Arena</h1>
        <p>Each puzzle hides a missing digit. Pick the right answer, keep your streak alive and climb the leaderboard.</p>
        <ul className="rules">
          <li>You get 3 lives per run</li>
          <li>Correct answers score 10 points, plus a bonus for streaks</li>
          <li>A wrong answer costs a life and resets your streak</li>
        </ul>
      </div>

      <form className="card auth-card" onSubmit={submit}>
        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Log in</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Sign up</button>
        </div>

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="3-16 letters, numbers or _" autoComplete="username" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
