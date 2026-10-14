import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import api, { apiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useAdminUi } from '../../components/admin/AdminLayout';

export function Users() {
  const { user: current } = useAuth();
  const { notify } = useAdminUi();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState(null);

  async function load(value = search) {
    const { data } = await api.get('/admin/users', { params: { search: value } });
    setUsers(data.users);
  }

  useEffect(() => {
    load('').catch((error) => notify(apiError(error), 'error'));
  }, []);

  async function confirm() {
    try {
      const { data } = await api.patch(`/admin/users/${pending.id}/status`, { status: pending.next });
      notify(data.message);
      setPending(null);
      await load();
    } catch (error) {
      notify(apiError(error), 'error');
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>Users</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Button variant="contained" onClick={() => load()}>Search</Button>
      </Stack>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Username</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.firstName} {user.lastName}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.status}</TableCell>
              <TableCell>
                <Button
                  size="small"
                  disabled={user.id === current.id}
                  onClick={() => setPending({ id: user.id, name: user.username, next: user.status === 'active' ? 'inactive' : 'active' })}
                >
                  {user.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={Boolean(pending)} onClose={() => setPending(null)}>
        <DialogTitle>Confirm account status</DialogTitle>
        <DialogContent>Set {pending?.name} to {pending?.next}?</DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)}>Cancel</Button>
          <Button variant="contained" onClick={confirm}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
