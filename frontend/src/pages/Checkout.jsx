import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import api, { apiError, apiFieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { peso } from '../utils/format';
import { checkoutSchema } from '../validation/schemas';

export function Checkout() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const form = useForm({
    resolver: yupResolver(checkoutSchema),
    defaultValues: {
      shippingName: `${user.firstName} ${user.lastName}`.trim(),
      contactNumber: user.contactNumber || '',
      address: user.address || '',
      paymentMethod: 'Cash on Delivery',
    },
  });

  if (cart.items.length === 0) {
    return (
      <div className="container py-4">
        <div className="alert alert-secondary">Your cart is empty. <Link to="/">Browse parts</Link></div>
      </div>
    );
  }

  async function onSubmit(values) {
    setFormError('');
    try {
      const { data } = await api.post('/orders/checkout', values);
      await refresh();
      navigate(`/orders/${data.order.id}`, { replace: true, state: { placed: true, emailSent: data.emailSent } });
    } catch (error) {
      const fields = apiFieldErrors(error);
      Object.entries(fields).forEach(([key, message]) => form.setError(key, { message }));
      if (!Object.keys(fields).length) setFormError(apiError(error));
    }
  }

  return (
    <div className="container py-4">
      <h1 className="h3">Checkout</h1>
      {formError && <div className="alert alert-danger">{formError}</div>}
      <div className="row g-4">
        <div className="col-lg-7">
          <form className="paper-panel paper-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="shippingName">Shipping name</label>
              <input id="shippingName" className="form-control" {...form.register('shippingName')} />
              {form.formState.errors.shippingName && <div className="text-danger small">{form.formState.errors.shippingName.message}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="contactNumber">Contact number</label>
              <input id="contactNumber" className="form-control" {...form.register('contactNumber')} />
              {form.formState.errors.contactNumber && <div className="text-danger small">{form.formState.errors.contactNumber.message}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="address">Address</label>
              <textarea id="address" rows="3" className="form-control" {...form.register('address')} />
              {form.formState.errors.address && <div className="text-danger small">{form.formState.errors.address.message}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="paymentMethod">Payment method</label>
              <select id="paymentMethod" className="form-select" {...form.register('paymentMethod')}>
                <option>Cash on Delivery</option>
                <option>Manual Payment</option>
              </select>
              {form.formState.errors.paymentMethod && <div className="text-danger small">{form.formState.errors.paymentMethod.message}</div>}
            </div>
            <button className="btn btn-dark" type="submit" disabled={form.formState.isSubmitting}>Place order</button>
          </form>
        </div>
        <div className="col-lg-5">
          <div className="paper-panel">
            <h2 className="h5">Order summary</h2>
            {cart.items.map((item) => (
              <div className="d-flex justify-content-between mb-2" key={item.id}>
                <span>{item.name} × {item.quantity}</span>
                <span>{peso(item.subtotal)}</span>
              </div>
            ))}
            <hr />
            <div className="d-flex justify-content-between">
              <strong>Grand total</strong>
              <strong>{peso(cart.grandTotal)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
