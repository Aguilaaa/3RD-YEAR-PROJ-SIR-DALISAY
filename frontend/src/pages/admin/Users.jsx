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
import { UserFormDialog } from '../../components/admin/UserFormDialog';

export function Users() {
  const { user: current } = useAuth();
  const { notify } = useAdminUi();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load(value = search) {
    const { data } = await api.get('/admin/users', { params: { search: value } });
    setUsers(data.users);
  }

  useEffect(() => {
    load('').catch((error) => notify(apiError(error), 'error'));
  }, []);

  async function confirm() {
    try {
      const { data } = pending.type === 'delete'
        ? await api.delete(`/admin/users/${pending.id}`)
        : pending.type === 'restore'
          ? await api.patch(`/admin/users/${pending.id}/restore`)
          : await api.patch(`/admin/users/${pending.id}/status`, { status: pending.next });
      notify(data.message);
      setPending(null);
      await load();
    } catch (error) {
      notify(apiError(error), 'error');
    }
  }

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h4">Users</Typography>
        <Button variant="contained" onClick={() => { setEditing(null); setFormOpen(true); }}>New user</Button>
      </Stack>
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
          {users.map((user) => {
            const deleted = Boolean(user.deletedAt);
            return (
              <TableRow key={user.id}>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{deleted ? 'Deleted' : user.status}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {deleted ? (
                      <Button size="small" onClick={() => setPending({ type: 'restore', id: user.id, name: user.username })}>Restore</Button>
                    ) : (
                      <>
                        <Button size="small" onClick={() => { setEditing(user); setFormOpen(true); }}>Edit</Button>
                        <Button
                          size="small"
                          disabled={user.id === current.id}
                          onClick={() => setPending({ type: 'status', id: user.id, name: user.username, next: user.status === 'active' ? 'inactive' : 'active' })}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={user.id === current.id}
                          onClick={() => setPending({ type: 'delete', id: user.id, name: user.username })}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <UserFormDialog
        key={editing?.id || 'new'}
        open={formOpen}
        user={editing}
        onClose={() => setFormOpen(false)}
        onSaved={async (message) => {
          notify(message);
          setFormOpen(false);
          await load();
        }}
      />
      <Dialog open={Boolean(pending)} onClose={() => setPending(null)}>
        <DialogTitle>
          {pending?.type === 'delete' ? 'Delete user' : pending?.type === 'restore' ? 'Restore user' : 'Confirm account status'}
        </DialogTitle>
        <DialogContent>
          {pending?.type === 'delete' && `Remove ${pending?.name}? This is a soft delete. They cannot log in, and you can restore the account later.`}
          {pending?.type === 'restore' && `Restore ${pending?.name} and allow them to log in again?`}
          {pending?.type === 'status' && `Set ${pending?.name} to ${pending?.next}?`}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)}>Cancel</Button>
          <Button color={pending?.type === 'delete' ? 'error' : 'primary'} variant="contained" onClick={confirm}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
