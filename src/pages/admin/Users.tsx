import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Pagination,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { api } from '../../lib/api';

type UserRole = 'ADMIN' | 'RESTAURANT' | 'CUSTOMER';

type CustomerProfile = {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  addressCity?: string | null;
};

type RestaurantProfile = {
  name?: string | null;
  status?: string | null;
  addressCity?: string | null;
};

type UserRow = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  customer?: CustomerProfile | null;
  restaurant?: RestaurantProfile | null;
  sessionCount?: number;
};

type UsersResponse = {
  items: UserRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function UsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [resetBusy, setResetBusy] = useState(false);

  const query = useMemo(() => ({ search, role, page, limit }), [search, role, page, limit]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(query.page));
      params.set('limit', String(query.limit));
      if (query.search.trim()) params.set('search', query.search.trim());
      if (query.role) params.set('role', query.role);

      const { data } = await api.get<UsersResponse>(`/users?${params.toString()}`);
      setItems(data.items);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (e) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [query.page, query.limit, query.role]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadUsers();
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleSendReset = async () => {
    if (!resetTarget) return;
    setResetBusy(true);
    try {
      await api.post(`/users/${resetTarget.id}/send-password-reset`);
      setResetTarget(null);
    } finally {
      setResetBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/users/${id}`);
    await loadUsers();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row"
            sx={{
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
            }} 
        >
        <Box>
          <Typography variant="h4">Users</Typography>
          <Typography variant="body2" color="text.secondary">
            Admin user management
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={loadUsers} variant="outlined">
          Refresh
        </Button>
      </Stack>

      <Stack 
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ mb: 2 }}
        >
        <TextField
          fullWidth
          label="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Email, name, restaurant..."
        />
        <Select
          value={role}
          displayEmpty
          onChange={(e) => {
            setRole(e.target.value as UserRole | '');
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All roles</MenuItem>
          <MenuItem value="ADMIN">Admin</MenuItem>
          <MenuItem value="RESTAURANT">Restaurant</MenuItem>
          <MenuItem value="CUSTOMER">Customer</MenuItem>
        </Select>
      </Stack>

      {role || search ? (
        <Stack direction="row" spacing={1} sx={{mb:2}}>
          {search ? <Chip label={`Search: ${search}`} onDelete={() => setSearch('')} /> : null}
          {role ? <Chip label={`Role: ${role}`} onDelete={() => setRole('')} /> : null}
        </Stack>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Name / Profile</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.role === 'CUSTOMER'
                      ? [user.customer?.firstName, user.customer?.lastName].filter(Boolean).join(' ') || '—'
                      : user.role === 'RESTAURANT'
                        ? user.restaurant?.name || '—'
                        : '—'}
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{new Date(user.updatedAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
                      <IconButton size="small" aria-label="view">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label="edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label="reset email" onClick={() => setResetTarget(user)}>
                        <EmailIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label="delete" onClick={() => handleDelete(user.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!items.length ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </Box>

      <Stack direction="row" sx={{justifyContent:"center", mt:3}} >
        <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} />
      </Stack>

      <Dialog open={Boolean(resetTarget)} onClose={() => setResetTarget(null)}>
        <DialogTitle>Send password reset</DialogTitle>
        <DialogContent>
          <Typography>
            Send a password reset link to <strong>{resetTarget?.email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetTarget(null)} disabled={resetBusy}>
            Cancel
          </Button>
          <Button onClick={handleSendReset} variant="contained" disabled={resetBusy}>
            Send link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}