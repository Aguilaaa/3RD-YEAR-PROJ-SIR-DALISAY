import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import api, { apiError } from '../../api/client';
import { useAdminUi } from '../../components/admin/AdminLayout';

export function Reviews() {
  const { notify } = useAdminUi();
  const [reviews, setReviews] = useState([]);
  const [pending, setPending] = useState(null);

  async function load() {
    const { data } = await api.get('/admin/reviews');
    setReviews(data.reviews);
  }

  useEffect(() => {
    load().catch((error) => notify(apiError(error), 'error'));
  }, []);

  async function confirm() {
    try {
      const { data } = await api.delete(`/admin/reviews/${pending.id}`);
      notify(data.message);
      setPending(null);
      await load();
    } catch (error) {
      notify(apiError(error), 'error');
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>Reviews</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Review</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review.id}>
              <TableCell>{review.product?.name}</TableCell>
              <TableCell>{review.author?.name}</TableCell>
              <TableCell><Rating value={review.rating} readOnly /></TableCell>
              <TableCell>{review.comment}</TableCell>
              <TableCell>
                <Button color="error" onClick={() => setPending(review)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={Boolean(pending)} onClose={() => setPending(null)}>
        <DialogTitle>Delete review</DialogTitle>
        <DialogContent>Delete this review? The wording cannot be edited, only removed.</DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirm}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
