import Badges from './Badges';

// Hızlı taranan QR menü kartı: güçlü görsel, net fiyat ve tek dokunuşla detay.
export default function ProductCard({ item, ui, onClick, isFav, onToggleFav }) {
  return (
    <article
      onClick={onClick}
      className="yg-product-card"
    >
      <img
        src={item.thumb}
        alt={item.name}
        width="112"
        height="112"
        loading="lazy"
        className="yg-product-card__image"
      />

      <div className="yg-product-card__body">
        <div className="yg-product-card__heading">
          <h3
            className="yg-product-card__title"
          >
            {item.name}
          </h3>
          {item.isMarket ? (
            <span className="yg-product-card__market">
              {item.priceText}
            </span>
          ) : (
            <span className="yg-product-card__price">
              {item.priceText}
            </span>
          )}
        </div>

        <Badges item={item} ui={ui} />

        {item.desc && (
          <p
            className="yg-product-card__desc"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.desc}
          </p>
        )}

        {(item.kcalText || item.portion) && (
          <div className="yg-product-card__meta">
            {item.kcalText && <span>{item.kcalText}</span>}
            {item.kcalText && item.portion && <span>·</span>}
            {item.portion && <span>{item.portion}</span>}
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav(item.id);
        }}
        aria-label={isFav ? ui.removeFavorite : ui.addFavorite}
        aria-pressed={isFav}
        className={`yg-product-card__favorite${isFav ? ' is-active' : ''}`}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20.3 C6.4 15.6 3.5 12.4 3.5 9 C3.5 6.4 5.5 4.5 8 4.5 C9.6 4.5 11.1 5.3 12 6.7 C12.9 5.3 14.4 4.5 16 4.5 C18.5 4.5 20.5 6.4 20.5 9 C20.5 12.4 17.6 15.6 12 20.3 Z"
            fill={isFav ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      </button>
    </article>
  );
}
