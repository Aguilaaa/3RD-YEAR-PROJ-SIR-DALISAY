import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import api, { apiError, apiFieldErrors } from '../../api/client';
import { adminUserSchema } from '../../validation/schemas';

const emptyUser = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  contactNumber: '',
  address: '',
  role: 'customer',
  status: 'active',
  password: '',
  confirmPassword: '',
};

export function UserFormDialog({ open, user, onClose, onSaved }) {
  const creating = !user;
  const [formError, setFormError] = useState('');
  const form = useForm({
    resolver: yupResolver(adminUserSchema),
    context: { creating },
    defaultValues: emptyUser,
  });

  useEffect(() => {
    if (!open) return;
    setFormError('');
    form.reset(user ? {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      contactNumber: user.contactNumber || '',
      address: user.address || '',
      role: user.role,
      status: user.status,
      password: '',
      confirmPassword: '',
    } : emptyUser);
  }, [open, user]);

  async function onSubmit(values) {
    try {
      const body = { ...values };
      if (!creating && !body.password) {
        delete body.password;
        delete body.confirmPassword;
      }
      const response = creating
        ? await api.post('/admin/users', body)
        : await api.put(`/admin/users/${user.id}`, body);
      onSaved(response.data.message);
    } catch (error) {
      const fields = apiFieldErrors(error);
      Object.entries(fields).forEach(([key, message]) => form.setError(key, { message }));
      if (!Object.keys(fields).length) setFormError(apiError(error));
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{creating ? 'New user' : 'Update user'}</DialogTitle>
      <DialogContent>
        {formError && <Typography color="error" sx={{ mt: 1 }}>{formError}</Typography>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="First name" {...form.register('firstName')} error={!!form.formState.errors.firstName} helperText={form.formState.errors.firstName?.message} />
          <TextField label="Last name" {...form.register('lastName')} error={!!form.formState.errors.lastName} helperText={form.formState.errors.lastName?.message} />
          <TextField label="Username" {...form.register('username')} error={!!form.formState.errors.username} helperText={form.formState.errors.username?.message} />
          <TextField label="Email" type="email" {...form.register('email')} disabled={!creating} error={!!form.formState.errors.email} helperText={form.formState.errors.email?.message || (!creating ? 'Email cannot be changed after the account is created.' : '')} />
          <TextField label="Contact number" {...form.register('contactNumber')} error={!!form.formState.errors.contactNumber} helperText={form.formState.errors.contactNumber?.message} />
          <TextField label="Address" multiline minRows={2} {...form.register('address')} error={!!form.formState.errors.address} helperText={form.formState.errors.address?.message} />
          <Controller
            name="role"
            control={form.control}
            render={({ field }) => (
              <TextField select label="Role" {...field} error={!!form.formState.errors.role} helperText={form.formState.errors.role?.message}>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <TextField select label="Status" {...field} error={!!form.formState.errors.status} helperText={form.formState.errors.status?.message}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            )}
          />
          <TextField
            label={creating ? 'Password' : 'New password (optional)'}
            type="password"
            {...form.register('password')}
            error={!!form.formState.errors.password}
            helperText={form.formState.errors.password?.message || (creating ? 'At least 8 characters, with upper, lower, and a number.' : 'Leave blank to keep the current password.')}
          />
          <TextField
            label="Confirm password"
            type="password"
            {...form.register('confirmPassword')}
            error={!!form.formState.errors.confirmPassword}
            helperText={form.formState.errors.confirmPassword?.message}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
