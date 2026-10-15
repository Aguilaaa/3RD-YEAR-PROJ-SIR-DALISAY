import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { createUserWithEmailAndPassword, deleteUser, signInWithPopup } from 'firebase/auth';
import api, { apiError, apiFieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { auth, firebaseEnabled, googleProvider } from '../lib/firebase';
import { registerSchema } from '../validation/schemas';

const initial = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  contactNumber: '',
  address: '',
};

export function Register() {
  const { user, adoptUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');

  if (user) return <Navigate to="/" replace />;

  async function google() {
    setFormError('');
    try {
      await signInWithPopup(auth, googleProvider);
      const { data } = await api.post('/auth/google');
      adoptUser(data.user);
      navigate('/profile', { replace: true });
    } catch {
      setFormError('Google sign-in did not finish. Try again.');
    }
  }

  return (
    <div className="container auth-wrap">
      <div className="paper-panel paper-form">
        <p className="eyebrow">Account</p>
        <h1 className="h3">Create your MotoTech account</h1>
        {!firebaseEnabled && <div className="alert alert-warning">Firebase is not configured yet.</div>}
        {formError && <div className="alert alert-danger">{formError}</div>}
        <Formik
          initialValues={initial}
          validationSchema={registerSchema}
          onSubmit={async (values, helpers) => {
            setFormError('');
            if (!firebaseEnabled) {
              setFormError('Add the Firebase web app keys before registering.');
              return;
            }
            try {
              await api.post('/auth/check', values);
              const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
              try {
                const { data } = await api.post('/auth/register', values);
                adoptUser(data.user);
                navigate('/', { replace: true });
              } catch (registerError) {
                await deleteUser(credential.user).catch(() => {});
                const fields = apiFieldErrors(registerError);
                if (Object.keys(fields).length) helpers.setErrors(fields);
                else setFormError(apiError(registerError));
              }
            } catch (error) {
              const fields = apiFieldErrors(error);
              if (Object.keys(fields).length) helpers.setErrors(fields);
              else if (error.code === 'auth/email-already-in-use') helpers.setFieldError('email', 'That email is already registered.');
              else setFormError(apiError(error, 'Registration could not be completed.'));
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form noValidate>
              <div className="row g-3">
                {[
                  ['firstName', 'First name'],
                  ['lastName', 'Last name'],
                  ['username', 'Username'],
                  ['email', 'Email', 'email'],
                  ['password', 'Password', 'password'],
                  ['confirmPassword', 'Confirm password', 'password'],
                  ['contactNumber', 'Contact number'],
                ].map(([name, label, type]) => (
                  <div className="col-md-6" key={name}>
                    <label className="form-label" htmlFor={name}>{label}</label>
                    <Field id={name} name={name} type={type || 'text'} className="form-control" />
                    <ErrorMessage name={name} component="div" className="text-danger small" />
                  </div>
                ))}
                <div className="col-12">
                  <label className="form-label" htmlFor="address">Address</label>
                  <Field id="address" name="address" as="textarea" rows="3" className="form-control" />
                  <ErrorMessage name="address" component="div" className="text-danger small" />
                </div>
              </div>
              <button className="btn btn-dark mt-3" type="submit" disabled={isSubmitting}>Register</button>
            </Form>
          )}
        </Formik>
        <button className="btn btn-outline-dark mt-3" type="button" onClick={google} disabled={!firebaseEnabled}>
          <i className="bi bi-google me-2" />Register with Gmail
        </button>
        <p className="mt-3 mb-0">Already riding with us? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}
