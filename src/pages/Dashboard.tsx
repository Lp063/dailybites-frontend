import { useEffect, useMemo, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { adminApi, formatCurrency, type AdminStats } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { useTheme } from '../context/ThemeContext';

export function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const { theme, toggle } = useTheme();

  useEffect(() => {
    let mounted = true;
    adminApi
      .stats()
      .then((res) => {
        if (!mounted) return;
        setStats(res.data ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Unable to load dashboard stats');
        setStats(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(
    () => [
      { label: 'Restaurants', value: stats?.restaurants ?? 0, hint: 'Approved restaurants' },
      { label: 'Active users', value: stats?.activeUsers ?? 0, hint: 'Updated in the last 30 days' },
      { label: 'Pending approvals', value: stats?.pendingApprovals ?? 0, hint: 'Requires admin review' },
      { label: 'Revenue today', value: formatCurrency(stats?.revenueToday), hint: 'Current day gross sales' },
      { label: 'Orders today', value: stats?.ordersToday ?? 0, hint: 'Paid, ready, or collected' },
      { label: 'Avg order value', value: formatCurrency(stats?.avgOrderValue), hint: 'Average basket size today' },
    ],
    [stats]
  );

  const revenueDataset = (stats?.dailyRevenue ?? []).map((point) => ({
    ...point,
    shortDate: point.date.slice(5),
  }));

  const statusData = (stats?.statusBreakdown ?? []).map((row) => ({
    id: row.status,
    value: row.count,
    label: row.status.replace(/_/g, ' '),
  }));

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Dashboard KPIs
          </Typography>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            Admin overview
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={toggle}
          startIcon={theme === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                <Typography variant="h6">Revenue trend</Typography>
                <Typography variant="caption" color="text.secondary">
                  Last 30 days
                </Typography>
              </Stack>
              {revenueDataset.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No revenue data yet
                </Typography>
              ) : (
                <BarChart
                  dataset={revenueDataset}
                  height={300}
                  xAxis={[{ dataKey: 'shortDate', scaleType: 'band' }]}
                  series={[
                    {
                      dataKey: 'revenue',
                      label: 'Revenue',
                      valueFormatter: (v: number | null) => formatCurrency(v ?? undefined),
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                <Typography variant="h6">Status mix</Typography>
                <Typography variant="caption" color="text.secondary">
                  Orders (30 days)
                </Typography>
              </Stack>
              {statusData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No orders yet
                </Typography>
              ) : (
                <>
                  <PieChart series={[{ data: statusData, innerRadius: 40 }]} height={200} />
                  <List dense>
                    {statusData.map((row) => (
                      <ListItem key={row.id} disableGutters sx={{ py: 0.25 }}>
                        <ListItemText primary={row.label} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {row.value}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}