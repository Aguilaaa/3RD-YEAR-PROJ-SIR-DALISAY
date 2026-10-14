import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import api, { apiError, apiFieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { profileSchema, imageError } from '../validation/schemas';

export function Profile() {
  const { user, adoptUser } = useAuth();
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [photo, setPhoto] = useState(null);
  const form = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      contactNumber: user.contactNumber || '',
      address: user.address || '',
    },
  });

  async function onSubmit(values) {
    setNotice('');
    setFormError('');
    if (photo) {
      const message = imageError([photo], 2 * 1024 * 1024);
      if (message) {
        setFormError(message);
        return;
      }
    }

    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => body.append(key, value));
    if (photo) body.append('photo', photo);

    try {
      const { data } = await api.put('/users/me', body);
      adoptUser(data.user);
      setNotice('Profile updated.');
      setPhoto(null);
    } catch (error) {
      const fields = apiFieldErrors(error);
      Object.entries(fields).forEach(([key, message]) => form.setError(key, { message }));
      if (!Object.keys(fields).length) setFormError(apiError(error));
    }
  }

  return (
    <div className="container auth-wrap">
      <div className="paper-panel paper-form">
        <p className="eyebrow">Account</p>
        <h1 className="h3">Your profile</h1>
        {notice && <div className="alert alert-success">{notice}</div>}
        {formError && <div className="alert alert-danger">{formError}</div>}
        <div className="d-flex align-items-center gap-3 mb-3">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt="" width="72" height="72" className="rounded-circle object-fit-cover" />
          ) : (
            <span className="media-fallback rounded-circle" style={{ width: 72, height: 72, background: '#ece7df' }}><i className="bi bi-person" /></span>
          )}
          <div>
            <div>{user.email}</div>
            <small className="text-secondary">Role: {user.role}</small>
          </div>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="firstName">First name</label>
              <input id="firstName" className="form-control" {...form.register('firstName')} />
              {form.formState.errors.firstName && <div className="text-danger small">{form.formState.errors.firstName.message}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="lastName">Last name</label>
              <input id="lastName" className="form-control" {...form.register('lastName')} />
              {form.formState.errors.lastName && <div className="text-danger small">{form.formState.errors.lastName.message}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="username">Username</label>
              <input id="username" className="form-control" {...form.register('username')} />
              {form.formState.errors.username && <div className="text-danger small">{form.formState.errors.username.message}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="contactNumber">Contact number</label>
              <input id="contactNumber" className="form-control" {...form.register('contactNumber')} />
              {form.formState.errors.contactNumber && <div className="text-danger small">{form.formState.errors.contactNumber.message}</div>}
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="address">Address</label>
              <textarea id="address" rows="3" className="form-control" {...form.register('address')} />
              {form.formState.errors.address && <div className="text-danger small">{form.formState.errors.address.message}</div>}
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="photo">Profile photo (JPG, PNG, or WEBP, max 2 MB)</label>
              <input id="photo" className="form-control" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
            </div>
          </div>
          <button className="btn btn-dark mt-3" type="submit" disabled={form.formState.isSubmitting}>Save profile</button>
        </form>
      </div>
    </div>
  );
}
