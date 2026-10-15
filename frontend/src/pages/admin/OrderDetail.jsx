import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import api, { apiError } from '../../api/client';
import { peso, when } from '../../utils/format';

export function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/admin/orders/${id}`).then(({ data }) => setOrder(data.order)).catch((loadError) => setError(apiError(loadError)));
  }, [id]);

  if (error) return <Typography color="error">{error}</Typography>;
  if (!order) return <Typography>Loading order…</Typography>;

  return (
    <>
      <Typography variant="h4" gutterBottom>{order.orderNumber}</Typography>
      <Typography gutterBottom>Status: {order.status}</Typography>
      <Typography gutterBottom>{order.shippingName} · {order.contactNumber}</Typography>
      <Typography gutterBottom>{order.address}</Typography>
      <Typography gutterBottom>{order.customerEmail} · {order.paymentMethod}</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>Unit price</TableCell>
            <TableCell>Subtotal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {order.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.productName} ({item.itemCode})</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{peso(item.unitPrice)}</TableCell>
              <TableCell>{peso(item.subtotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography variant="h6" sx={{ mt: 2 }}>Grand total {peso(order.grandTotal)}</Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6">Status history</Typography>
        {order.history.map((entry) => (
          <Typography key={entry.id}>
            {entry.status} · {when(entry.createdAt)} · {entry.emailSent ? 'Email sent' : entry.emailError || 'No email'}
          </Typography>
        ))}
      </Paper>
      <ButtonLink />
    </>
  );
}

function ButtonLink() {
  return (
    <Typography sx={{ mt: 2 }}>
      <Link to="/admin/orders">Back to orders</Link>
    </Typography>
  );
}
