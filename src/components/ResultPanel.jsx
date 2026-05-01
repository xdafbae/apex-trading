import { useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';

const ACTION_COLOR = {
  BUY: 'var(--green)',
  SELL: 'var(--red)',
  WATCH: '#ffaa00',
};
const ACTION_BG = {
  BUY: 'rgba(0,255,136,0.08)',
  SELL: 'rgba(255,51,102,0.08)',
  WATCH: 'rgba(255,170,0,0.08)',
};
const ACTION_LABEL = {
  BUY: '↑ BUY',
  SELL: '↓ SELL',
  WATCH: '◉ WATCH',
};

export default function ResultPanel({ result, chartFile, onReanalyze, disabled }) {
  const { signal, confidence, verdict_color } = result;
  const [activeZone, setActiveZone] = useState(null);

  const isBuy = signal === 'BUY';
  const isSell = signal === 'SELL';
  const hasSignal = isBuy || isSell;
  const signalClass = verdict_color === 'green' ? 'signal-buy' : verdict_color === 'red' ? 'signal-sell' : 'signal-none';

  const chartUrl = useMemo(() => {
    if (!chartFile) return null;
    return URL.createObjectURL(chartFile);
  }, [chartFile]);

  const zoneGuide = result.zone_guide || [];

  return (
    <div className="result-wrapper" role="region" aria-label="Analysis results">

      {/* ── SPLIT VIEW ── */}
      <div className="split-view">

        {/* LEFT — Chart + Zone Guide */}
        <div className="split-left">
          <div className="chart-panel">
            <div className="chart-panel-header">
              <span className="chart-panel-label">CHART ANALISIS</span>
              <span className="chart-panel-meta">{result.asset_detected} · {result.timeframe_detected}</span>
            </div>
            {chartUrl && (
              <div className="chart-image-wrap">
                <img
                  src={chartUrl}
                  alt="Chart yang dianalisis"
                  className="chart-image-full"
                />
                <div className="chart-scan-line"></div>
                {zoneGuide.map((zone, i) => {
                  if (!zone.box_2d || zone.box_2d.length !== 4 || zone.box_2d.every(v => v === 0)) return null;
                  const [ymin, xmin, ymax, xmax] = zone.box_2d;
                  const isActive = activeZone === i;
                  // Handle cases where AI returns invalid coordinates
                  if (ymin >= ymax || xmin >= xmax) return null;
                  
                  return (
                    <div
                      key={`box-${i}`}
                      className={`chart-bbox ${isActive ? 'active' : ''}`}
                      style={{
                        top: `${ymin / 10}%`,
                        left: `${xmin / 10}%`,
                        height: `${(ymax - ymin) / 10}%`,
                        width: `${(xmax - xmin) / 10}%`,
                        '--bbox-color': ACTION_COLOR[zone.action] || 'var(--green)',
                        '--bbox-bg': ACTION_BG[zone.action] || 'rgba(0,255,136,0.1)',
                      }}
                      onMouseEnter={() => setActiveZone(i)}
                      onMouseLeave={() => setActiveZone(null)}
                    >
                      <div className="bbox-label">{zone.label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Zone Guide */}
            {zoneGuide.length > 0 && (
              <div className="zone-guide">
                <div className="zone-guide-header">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  PANDUAN ZONA EDUKASI
                </div>
                <p className="zone-guide-sub">Klik zona untuk melihat penjelasan · Pelajari kapan harus BUY / SELL</p>
                <div className="zone-cards">
                  {zoneGuide.map((zone, i) => (
                    <div
                      key={i}
                      className={`zone-card ${activeZone === i ? 'zone-card-active' : ''}`}
                      onClick={() => setActiveZone(activeZone === i ? null : i)}
                      style={{
                        '--zone-color': ACTION_COLOR[zone.action] || 'var(--text-dim)',
                        '--zone-bg': ACTION_BG[zone.action] || 'transparent',
                      }}
                    >
                      <div className="zone-card-top">
                        <div className="zone-info">
                          <span className="zone-label">{zone.label}</span>
                          <span className="zone-price">{zone.price_area}</span>
                        </div>
                        <span
                          className="zone-action-badge"
                          style={{ color: ACTION_COLOR[zone.action], background: ACTION_BG[zone.action], border: `1px solid ${ACTION_COLOR[zone.action]}33` }}
                        >
                          {ACTION_LABEL[zone.action] || zone.action}
                        </span>
                      </div>
                      {activeZone === i && (
                        <div className="zone-description">
                          <p>{zone.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Analysis Result */}
        <div className="split-right">
          <div className={`result-panel ${signalClass}`}>
            
            {/* Action Buttons */}
            <div className="action-buttons" id="pdf-hide-actions">
              <button 
                className="btn-action"
                onClick={() => {
                  const text = `APEX Trading Analysis\nAsset: ${result.asset_detected} | TF: ${result.timeframe_detected}\nSignal: ${signal} (Confidence: ${confidence}%)\n\nMarket Structure:\n${result.market_structure}\n\nExpert Reasoning:\n${result.reasoning}`;
                  navigator.clipboard.writeText(text);
                  Swal.fire({
                    title: 'Berhasil Disalin!',
                    text: 'Teks analisa telah disalin ke clipboard.',
                    icon: 'success',
                    background: '#15161c',
                    color: '#fff',
                    confirmButtonColor: '#00ff88',
                    timer: 2000,
                    showConfirmButton: false
                  });
                }}
                title="Salin teks analisa"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                SALIN
              </button>
              <button 
                className="btn-action"
                onClick={async () => {
                  const element = document.querySelector('.split-view');
                  const actions = document.getElementById('pdf-hide-actions');
                  if (actions) actions.style.display = 'none';
                  
                  try {
                    // Simpan style asli
                    const originalWidth = element.style.width;
                    const originalBg = element.style.backgroundColor;
                    const originalPadding = element.style.padding;
                    const originalBorderRadius = element.style.borderRadius;
                    
                    // Paksa style khusus PDF agar tidak berantakan & tidak putih
                    element.classList.add('pdf-export-mode');
                    element.style.width = '1200px'; 
                    element.style.backgroundColor = '#0b0c10'; // Dark theme background
                    element.style.padding = '30px';
                    element.style.borderRadius = '0px'; // Hindari rounded corners terpotong
                    
                    // Ambil screenshot kualitas tinggi
                    const canvas = await html2canvas(element, {
                      scale: 2, // Kualitas HD
                      useCORS: true,
                      backgroundColor: '#0b0c10',
                      logging: false
                    });
                    
                    // Kembalikan style seperti semula
                    element.classList.remove('pdf-export-mode');
                    element.style.width = originalWidth;
                    element.style.backgroundColor = originalBg;
                    element.style.padding = originalPadding;
                    element.style.borderRadius = originalBorderRadius;
                    if (actions) actions.style.display = 'flex';
                    
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    
                    // Buat PDF dengan ukuran yang SAMA PERSIS dengan hasil screenshot
                    const pdf = new jsPDF({
                      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                      unit: 'px',
                      format: [canvas.width, canvas.height]
                    });
                    
                    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
                    pdf.save(`APEX_${result.asset_detected || 'Analysis'}.pdf`);
                  } catch (err) {
                    console.error("Gagal membuat PDF:", err);
                    if (actions) actions.style.display = 'flex';
                  }
                }}
                title="Download sebagai PDF"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                PDF
              </button>
            </div>

            {/* Signal Badge */}
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
                    <div className={`confidence-bar-fill ${signalClass}`} style={{ width: `${confidence}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Asset & Timeframe */}
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

            {/* Market Structure */}
            {result.market_structure && (
              <div className="result-section">
                <h3 className="section-title">MARKET STRUCTURE</h3>
                <p className="section-body">{result.market_structure}</p>
              </div>
            )}

            {/* Key Levels */}
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

            {/* Pattern */}
            {result.pattern_identified && (
              <div className="result-section">
                <h3 className="section-title">PATTERN IDENTIFIED</h3>
                <p className="pattern-value">{result.pattern_identified}</p>
              </div>
            )}

            {/* Trade Plan */}
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

            {/* Expert Reasoning */}
            {result.reasoning && (
              <div className="result-section">
                <h3 className="section-title">EXPERT REASONING</h3>
                <blockquote className="reasoning-block">
                  <div className="reasoning-quote-mark">"</div>
                  <p className="reasoning-text">{result.reasoning}</p>
                </blockquote>
              </div>
            )}

            {/* Risk Warnings */}
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

            {/* Disclaimer */}
            <div className="result-disclaimer">
              APEX is an analytical tool only. This is not financial advice. Trade at your own risk.
            </div>

            {/* Re-analyze Button */}
            <button className="btn-reanalyze" onClick={onReanalyze} disabled={disabled} id="btn-reanalyze">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 .49-3.67"></path>
              </svg>
              ANALISA CHART BARU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
