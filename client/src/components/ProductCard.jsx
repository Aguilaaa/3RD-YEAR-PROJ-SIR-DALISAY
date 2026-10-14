import { Link } from 'react-router-dom';
import { productPhoto } from '../catalogPhotos';
import { peso } from '../utils/format';

export function ProductCard({ product, badge }) {
  const fitCount = product.models?.length || 0;
  const inStock = product.stockQuantity > 0;

  return (
    <article className="part-card">
      <Link to={`/products/${product.id}`} className="part-media">
        {badge && <span className="part-badge">{badge}</span>}
        <img src={productPhoto(product)} alt={product.name} />
      </Link>
      <p className="part-sku">{product.itemCode}</p>
      <h2>
        <Link to={`/products/${product.id}`}>{product.name}</Link>
      </h2>
      <p className="part-price">{peso(product.price)}</p>
      <p className="part-fit">{fitCount ? `Fits ${fitCount} model${fitCount === 1 ? '' : 's'}` : product.motorcycleBrand}</p>
      <p className="part-stock">{inStock ? 'In stock' : 'On order'}</p>
    </article>
  );
}
