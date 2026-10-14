import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api, { apiError } from '../api/client';
import { peso, when } from '../utils/format';

export function OrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).catch((loadError) => setError(apiError(loadError, 'That order was not found.')));
  }, [id]);

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/orders">Back to orders</Link>
      </div>
    );
  }
  if (!order) return <div className="page-loading">Loading order…</div>;

  return (
    <div className="container py-4">
      {location.state?.placed && (
        <div className={location.state.emailSent ? 'alert alert-success' : 'alert alert-warning'}>
          Order {order.orderNumber} is pending.
          {location.state.emailSent
            ? ' A receipt with a PDF was sent to your email.'
            : ' The receipt email could not be sent yet.'}
        </div>
      )}
      <p className="eyebrow">Transaction</p>
      <h1 className="h3">{order.orderNumber}</h1>
      <p><span className="status-pill">{order.status}</span></p>
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="table-responsive">
            <table className="table table-dark-moto">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}<div className="small text-secondary">{item.itemCode}</div></td>
                    <td>{item.quantity}</td>
                    <td>{peso(item.unitPrice)}</td>
                    <td>{peso(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2 className="h5 text-end">Grand total {peso(order.grandTotal)}</h2>
        </div>
        <div className="col-lg-5">
          <div className="paper-panel">
            <h2 className="h5">Delivery</h2>
            <p className="mb-1">{order.shippingName}</p>
            <p className="mb-1">{order.contactNumber}</p>
            <p className="mb-1">{order.address}</p>
            <p className="mb-1">{order.customerEmail}</p>
            <p className="mb-0">Payment: {order.paymentMethod}</p>
            <p className="text-secondary mt-3 mb-0">Placed {when(order.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
