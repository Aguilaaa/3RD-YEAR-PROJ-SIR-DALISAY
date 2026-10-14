import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { MAIN_NAV, MORE_NAV } from '../storefront';

export function StoreLayout() {
  const { user, logout, notice, setNotice } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [models, setModels] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [draft, setDraft] = useState(params.get('search') || '');

  useEffect(() => {
    api.get('/models').then(({ data }) => setModels(data.models)).catch(() => {});
  }, []);

  const selected = models.find((model) => model.id === params.get('model'));
  const bikeLabel = selected ? `${selected.brand} ${selected.name}` : 'All models';

  function setModel(id) {
    const next = new URLSearchParams(params);
    if (id) next.set('model', id);
    else next.delete('model');
    setParams(next);
  }

  function submitSearch(event) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    const value = draft.trim();
    if (value) next.set('search', value);
    else next.delete('search');
    setParams(next);
    setSearchOpen(false);
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="store-shell">
      <header className="site-header">
        <div className="announce-bar">
          OEM &amp; AFTERMARKET CFMOTO PARTS · SHIPPED FROM MANILA · SHIPS TO US · CANADA · AU · NZ · UK &amp; EUROPE
        </div>
        <nav className="navbar navbar-expand-xl navbar-dark shop-nav">
          <div className="container-fluid shop-nav-inner">
            <Link className="brand-mark" to="/">MOTOTECH</Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#shopNav" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon" />
            </button>
            <div className="collapse navbar-collapse" id="shopNav">
              <ul className="navbar-nav shop-links mx-auto">
                {MAIN_NAV.map((item) => (
                  <li className="nav-item" key={item.label}>
                    <NavLink
                      className={() => `nav-link${location.pathname === '/' && (params.get('group') || '') === item.group ? ' active' : ''}`}
                      to={item.group ? `/?group=${item.group}` : '/'}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
                <li className="nav-item dropdown">
                  <button className="nav-link dropdown-toggle" type="button" data-bs-toggle="dropdown">More</button>
                  <ul className="dropdown-menu dropdown-menu-dark">
                    {MORE_NAV.map((item) => (
                      <li key={item.group}>
                        <Link className="dropdown-item" to={`/?group=${item.group}`}>{item.label}</Link>
                      </li>
                    ))}
                    {user && <li><Link className="dropdown-item" to="/orders">Orders</Link></li>}
                    {user?.role === 'admin' && <li><Link className="dropdown-item" to="/admin">Admin</Link></li>}
                  </ul>
                </li>
              </ul>
              <div className="shop-tools">
                <div className="dropdown">
                  <button className="bike-pill dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <span className="bike-dot" />
                    <span>Your bike:</span>
                    <strong>{bikeLabel}</strong>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end bike-menu">
                    <li><button className="dropdown-item" type="button" onClick={() => setModel('')}>All models</button></li>
                    {models.map((model) => (
                      <li key={model.id}>
                        <button className="dropdown-item" type="button" onClick={() => setModel(model.id)}>
                          {model.brand} {model.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <button className="icon-btn" type="button" aria-label="Search" onClick={() => setSearchOpen((open) => !open)}>
                  <i className="bi bi-search" />
                </button>
                <Link className="icon-btn" to={user ? '/profile' : '/login'} aria-label="Account">
                  <i className="bi bi-person" />
                </Link>
                <Link className="icon-btn cart-btn" to="/cart" aria-label="Cart">
                  <i className="bi bi-cart3" />
                  {count > 0 && <span className="cart-badge">{count}</span>}
                </Link>
                {user && (
                  <button className="icon-btn" type="button" aria-label="Logout" onClick={logout}>
                    <i className="bi bi-box-arrow-right" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
        {searchOpen && (
          <form className="header-search" onSubmit={submitSearch}>
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Search by product or motorcycle model"
              aria-label="Search by product or motorcycle model"
            />
            <button type="submit">Search</button>
          </form>
        )}
      </header>

      {notice && (
        <div className="container mt-3">
          <div className="alert alert-warning alert-dismissible" role="alert">
            {notice}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setNotice('')} />
          </div>
        </div>
      )}

      <main className="store-main">
        <Outlet />
      </main>

      <footer className="moto-footer">
        <div className="container d-flex flex-column flex-md-row justify-content-between gap-2">
          <strong>MOTOTECH</strong>
          <span>OEM and aftermarket CFMOTO parts. Shipped from Manila.</span>
        </div>
      </footer>
    </div>
  );
}
