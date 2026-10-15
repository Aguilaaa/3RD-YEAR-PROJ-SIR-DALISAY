import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { SAMPLE_PRODUCTS, filterSamples } from '../catalogPhotos';
import { CATEGORY_TILES, GROUP_TO_CATEGORY } from '../storefront';
import { PRICE_OPTIONS, RATING_OPTIONS } from '../utils/format';

export function Home() {
  const [params, setParams] = useSearchParams();
  const [mode, setMode] = useState('pages');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(SAMPLE_PRODUCTS.length);
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const liveRef = useRef(false);
  const appendRef = useRef(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);
  const modeRef = useRef(mode);
  const filterKey = `${params.get('group') || ''}|${params.get('model') || ''}|${params.get('price') || ''}|${params.get('rating') || ''}|${params.get('search') || ''}`;
  const filterKeyRef = useRef(filterKey);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
    api.get('/models').then(({ data }) => setModels(data.models)).catch(() => {});
  }, []);

  const group = params.get('group') || '';
  const categoryName = GROUP_TO_CATEGORY[group] || '';
  const categoryId = categories.find((category) => category.name === categoryName)?.id || '';
  const selectedModel = models.find((model) => model.id === params.get('model'));

  useEffect(() => {
    if (filterKeyRef.current !== filterKey) {
      filterKeyRef.current = filterKey;
      appendRef.current = false;
      if (page !== 1) {
        setPage(1);
        return undefined;
      }
    }

    if (group && categories.length === 0) return undefined;

    let ignore = false;
    const modeChanged = modeRef.current !== mode;
    modeRef.current = mode;
    if (modeChanged && page !== 1) {
      appendRef.current = false;
      setPage(1);
      return undefined;
    }

    function showSamples() {
      const visible = filterSamples(SAMPLE_PRODUCTS, {
        search: params.get('search') || '',
        categoryName,
        price: params.get('price') || '',
        rating: params.get('rating') || '',
        modelId: params.get('model') || '',
        models,
      });
      setProducts(visible);
      setTotal(visible.length);
      setPages(1);
      setError('');
    }

    if (!liveRef.current) showSamples();

    async function load() {
      loadingRef.current = true;
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/products', {
          timeout: 8000,
          params: {
            search: params.get('search') || '',
            category: categoryId,
            price: params.get('price') || '',
            rating: params.get('rating') || '',
            model: params.get('model') || '',
            page,
            limit: 8,
          },
        });
        if (ignore) return;
        liveRef.current = true;
        setPages(data.pages);
        setTotal(data.total);
        setProducts((current) => (appendRef.current ? [...current, ...data.products] : data.products));
        appendRef.current = false;
        if (mode === 'scroll' && page < data.pages) {
          requestAnimationFrame(() => {
            const node = sentinelRef.current;
            if (!node || ignore || loadingRef.current || appendRef.current) return;
            const rect = node.getBoundingClientRect();
            if (rect.top <= window.innerHeight + 240) {
              appendRef.current = true;
              setPage((current) => current + 1);
            }
          });
        }
      } catch (loadError) {
        if (ignore) return;
        if (!liveRef.current) showSamples();
        else setError(loadError.response?.data?.message || 'The product list could not be loaded.');
      } finally {
        loadingRef.current = false;
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [filterKey, page, mode, categoryId, group, categories.length]);

  useEffect(() => {
    if (mode !== 'scroll') return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && page < pages && !loadingRef.current && !appendRef.current) {
        appendRef.current = true;
        setPage((current) => current + 1);
      }
    }, { rootMargin: '240px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode, page, pages, products.length]);

  function updateParams(partial) {
    const next = new URLSearchParams(params);
    Object.entries(partial).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setParams(next);
  }

  function changeMode(next) {
    appendRef.current = false;
    setMode(next);
  }

  return (
    <>
      <section className="hero-fit">
        <img src="/store/hero-track.jpg" alt="" className="hero-photo" />
        <div className="hero-shade" />
        <div className="hero-checks" />
        <div className="container hero-copy">
          <p className="hero-kicker">OEM &amp; aftermarket CFMOTO parts · Guaranteed fitment</p>
          <h1>The right part,<br /><span>the first time.</span></h1>
          <p>
            Tell us your model and we only show parts that fit — every one flagged fits or doesn’t before you buy.
            Genuine OEM and aftermarket performance upgrades, shipped worldwide from Manila.
          </p>
          <div className="hero-actions">
            <a className="btn-red" href="#catalog">Browse parts that fit →</a>
            <a className="btn-ghost" href="#ride">Find my fit</a>
          </div>
          <div className="ride-bar" id="ride">
            <div>
              <p className="ride-kicker">Your ride</p>
              <p className="ride-name">{selectedModel ? `${selectedModel.brand} ${selectedModel.name}` : 'All models'}</p>
              <p className="ride-note">Pick your model and we’ll only show parts that fit.</p>
            </div>
            <div className="dropdown">
              <button className="btn-red dropdown-toggle" type="button" data-bs-toggle="dropdown">Set your bike →</button>
              <ul className="dropdown-menu dropdown-menu-dark">
                <li><button className="dropdown-item" type="button" onClick={() => updateParams({ model: '' })}>All models</button></li>
                {models.map((model) => (
                  <li key={model.id}>
                    <button className="dropdown-item" type="button" onClick={() => updateParams({ model: model.id })}>
                      {model.brand} {model.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="section-head">
            <h2>Shop by category</h2>
            <Link to="/">All categories →</Link>
          </div>
          <div className="category-grid">
            {CATEGORY_TILES.map((tile) => (
              <Link className="category-tile" to={`/?group=${tile.group}`} key={tile.group + tile.title}>
                <img src={tile.image} alt="" />
                <span>{tile.title}</span>
                <small>Shop →</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section" id="catalog">
        <div className="container">
          <div className="section-head">
            <h2>{params.get('search') ? 'Search results' : 'Best sellers'}</h2>
            <span className="result-count">{total} part{total === 1 ? '' : 's'}</span>
          </div>

          <form className="catalog-filters" onSubmit={(event) => event.preventDefault()}>
            <label>
              Price
              <select value={params.get('price') || ''} onChange={(event) => updateParams({ price: event.target.value })}>
                {PRICE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              Category
              <select value={Object.entries(GROUP_TO_CATEGORY).find(([, name]) => name === categoryName)?.[0] || ''} onChange={(event) => updateParams({ group: event.target.value })}>
                <option value="">All categories</option>
                {categories.map((category) => {
                  const match = Object.entries(GROUP_TO_CATEGORY).find(([, name]) => name === category.name);
                  if (!match) return null;
                  return <option key={category.id} value={match[0]}>{category.name}</option>;
                })}
              </select>
            </label>
            <label>
              Rating
              <select value={params.get('rating') || ''} onChange={(event) => updateParams({ rating: event.target.value })}>
                {RATING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <div className="mode-toggle btn-group" role="group" aria-label="Product list mode">
              <button type="button" className={`btn ${mode === 'pages' ? 'active' : ''}`} onClick={() => changeMode('pages')}>Pages</button>
              <button type="button" className={`btn ${mode === 'scroll' ? 'active' : ''}`} onClick={() => changeMode('scroll')}>Infinite scroll</button>
            </div>
          </form>

          {error && <div className="alert alert-danger">{error}</div>}
          <div className="part-grid">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} badge={index === 0 && !params.get('search') ? 'Best seller' : ''} />
            ))}
          </div>
          {!loading && products.length === 0 && !error && (
            <div className="alert alert-secondary mt-3">No parts match that bike and those filters.</div>
          )}
          {loading && products.length === 0 && <p className="catalog-loading">Loading parts…</p>}

          {mode === 'pages' && pages > 1 && (
            <nav className="mt-4" aria-label="Product pages">
              <ul className="pagination">
                {Array.from({ length: pages }, (_, index) => (
                  <li className={`page-item ${page === index + 1 ? 'active' : ''}`} key={index}>
                    <button
                      className="page-link"
                      type="button"
                      onClick={() => {
                        appendRef.current = false;
                        setPage(index + 1);
                        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {mode === 'scroll' && <div ref={sentinelRef} className="scroll-sentinel" />}
        </div>
      </section>
    </>
  );
}
