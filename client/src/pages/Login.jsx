import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import api, { apiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { auth, firebaseEnabled, googleProvider } from '../lib/firebase';
import { loginSchema } from '../validation/schemas';

export function Login() {
  const { user, firebaseReady, adoptUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState('');
  const form = useForm({ resolver: yupResolver(loginSchema), defaultValues: { identifier: '', password: '' } });

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : (location.state?.from || '/')} replace />;

  async function afterFirebaseLogin() {
    const { data } = await api.get('/auth/me');
    adoptUser(data.user);
    navigate(data.user.role === 'admin' ? '/admin' : (location.state?.from || '/'), { replace: true });
  }

  async function onSubmit(values) {
    setFormError('');
    if (!firebaseReady) {
      setFormError('Add the Firebase web app keys to client/.env before logging in.');
      return;
    }
    try {
      const { data } = await api.post('/auth/resolve-login', values);
      await signInWithEmailAndPassword(auth, data.email, values.password);
      await afterFirebaseLogin();
    } catch (error) {
      if (error.response?.status === 403) setFormError(apiError(error));
      else setFormError('Invalid username/email or password.');
    }
  }

  async function google() {
    setFormError('');
    try {
      await signInWithPopup(auth, googleProvider);
      const { data } = await api.post('/auth/google');
      adoptUser(data.user);
      navigate(location.state?.from || '/', { replace: true });
    } catch {
      setFormError('Google sign-in did not finish. Try again.');
    }
  }

  return (
    <div className="container auth-wrap">
      <div className="paper-panel paper-form">
        <p className="eyebrow">Account</p>
        <h1 className="h3">Login</h1>
        {!firebaseEnabled && (
          <div className="alert alert-warning">Firebase is not configured yet. Add the web config to <code>client/.env</code> and the service account to <code>server/.env</code>.</div>
        )}
        {formError && <div className="alert alert-danger">{formError}</div>}
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="mb-3">
            <label className="form-label" htmlFor="identifier">Username or email</label>
            <input id="identifier" className="form-control" {...form.register('identifier')} />
            {form.formState.errors.identifier && <div className="text-danger small">{form.formState.errors.identifier.message}</div>}
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" type="password" className="form-control" {...form.register('password')} />
            {form.formState.errors.password && <div className="text-danger small">{form.formState.errors.password.message}</div>}
          </div>
          <button className="btn btn-dark" type="submit" disabled={form.formState.isSubmitting}>Login</button>
        </form>
        <button className="btn btn-outline-dark mt-3" type="button" onClick={google} disabled={!firebaseEnabled}>
          <i className="bi bi-google me-2" />Continue with Gmail
        </button>
        <p className="mt-3 mb-0">New rider? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
