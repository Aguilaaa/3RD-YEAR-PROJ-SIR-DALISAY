import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import api, { apiError } from '../../api/client';
import { useAdminUi } from '../../components/admin/AdminLayout';
import { ORDER_STATUSES, peso, when } from '../../utils/format';

export function AdminOrders() {
  const { notify } = useAdminUi();
  const [orders, setOrders] = useState([]);
  const [pending, setPending] = useState(null);

  async function load() {
    const { data } = await api.get('/admin/orders');
    setOrders(data.orders);
  }

  useEffect(() => {
    load().catch((error) => notify(apiError(error), 'error'));
  }, []);

  async function confirm() {
    try {
      const { data } = await api.patch(`/admin/orders/${pending.id}/status`, { status: pending.status });
      notify(data.message, data.emailSent ? 'success' : 'warning');
      setPending(null);
      await load();
    } catch (error) {
      notify(apiError(error), 'error');
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>Orders</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Total</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell><Link to={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></TableCell>
              <TableCell>{order.customerName}<div>{order.customerEmail}</div></TableCell>
              <TableCell>{when(order.createdAt)}</TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell>{peso(order.grandTotal)}</TableCell>
              <TableCell>
                <Button onClick={() => setPending({ id: order.id, status: order.status, number: order.orderNumber })}>Update status</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={Boolean(pending)} onClose={() => setPending(null)} fullWidth>
        <DialogTitle>Update {pending?.number}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Status"
            sx={{ mt: 1 }}
            value={pending?.status || ''}
            onChange={(event) => setPending((current) => ({ ...current, status: event.target.value }))}
          >
            {ORDER_STATUSES.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
          </TextField>
          <Typography sx={{ mt: 2 }}>
            The customer will be emailed the updated order, with each product, quantity, unit price, subtotal, grand total, and a PDF receipt.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)}>Cancel</Button>
          <Button variant="contained" onClick={confirm}>Update and email</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
