import { useState, useEffect } from 'react';
import './App.css';
import UploadZone from './components/UploadZone';
import LoadingState from './components/LoadingState';
import ResultPanel from './components/ResultPanel';
import { analyzeChart, checkBackendHealth, getErrorMessage } from './utils/analyzeChart';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking'); // checking | ok | no-key | unreachable
  const [chartFile, setChartFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then((health) => {
      if (health.status === 'unreachable') setBackendStatus('unreachable');
      else if (!health.api_key_configured) setBackendStatus('no-key');
      else setBackendStatus('ok');
    });
  }, []);

  const handleFileSelect = (file) => {
    setChartFile(file);
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
  };

  const handleReset = () => {
    setChartFile(null);
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
  };

  const handleAnalyze = async () => {
    if (!chartFile) return;
    setStatus('loading');
    setResult(null);
    setErrorMsg('');
    try {
      const analysis = await analyzeChart(chartFile);
      setResult(analysis);
      setStatus('success');
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
      setStatus('error');
    }
  };

  const handleReanalyze = () => {
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
  };

  const isLoading = status === 'loading';
  const canAnalyze = !!chartFile && !isLoading && status !== 'success';

  const statusConfig = {
    checking: { dot: 'checking', label: 'CONNECTING...' },
    ok:        { dot: 'connected', label: 'BACKEND READY' },
    'no-key':  { dot: 'warn', label: 'API KEY MISSING' },
    unreachable: { dot: 'error', label: 'BACKEND OFFLINE' },
  };
  const sc = statusConfig[backendStatus] || statusConfig.checking;

  return (
    <div className="app-wrapper">
      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark">A</div>
          <span className="logo-text">APEX</span>
          <span className="logo-version">v1.0</span>
        </div>
        <div className="header-right">
        </div>
      </header>

      {/* ── BACKEND WARNINGS ── */}
      {backendStatus === 'unreachable' && (
        <div className="server-banner error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Backend is offline. Start it by running: <code>cd apex-backend &amp;&amp; node server.js</code>
        </div>
      )}
      {backendStatus === 'no-key' && (
        <div className="server-banner warn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          API key not set. Add <code>GEMINI_API_KEY=AIzaSy...</code> to <code>apex-backend/.env</code> and restart the server.
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="app-main">

        {/* Hero */}
        <div className="hero">
          <h1 className="hero-title">APEX</h1>
          <p className="hero-sub">AI Trading Signal Analyzer · SMC / ICT Methodology</p>
        </div>

        {/* Upload */}
        <UploadZone
          onFileSelect={handleFileSelect}
          file={chartFile}
          onReset={handleReset}
          disabled={isLoading}
        />

        {/* Execute Button */}
        {chartFile && status !== 'success' && (
          <div className="execute-section">
            <button
              className="btn-execute"
              onClick={handleAnalyze}
              disabled={!canAnalyze || backendStatus === 'unreachable'}
              id="btn-execute-analysis"
            >
              {isLoading ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                  </svg>
                  ANALYZING...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  EXECUTE ANALYSIS
                </>
              )}
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && <LoadingState />}

        {/* Error */}
        {status === 'error' && (
          <div className="error-state" role="alert">
            <div className="error-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p className="error-title">ANALYSIS FAILED</p>
              <p className="error-msg">{errorMsg}</p>
              <button className="btn-retry" onClick={handleAnalyze} id="btn-retry">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.67"/></svg>
                RETRY
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {status === 'success' && result && (
          <ResultPanel result={result} chartFile={chartFile} onReanalyze={handleReanalyze} disabled={isLoading} />
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer className="app-footer">
        <p className="footer-warn">⚠ APEX is an analytical tool only. Not financial advice. Always manage your risk.</p>
        <p>APEX v1.0 · SMC / ICT Methodology</p>
      </footer>
    </div>
  );
}
