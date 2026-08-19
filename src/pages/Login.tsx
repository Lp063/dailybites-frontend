import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const nav = useNavigate();
  const { setToken } = useAuth();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ email, password });
      const data = res.data ?? res;
      const token = data?.accessToken || data?.token;
      const role = data?.user?.role || data?.role;
      // if (!token) throw new Error('Missing access token');
      // if (role !== 'ADMIN') throw new Error('Admin access required');
      // sessionStorage.setItem('admin_token', token);
      // nav('/', { replace: true });
      if (!token) throw new Error('Missing access token');
      if (role !== 'ADMIN') throw new Error('Admin access required');
      sessionStorage.setItem('admin_token', token);
      setToken(token);
      nav('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <button className="theme-toggle" onClick={toggle} type="button">{theme === 'dark' ? 'Light' : 'Dark'}</button>
      <form className="auth-card" onSubmit={onSubmit}>
        <div>
          <h1>Admin Login</h1>
          <p>DailyBites platform access</p>
        </div>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={loading} type="submit">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  );
}