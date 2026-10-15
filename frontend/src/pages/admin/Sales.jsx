import { useEffect, useState } from 'react';
import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import api, { apiError } from '../../api/client';
import { SalesChart } from '../../components/admin/SalesChart';

export function Sales() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [monthly, setMonthly] = useState([]);
  const [start, setStart] = useState(`${currentYear}-01-01`);
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [rangePoints, setRangePoints] = useState([]);
  const [rangeMessage, setRangeMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/reports/monthly', { params: { year } }).then(({ data }) => setMonthly(data.points));
  }, [year]);

  async function loadRange() {
    setError('');
    if (start > end) {
      setError('Start date cannot be after the end date.');
      setRangePoints([]);
      return;
    }
    try {
      const { data } = await api.get('/admin/reports/range', { params: { start, end } });
      setRangePoints(data.points);
      setRangeMessage(data.message);
    } catch (loadError) {
      setRangePoints([]);
      setRangeMessage('');
      setError(apiError(loadError));
    }
  }

  useEffect(() => {
    loadRange();
  }, []);

  return (
    <>
      <Typography variant="h4" gutterBottom>Sales</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField select label="Year" value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {[0, 1, 2, 3, 4].map((offset) => (
              <MenuItem key={offset} value={currentYear - offset}>{currentYear - offset}</MenuItem>
            ))}
          </TextField>
        </Stack>
        <Typography variant="h6" gutterBottom>Monthly sales line chart</Typography>
        <SalesChart points={monthly} variant="line" />
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Sales by date range</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField label="Start" type="date" value={start} onChange={(event) => setStart(event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="End" type="date" value={end} onChange={(event) => setEnd(event.target.value)} InputLabelProps={{ shrink: true }} />
          <Button variant="contained" onClick={loadRange}>Apply</Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {rangeMessage && <Alert severity="info">{rangeMessage}</Alert>}
        {rangePoints.length > 0 && <SalesChart points={rangePoints} variant="bar" />}
      </Paper>
    </>
  );
}
