import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Pagination from '@mui/material/Pagination';
import Card from '@mui/material/Card';
import { adminApi, type RestaurantListItem } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'TRIAL'] as const;

export function Restaurants() {
  const [items, setItems] = useState<RestaurantListItem[]>([]);
  const [status, setStatus] = useState<typeof STATUS_FILTERS[number]>('ALL');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.listRestaurants({
        page,
        search: query || undefined,
        status: status === 'ALL' ? undefined : status,
      });
      setItems(res.data.items);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch {
      setError('Unable to load restaurants');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    load();
  }, [load]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  function onFilterClick(value: typeof STATUS_FILTERS[number]) {
    setStatus(value);
    setPage(1);
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Operations
        </Typography>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          Restaurants
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
        <Box component="form" onSubmit={onSearch} sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, city, or email"
            sx={{ minWidth: 280 }}
          />
          <Button type="submit" variant="contained">
            Search
          </Button>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((value) => (
            <Chip
              key={value}
              label={value.replace(/_/g, ' ')}
              onClick={() => onFilterClick(value)}
              color={status === value ? 'primary' : 'default'}
              variant={status === value ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card variant="outlined">
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <Typography color="text.secondary">No restaurants found</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Bags</TableCell>
                <TableCell>Orders</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>{row.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.category.replace(/_/g, ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>{row.addressCity ?? '—'}</TableCell>
                  <TableCell>{row.ownerEmail}</TableCell>
                  <TableCell>{row.bagCount}</TableCell>
                  <TableCell>{row.orderCount}</TableCell>
                  <TableCell align="right">
                    <Button component={Link} to={`/restaurants/${row.id}`} size="small">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {!loading && items.length > 0 && totalPages > 1 ? (
        <Stack direction="row" justifyContent="center">
          <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} />
        </Stack>
      ) : null}
    </Stack>
  );
}