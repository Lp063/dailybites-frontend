import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { authApi, setTokens } from '../lib/api';
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
      const refreshToken = data?.refreshToken;
      const role = data?.user?.role || data?.role;
      if (!token) throw new Error('Missing access token');
      if (role !== 'ADMIN') throw new Error('Admin access required');
      setTokens(token, refreshToken);
      setToken(token);
      nav('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        position: 'relative',
        p: 2,
      }}
    >
      <IconButton onClick={toggle} aria-label="Toggle theme" sx={{ position: 'absolute', top: 16, right: 16 }}>
        {theme === 'light' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>

      <Card sx={{ maxWidth: 400, width: '100%' }} variant="outlined">
        <CardContent component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                Admin Login
              </Typography>
              <Typography variant="body2" color="text.secondary">
                DailyBites platform access
              </Typography>
            </Box>

            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button type="submit" variant="contained" disabled={loading} fullWidth>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}