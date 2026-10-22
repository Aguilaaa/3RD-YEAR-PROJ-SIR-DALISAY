import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="status-page">
      <div>
        <h1>404</h1>
        <p>That page is not on this ride.</p>
        <Link className="btn btn-moto" to="/">Back to the shop</Link>
      </div>
    </div>
  );
}

export function AccessDenied() {
  return (
    <div className="status-page">
      <div>
        <h1>403</h1>
        <p>Access Denied. This area is for MotoTech administrators.</p>
        <Link className="btn btn-moto" to="/">Back to the shop</Link>
      </div>
    </div>
  );
}
