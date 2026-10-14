import { since } from '../lib/format.js';
import { SERIES } from '../lib/series.js';

const TAGS = {
  ok: { className: 'conn-tag ok', text: 'Güncel' },
  unconfigured: { className: 'conn-tag', text: 'Bağlı değil' },
  error: { className: 'conn-tag err', text: 'Hata' },
};

/**
 * Üç durumu da aynı kart çizer. Bir kaynağın düşmesi diğerlerini
 * etkilemediği için pano hiçbir zaman tamamen boş kalmaz.
 */
export default function ConnectorCard({ panel, children }) {
  const tag = TAGS[panel.status] || TAGS.error;
  return (
    <section className="panel-card conn-card">
      <div className="conn-top">
        <span className="conn-name">
          <i className="conn-dot" style={{ background: SERIES[panel.id] || 'var(--muted)' }} />
          {panel.label}
        </span>
        <span className={tag.className}>{tag.text}</span>
      </div>

      <div className="conn-body">
        {panel.status === 'unconfigured' && <p className="conn-note">{panel.message}</p>}

        {panel.status === 'error' && (
          <p className="conn-note">
            <strong>{panel.error}</strong>
            {panel.stale
              ? ` Aşağıdaki bilgiler ${since(panel.fetchedAt)} alınan son kopyadan.`
              : ' Henüz gösterilecek kayıtlı veri yok.'}
          </p>
        )}

        {panel.status === 'ok' && children}
      </div>

      <div className="conn-foot">
        {panel.status === 'unconfigured' ? panel.hint : since(panel.fetchedAt)}
      </div>
    </section>
  );
}
