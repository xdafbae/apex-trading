export default function ResultPanel({ result, onReanalyze, disabled }) {
  const { signal, confidence, verdict_color } = result;

  const isBuy = signal === 'BUY';
  const isSell = signal === 'SELL';
  const hasSignal = isBuy || isSell;

  const signalClass = verdict_color === 'green' ? 'signal-buy' : verdict_color === 'red' ? 'signal-sell' : 'signal-none';

  const InfoRow = ({ label, value, mono = true }) =>
    value ? (
      <div className="info-row">
        <span className="info-label">{label}</span>
        <span className={`info-value ${mono ? 'mono' : ''}`}>{value}</span>
      </div>
    ) : null;

  return (
    <div className={`result-panel ${signalClass}`} role="region" aria-label="Analysis results">

      {/* ── SIGNAL BADGE ── */}
      <div className="signal-section">
        <div className={`signal-badge ${signalClass}`}>
          <div className="signal-icon">
            {isBuy && (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            )}
            {isSell && (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                <polyline points="17 18 23 18 23 12"></polyline>
              </svg>
            )}
            {!hasSignal && (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            )}
          </div>
          <span className="signal-text">{signal}</span>
        </div>

        {hasSignal && (
          <div className="confidence-block">
            <div className="confidence-header">
              <span className="confidence-label">CONFIDENCE</span>
              <span className="confidence-value">{confidence}%</span>
            </div>
            <div className="confidence-bar-track">
              <div
                className={`confidence-bar-fill ${signalClass}`}
                style={{ width: `${confidence}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* ── ASSET & TIMEFRAME ── */}
      <div className="result-grid-top">
        <div className="result-chip">
          <span className="chip-label">ASSET</span>
          <span className="chip-value">{result.asset_detected || '—'}</span>
        </div>
        <div className="result-chip">
          <span className="chip-label">TIMEFRAME</span>
          <span className="chip-value">{result.timeframe_detected || '—'}</span>
        </div>
        {hasSignal && result.rrr && (
          <div className="result-chip highlight">
            <span className="chip-label">R:R RATIO</span>
            <span className="chip-value">{result.rrr}</span>
          </div>
        )}
      </div>

      {/* ── MARKET STRUCTURE ── */}
      {result.market_structure && (
        <div className="result-section">
          <h3 className="section-title">MARKET STRUCTURE</h3>
          <p className="section-body">{result.market_structure}</p>
        </div>
      )}

      {/* ── KEY LEVELS ── */}
      {result.key_levels?.length > 0 && (
        <div className="result-section">
          <h3 className="section-title">KEY LEVELS</h3>
          <div className="level-tags">
            {result.key_levels.map((level, i) => (
              <span key={i} className="level-tag">{level}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── PATTERN ── */}
      {result.pattern_identified && (
        <div className="result-section">
          <h3 className="section-title">PATTERN IDENTIFIED</h3>
          <p className="pattern-value">{result.pattern_identified}</p>
        </div>
      )}

      {/* ── TRADE PLAN ── */}
      {hasSignal && (result.entry_zone || result.stop_loss || result.take_profit) && (
        <div className="result-section trade-plan">
          <h3 className="section-title">TRADE PLAN</h3>
          <div className="trade-grid">
            {result.entry_zone && (
              <div className="trade-row">
                <span className="trade-label">ENTRY</span>
                <span className="trade-value entry">{result.entry_zone}</span>
              </div>
            )}
            {result.stop_loss && (
              <div className="trade-row">
                <span className="trade-label">STOP LOSS</span>
                <span className="trade-value sl">{result.stop_loss}</span>
              </div>
            )}
            {result.take_profit && (
              <div className="trade-row">
                <span className="trade-label">TAKE PROFIT</span>
                <span className="trade-value tp">{result.take_profit}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EXPERT REASONING ── */}
      {result.reasoning && (
        <div className="result-section">
          <h3 className="section-title">EXPERT REASONING</h3>
          <blockquote className="reasoning-block">
            <div className="reasoning-quote-mark">"</div>
            <p className="reasoning-text">{result.reasoning}</p>
          </blockquote>
        </div>
      )}

      {/* ── RISK WARNINGS ── */}
      {result.warnings?.length > 0 && (
        <div className="result-section">
          <h3 className="section-title warning-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            RISK WARNINGS
          </h3>
          <ul className="warning-list">
            {result.warnings.map((w, i) => (
              <li key={i} className="warning-item">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── DISCLAIMER ── */}
      <div className="result-disclaimer">
        APEX is an analytical tool only. This is not financial advice. Trade at your own risk.
      </div>

      {/* ── RE-ANALYZE BUTTON ── */}
      <button
        className="btn-reanalyze"
        onClick={onReanalyze}
        disabled={disabled}
        id="btn-reanalyze"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 .49-3.67"></path>
        </svg>
        RE-ANALYZE
      </button>
    </div>
  );
}
