import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiError } from '../api/client';
import { peso, when } from '../utils/format';

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/orders/mine').then(({ data }) => setOrders(data.orders)).catch((loadError) => setError(apiError(loadError)));
  }, []);

  return (
    <div className="container py-4">
      <h1 className="h3">Your orders</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {orders.length === 0 && !error && <div className="alert alert-secondary">You have no orders yet.</div>}
      <div className="table-responsive">
        <table className="table table-dark-moto">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><Link to={`/orders/${order.id}`}>{order.orderNumber}</Link></td>
                <td>{when(order.createdAt)}</td>
                <td><span className="status-pill">{order.status}</span></td>
                <td>{peso(order.grandTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
