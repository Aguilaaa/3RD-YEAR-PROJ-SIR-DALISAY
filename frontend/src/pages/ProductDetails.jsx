import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import api, { apiError, apiFieldErrors } from '../api/client';
import { Stars } from '../components/Stars';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productPhoto } from '../catalogPhotos';
import { peso, when } from '../utils/format';
import { reviewSchema } from '../validation/schemas';

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCart } = useCart();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [quantity, setQuantity] = useState(1);

  const form = useForm({
    resolver: yupResolver(reviewSchema),
    defaultValues: { rating: 5, comment: '' },
  });

  async function load() {
    const response = await api.get(`/products/${id}`);
    setData(response.data);
    if (response.data.myReview) {
      form.reset({ rating: response.data.myReview.rating, comment: response.data.myReview.comment });
    }
  }

  useEffect(() => {
    setError('');
    load().catch((loadError) => setError(apiError(loadError, 'That product was not found.')));
  }, [id, user?.id]);

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/" className="btn btn-moto">Back to the shop</Link>
      </div>
    );
  }

  if (!data) return <div className="page-loading">Loading product…</div>;

  const { product, reviews, canReview, myReview } = data;
  const ratingValue = form.watch('rating');

  async function addToCart() {
    if (!user) {
      navigate('/login', { state: { from: `/products/${product.id}` } });
      return;
    }
    try {
      const response = await api.post('/cart/items', { productId: product.id, quantity: Number(quantity) });
      setCart(response.data);
      setNotice('Added to your cart.');
      setError('');
    } catch (cartError) {
      setError(apiError(cartError));
    }
  }

  async function saveReview(values) {
    try {
      if (myReview) await api.put(`/reviews/${myReview.id}`, values);
      else await api.post(`/products/${product.id}/reviews`, values);
      setNotice(myReview ? 'Your review was updated.' : 'Your review was posted.');
      await load();
    } catch (reviewError) {
      const fields = apiFieldErrors(reviewError);
      Object.entries(fields).forEach(([key, message]) => form.setError(key, { message }));
      if (!Object.keys(fields).length) setError(apiError(reviewError));
    }
  }

  return (
    <div className="container py-4">
      {notice && <div className="alert alert-success">{notice}</div>}
      {error && data && <div className="alert alert-danger">{error}</div>}
      <div className="row g-4">
        <div className="col-lg-6">
          <div id="productGallery" className="carousel slide gallery-frame">
            {product.images.length > 1 && (
              <div className="carousel-indicators">
                {product.images.map((image, index) => (
                  <button
                    type="button"
                    key={image.id}
                    data-bs-target="#productGallery"
                    data-bs-slide-to={index}
                    className={index === 0 ? 'active' : ''}
                    aria-current={index === 0 ? 'true' : undefined}
                    aria-label={`Photo ${index + 1} of ${product.images.length}`}
                  />
                ))}
              </div>
            )}
            <div className="carousel-inner">
              {(product.images.length ? product.images : [{ id: 'fallback', url: productPhoto({ categoryName: product.category?.name }) }]).map((image, index) => (
                <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={image.id}>
                  {image.url ? (
                    <img src={image.url} alt={`${product.name} photo ${index + 1}`} />
                  ) : (
                    <div className="media-fallback" style={{ height: 460 }}><i className="bi bi-image" /></div>
                  )}
                </div>
              ))}
            </div>
            {product.images.length > 1 && (
              <>
                <button className="carousel-control-prev" type="button" data-bs-target="#productGallery" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true" />
                  <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#productGallery" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true" />
                  <span className="visually-hidden">Next</span>
                </button>
                <span className="gallery-counter">{product.images.length} photos</span>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="gallery-thumbs" role="tablist" aria-label="Other product photos">
              {product.images.map((image, index) => (
                <button
                  type="button"
                  key={image.id}
                  className={index === 0 ? 'active' : ''}
                  data-bs-target="#productGallery"
                  data-bs-slide-to={index}
                  aria-label={`Show photo ${index + 1} of ${product.images.length}`}
                >
                  <img src={image.url} alt="" />
                  <span>{index + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="col-lg-6">
          <p className="eyebrow">{product.category?.name}</p>
          <h1 className="display-6">{product.name}</h1>
          <p className="text-secondary mb-1">{product.itemCode} · {product.unit}</p>
          <p><Stars value={product.averageRating} /> <span className="text-secondary">{product.averageRating} ({product.ratingCount})</span></p>
          <p className="display-6">{peso(product.price)}</p>
          <p>{product.description}</p>
          <h2 className="h6">Compatible with</h2>
          <div className="mb-3">
            {product.models.map((model) => (
              <span className="model-chip" key={model.id}>{model.brand} {model.name}</span>
            ))}
          </div>
          <p className="text-secondary">{product.stockQuantity} in stock</p>
          <div className="d-flex gap-2">
            <input
              className="form-control"
              style={{ maxWidth: 100 }}
              type="number"
              min="1"
              max={product.stockQuantity}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            <button className="btn btn-moto" type="button" onClick={addToCart} disabled={product.stockQuantity < 1 || product.status !== 'Active'}>
              Add to cart
            </button>
          </div>
        </div>
      </div>

      <section className="mt-5">
        <h2 className="h4">Reviews</h2>
        {(canReview || myReview) && user && (
          <form className="paper-panel paper-form mb-4" onSubmit={form.handleSubmit(saveReview)} noValidate>
            <h3 className="h5">{myReview ? 'Update your review' : 'Write a review'}</h3>
            <p className="text-secondary">Verified purchase only. Offensive words are masked before the review is saved.</p>
            <div className="rating-picker mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button type="button" key={star} className={star <= ratingValue ? 'on' : ''} onClick={() => form.setValue('rating', star, { shouldValidate: true })}>
                  <i className="bi bi-star-fill" />
                </button>
              ))}
            </div>
            {form.formState.errors.rating && <div className="text-danger small mb-2">{form.formState.errors.rating.message}</div>}
            <textarea className="form-control" rows="4" maxLength={500} {...form.register('comment')} />
            {form.formState.errors.comment && <div className="text-danger small mt-1">{form.formState.errors.comment.message}</div>}
            <button className="btn btn-dark mt-3" type="submit" disabled={form.formState.isSubmitting}>
              {myReview ? 'Update review' : 'Post review'}
            </button>
          </form>
        )}
        {!user && <div className="alert alert-secondary">Log in after a completed purchase to review this product.</div>}
        {reviews.length === 0 && <p className="text-secondary">No reviews yet.</p>}
        {reviews.map((review) => (
          <article className="border-bottom border-secondary py-3" key={review.id}>
            <div className="d-flex justify-content-between gap-3">
              <strong>{review.author}</strong>
              <Stars value={review.rating} />
            </div>
            <span className="badge text-bg-success mt-1">Verified Purchase</span>
            <p className="mb-1 mt-2">{review.comment}</p>
            <small className="text-secondary">
              {when(review.createdAt)}
              {review.updatedAt && new Date(review.updatedAt) - new Date(review.createdAt) > 2000 ? ' · Edited' : ''}
            </small>
          </article>
        ))}
      </section>
    </div>
  );
}
