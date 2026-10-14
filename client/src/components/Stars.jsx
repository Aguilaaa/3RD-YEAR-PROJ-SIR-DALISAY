export function Stars({ value = 0 }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="stars" aria-label={`${value || 0} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i key={star} className={`bi ${star <= rounded ? 'bi-star-fill' : 'bi-star'}`} />
      ))}
    </span>
  );
}
