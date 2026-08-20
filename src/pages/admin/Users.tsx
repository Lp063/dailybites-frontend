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
  Divider,
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
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { api } from '../../lib/api';

type UserRole = 'ADMIN' | 'RESTAURANT' | 'CUSTOMER';
type BagCategory = 'MEALS' | 'BREAD_PASTRIES' | 'GROCERIES' | 'FLOWERS_PLANTS' | 'PET_FOOD' | 'OTHER';
type RestaurantStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'TRIAL';

type CustomerProfile = {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  addressCity?: string | null;
};

type RestaurantProfile = {
  name?: string | null;
  status?: string | null;
  category?: string | null;
  contactNumber?: string | null;
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
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

type FormState = {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  customerCity: string;
  restaurantName: string;
  restaurantCategory: BagCategory;
  restaurantStatus: RestaurantStatus;
  restaurantContact: string;
  restaurantCity: string;
};

const EMPTY_FORM: FormState = {
  email: '',
  password: '',
  role: 'CUSTOMER',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  customerCity: '',
  restaurantName: '',
  restaurantCategory: 'OTHER',
  restaurantStatus: 'PENDING',
  restaurantContact: '',
  restaurantCity: '',
};

function toFormState(user: UserRow): FormState {
  return {
    email: user.email,
    password: '',
    role: user.role,
    firstName: user.customer?.firstName ?? '',
    lastName: user.customer?.lastName ?? '',
    phoneNumber: user.customer?.phoneNumber ?? '',
    customerCity: user.customer?.addressCity ?? '',
    restaurantName: user.restaurant?.name ?? '',
    restaurantCategory: (user.restaurant?.category as BagCategory) ?? 'OTHER',
    restaurantStatus: (user.restaurant?.status as RestaurantStatus) ?? 'PENDING',
    restaurantContact: user.restaurant?.contactNumber ?? '',
    restaurantCity: user.restaurant?.addressCity ?? '',
  };
}

function buildPayload(form: FormState, mode: 'create' | 'edit') {
  const payload: Record<string, unknown> = {
    email: form.email,
    role: form.role,
  };

  if (form.password.trim() || mode === 'create') {
    if (form.password.trim()) payload.password = form.password.trim();
  }

  if (form.role === 'CUSTOMER') {
    payload.customer = {
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      phoneNumber: form.phoneNumber || undefined,
      addressCity: form.customerCity || undefined,
    };
  }

  if (form.role === 'RESTAURANT') {
    payload.restaurant = {
      name: form.restaurantName || undefined,
      category: form.restaurantCategory,
      status: form.restaurantStatus,
      contactNumber: form.restaurantContact || undefined,
      addressCity: form.restaurantCity || undefined,
    };
  }

  return payload;
}

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

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [viewTarget, setViewTarget] = useState<UserRow | null>(null);

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [formTarget, setFormTarget] = useState<UserRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formBusy, setFormBusy] = useState(false);

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

      const res = await api.get<{ success: boolean; data: UsersResponse }>(
        `/users?${params.toString()}`
      );
      const payload = res.data?.data;

      setItems(payload?.items ?? []);
      setTotalPages(payload?.pagination?.totalPages || 1);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load users';
      setError(`Failed to load users: ${message}`);
      setItems([]);
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadUsers();
    } finally {
      setDeleteBusy(false);
    }
  };

  function openCreate() {
    setFormMode('create');
    setFormTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function openEdit(user: UserRow) {
    setFormMode('edit');
    setFormTarget(user);
    setForm(toFormState(user));
    setFormError('');
  }

  function closeForm() {
    setFormMode(null);
    setFormTarget(null);
    setFormError('');
  }

  async function submitForm() {
    setFormBusy(true);
    setFormError('');
    try {
      const payload = buildPayload(form, formMode === 'edit' ? 'edit' : 'create');
      if (formMode === 'create') {
        if (!form.password.trim() || form.password.trim().length < 8) {
          setFormError('Password must be at least 8 characters');
          setFormBusy(false);
          return;
        }
        await api.post('/users', payload);
      } else if (formMode === 'edit' && formTarget) {
        await api.patch(`/users/${formTarget.id}`, payload);
      }
      closeForm();
      await loadUsers();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save user';
      setFormError(message.includes('already exists') ? 'A user with this email already exists' : message);
    } finally {
      setFormBusy(false);
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h4">Users</Typography>
          <Typography variant="body2" color="text.secondary">
            Admin user management
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={loadUsers} variant="outlined">
            Refresh
          </Button>
          <Button startIcon={<AddIcon />} onClick={openCreate} variant="contained">
            Add user
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
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
            setRole(e.target.value as UserRole);
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

      {search || role ? (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
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
                      : null}
                    {user.role === 'RESTAURANT' ? user.restaurant?.name ?? '—' : null}
                    {user.role === 'ADMIN' ? '—' : null}
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{new Date(user.updatedAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      <IconButton size="small" aria-label="view" onClick={() => setViewTarget(user)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label="edit" onClick={() => openEdit(user)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label="reset email" onClick={() => setResetTarget(user)}>
                        <EmailIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label="delete" onClick={() => setDeleteTarget(user)}>
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

      <Stack direction="row" sx={{ justifyContent: 'center', mt: 3 }}>
        <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} />
      </Stack>

      {/* Password reset confirmation */}
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

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete user</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteTarget?.email}</strong> permanently? This also removes their active sessions and
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteBusy}>
            {deleteBusy ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View (read-only) */}
      <Dialog open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>User details</DialogTitle>
        <DialogContent>
          {viewTarget ? (
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Email:</strong> {viewTarget.email}
              </Typography>
              <Typography variant="body2">
                <strong>Role:</strong> {viewTarget.role}
              </Typography>
              <Typography variant="body2">
                <strong>Created:</strong> {new Date(viewTarget.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Updated:</strong> {new Date(viewTarget.updatedAt).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Active sessions:</strong> {viewTarget.sessionCount ?? 0}
              </Typography>
              {viewTarget.role === 'CUSTOMER' ? (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    <strong>Name:</strong>{' '}
                    {[viewTarget.customer?.firstName, viewTarget.customer?.lastName].filter(Boolean).join(' ') || '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {viewTarget.customer?.phoneNumber || '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>City:</strong> {viewTarget.customer?.addressCity || '—'}
                  </Typography>
                </>
              ) : null}
              {viewTarget.role === 'RESTAURANT' ? (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    <strong>Restaurant name:</strong> {viewTarget.restaurant?.name || '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {viewTarget.restaurant?.status || '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Category:</strong> {viewTarget.restaurant?.category || '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Contact:</strong> {viewTarget.restaurant?.contactNumber || '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>City:</strong> {viewTarget.restaurant?.addressCity || '—'}
                  </Typography>
                </>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewTarget(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create / Edit */}
      <Dialog open={formMode !== null} onClose={closeForm} maxWidth="sm" fullWidth>
        <DialogTitle>{formMode === 'edit' ? 'Edit user' : 'Add user'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label={formMode === 'edit' ? 'New password (leave blank to keep current)' : 'Password'}
              type="password"
              required={formMode === 'create'}
              fullWidth
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              helperText="Minimum 8 characters"
            />
            <Select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            >
              <MenuItem value="CUSTOMER">Customer</MenuItem>
              <MenuItem value="RESTAURANT">Restaurant</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>

            {form.role === 'CUSTOMER' ? (
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="First name"
                    fullWidth
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                  <TextField
                    label="Last name"
                    fullWidth
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </Stack>
                <TextField
                  label="Phone number"
                  fullWidth
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                />
                <TextField
                  label="City"
                  fullWidth
                  value={form.customerCity}
                  onChange={(e) => setForm((f) => ({ ...f, customerCity: e.target.value }))}
                />
              </Stack>
            ) : null}

            {form.role === 'RESTAURANT' ? (
              <Stack spacing={2}>
                <TextField
                  label="Restaurant name"
                  fullWidth
                  value={form.restaurantName}
                  onChange={(e) => setForm((f) => ({ ...f, restaurantName: e.target.value }))}
                />
                <Stack direction="row" spacing={2}>
                  <Select
                    fullWidth
                    value={form.restaurantCategory}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, restaurantCategory: e.target.value as BagCategory }))
                    }
                  >
                    <MenuItem value="MEALS">Meals</MenuItem>
                    <MenuItem value="BREAD_PASTRIES">Bread & pastries</MenuItem>
                    <MenuItem value="GROCERIES">Groceries</MenuItem>
                    <MenuItem value="FLOWERS_PLANTS">Flowers & plants</MenuItem>
                    <MenuItem value="PET_FOOD">Pet food</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                  <Select
                    fullWidth
                    value={form.restaurantStatus}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, restaurantStatus: e.target.value as RestaurantStatus }))
                    }
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="APPROVED">Approved</MenuItem>
                    <MenuItem value="SUSPENDED">Suspended</MenuItem>
                    <MenuItem value="TRIAL">Trial</MenuItem>
                  </Select>
                </Stack>
                <TextField
                  label="Contact number"
                  fullWidth
                  value={form.restaurantContact}
                  onChange={(e) => setForm((f) => ({ ...f, restaurantContact: e.target.value }))}
                />
                <TextField
                  label="City"
                  fullWidth
                  value={form.restaurantCity}
                  onChange={(e) => setForm((f) => ({ ...f, restaurantCity: e.target.value }))}
                />
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeForm} disabled={formBusy}>
            Cancel
          </Button>
          <Button onClick={submitForm} variant="contained" disabled={formBusy || !form.email.trim()}>
            {formBusy ? 'Saving...' : formMode === 'edit' ? 'Save changes' : 'Create user'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}