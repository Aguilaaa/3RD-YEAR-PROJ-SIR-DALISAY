import { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import api from '../../api/client';
import { SalesChart } from '../../components/admin/SalesChart';
import { peso } from '../../utils/format';

export function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const year = new Date().getFullYear();

  useEffect(() => {
    api.get('/admin/reports/summary').then(({ data }) => setSummary(data));
    api.get('/admin/reports/monthly', { params: { year } }).then(({ data }) => setMonthly(data.points));
  }, [year]);

  if (!summary) return <CircularProgress />;

  const cards = [
    ['Total sales', peso(summary.totalSales)],
    ['Orders', summary.orders],
    ['Completed', summary.completedOrders],
    ['Pending', summary.pendingOrders],
    ['Average order', peso(summary.averageOrderValue)],
  ];

  return (
    <>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(5, 1fr)' } }}>
        {cards.map(([label, value]) => (
          <Paper key={label} sx={{ p: 2 }}>
            <Typography color="text.secondary">{label}</Typography>
            <Typography variant="h5">{value}</Typography>
          </Paper>
        ))}
      </Box>
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>Monthly sales, {year}</Typography>
        <SalesChart points={monthly} variant="line" />
      </Paper>
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6">Best-selling products</Typography>
        {summary.bestSellers.length === 0 && <Typography color="text.secondary">Completed orders will appear here.</Typography>}
        {summary.bestSellers.map((item) => (
          <Typography key={item.name}>{item.name} — {item.quantity} sold · {peso(item.sales)}</Typography>
        ))}
      </Paper>
    </>
  );
}
