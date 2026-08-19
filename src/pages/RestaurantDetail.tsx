import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { adminApi, formatCurrency } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

type RestaurantDetailData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  category: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  contactNumber: string | null;
  businessLegalName: string | null;
  nzbn: string | null;
  gstNumber: string | null;
  users: { email: string; createdAt: string };
  schedules: { dayOfWeek: number; enabled: boolean; startTime: string; endTime: string }[];
  bags: {
    id: string;
    size: string;
    category: string;
    displayValue: string;
    sellingPrice: string | number;
    quantity: number;
    quantityRemaining: number;
    isActive: boolean;
  }[];
  count: { orders: number };
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<RestaurantDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nextStatus, setNextStatus] = useState<'APPROVED' | 'SUSPENDED'>('APPROVED');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getRestaurant(id);
      setRestaurant(res.data);
    } catch {
      setError('Unable to load restaurant');
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmStatusChange() {
    if (!id) return;
    setBusy(true);
    setActionError('');
    try {
      await adminApi.updateRestaurantStatus(id, nextStatus);
      setShowModal(false);
      await load();
    } catch {
      setActionError('Failed to update status');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !restaurant) {
    return <Alert severity="error">{error || 'Restaurant not found'}</Alert>;
  }

  const detailRows: [string, ReactNode][] = [
    ['Owner email', restaurant.users.email],
    ['Category', restaurant.category.replace(/_/g, ' ')],
    ['Description', restaurant.description],
    [
      'Address',
      [restaurant.addressStreet, restaurant.addressCity, restaurant.addressPostcode]
        .filter(Boolean)
        .join(', ') || '—',
    ],
    ['Contact', restaurant.contactNumber],
    ['Business', restaurant.businessLegalName],
    ['NZBN', restaurant.nzbn],
    ['GST', restaurant.gstNumber],
    ['Total orders', restaurant.count.orders],
  ];

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Breadcrumbs sx={{ mb: 0.5 }}>
            <Link to="/restaurants" style={{ color: 'inherit', textDecoration: 'none' }}>
              Restaurants
            </Link>
            <Typography color="text.secondary">Detail</Typography>
          </Breadcrumbs>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            {restaurant.name}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {restaurant.status !== 'APPROVED' ? (
            <Button
              variant="contained"
              onClick={() => {
                setNextStatus('APPROVED');
                setShowModal(true);
              }}
            >
              Approve
            </Button>
          ) : null}
          {restaurant.status !== 'SUSPENDED' ? (
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setNextStatus('SUSPENDED');
                setShowModal(true);
              }}
            >
              Suspend
            </Button>
          ) : null}
        </Stack>
      </Stack>

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">Profile</Typography>
                <StatusBadge status={restaurant.status} />
              </Stack>
              <List dense disablePadding>
                {detailRows.map(([label, value]) => (
                  <ListItem key={label} disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <ListItemText primary={label} sx={{ flex: '0 0 40%' }} />
                    <Typography variant="body2" sx={{ textAlign: 'right', flex: 1 }}>
                      {value ?? '—'}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Weekly schedule
              </Typography>
              {restaurant.schedules.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No schedule configured
                </Typography>
              ) : (
                <List dense disablePadding>
                  {restaurant.schedules.map((slot) => (
                    <ListItem
                      key={slot.dayOfWeek}
                      disableGutters
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <ListItemText primary={DAYS[slot.dayOfWeek] ?? slot.dayOfWeek} />
                      <Typography variant="body2" color={slot.enabled ? 'text.primary' : 'text.secondary'}>
                        {slot.enabled ? `${slot.startTime} - ${slot.endTime}` : 'Closed'}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                <Typography variant="h6">Bags</Typography>
                <Typography variant="caption" color="text.secondary">
                  {restaurant.bags.length} configured
                </Typography>
              </Stack>
              {restaurant.bags.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No bags yet
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Size</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Qty left</TableCell>
                      <TableCell>Active</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {restaurant.bags.map((bag) => (
                      <TableRow key={bag.id}>
                        <TableCell>{bag.size}</TableCell>
                        <TableCell>{bag.category.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{bag.displayValue}</TableCell>
                        <TableCell>{formatCurrency(Number(bag.sellingPrice))}</TableCell>
                        <TableCell>
                          {bag.quantityRemaining}/{bag.quantity}
                        </TableCell>
                        <TableCell>{bag.isActive ? 'Yes' : 'No'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogTitle>{nextStatus === 'APPROVED' ? 'Approve restaurant' : 'Suspend restaurant'}</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography>
              Set <strong>{restaurant.name}</strong> to
            </Typography>
            <StatusBadge status={nextStatus} />
            <Typography>?</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmStatusChange} disabled={busy}>
            {busy ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}