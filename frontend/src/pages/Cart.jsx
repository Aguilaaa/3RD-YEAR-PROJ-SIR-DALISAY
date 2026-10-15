import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { apiError } from '../api/client';
import { useCart } from '../context/CartContext';
import { peso } from '../utils/format';

export function Cart() {
  const { cart, setCart } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);

  async function changeQty(item, quantity) {
    setError('');
    try {
      const { data } = await api.patch(`/cart/items/${item.id}`, { quantity });
      setCart(data);
    } catch (qtyError) {
      setError(apiError(qtyError));
    }
  }

  async function confirmRemove() {
    try {
      const { data } = await api.delete(`/cart/items/${pending.id}`);
      setCart(data);
      setPending(null);
    } catch (removeError) {
      setError(apiError(removeError));
      setPending(null);
    }
  }

  return (
    <div className="container py-4">
      <h1 className="h3">Your cart</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {cart.items.length === 0 ? (
        <div className="alert alert-secondary">Your cart is empty. <Link to="/">Browse parts</Link></div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="table-responsive">
              <table className="table table-dark-moto align-middle">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/products/${item.productId}`}>{item.name}</Link>
                        <div className="small text-secondary">{item.itemCode}</div>
                      </td>
                      <td>{peso(item.price)}</td>
                      <td style={{ maxWidth: 110 }}>
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.quantity}
                          onChange={(event) => changeQty(item, Number(event.target.value))}
                        />
                      </td>
                      <td>{peso(item.subtotal)}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-light" type="button" onClick={() => setPending(item)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="paper-panel">
              <h2 className="h5">Summary</h2>
              {cart.items.map((item) => (
                <div className="d-flex justify-content-between" key={item.id}>
                  <span>{item.name}</span>
                  <span>{peso(item.subtotal)}</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Grand total</strong>
                <strong>{peso(cart.grandTotal)}</strong>
              </div>
              <button className="btn btn-dark w-100 mt-3" type="button" onClick={() => navigate('/checkout')}>Checkout</button>
            </div>
          </div>
        </div>
      )}

      {pending && (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title h5">Remove item</h2>
                </div>
                <div className="modal-body">Remove {pending.name} from your cart?</div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setPending(null)}>Keep it</button>
                  <button className="btn btn-danger" type="button" onClick={confirmRemove}>Remove</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}
