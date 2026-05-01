import { useState, useRef, useEffect } from 'react';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadZone({ onFileSelect, file, onReset, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateFile = (f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Unsupported format. Use PNG, JPG, or WEBP.');
      return false;
    }
    if (f.size > MAX_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFile = (f) => {
    if (validateFile(f)) {
      onFileSelect(f);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e) => {
    const f = e.target.files[0];
    if (f) handleFile(f);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  useEffect(() => {
    const handlePaste = (e) => {
      if (disabled) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const pastedFile = items[i].getAsFile();
          if (pastedFile) {
            e.preventDefault();
            
            // Give it a generic name if it doesn't have a meaningful one
            const fileWithProperName = new File(
              [pastedFile], 
              `Pasted_Chart_${new Date().getTime()}.png`, 
              { type: pastedFile.type }
            );
            
            handleFile(fileWithProperName);
            break; // Handle only the first image found
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, onFileSelect]);

  // If a file is already selected, show preview
  if (file) {
    const previewUrl = URL.createObjectURL(file);
    return (
      <div className="upload-preview">
        <div className="preview-header">
          <span className="preview-label">CHART LOADED</span>
          <button className="btn-reset" onClick={onReset} disabled={disabled}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 .49-3.67"></path>
            </svg>
            CHANGE
          </button>
        </div>
        <div className="preview-frame">
          <img
            src={previewUrl}
            alt="Chart preview"
            className="chart-preview"
            onLoad={() => URL.revokeObjectURL(previewUrl)}
          />
          <div className="preview-overlay">
            <div className="scan-line"></div>
          </div>
        </div>
        <div className="preview-meta">
          <span className="meta-item">
            <span className="meta-dot green"></span>
            {file.name}
          </span>
          <span className="meta-item">
            {(file.size / 1024).toFixed(0)} KB
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-zone-wrapper">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        id="upload-zone"
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        aria-label="Upload chart screenshot"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          id="chart-file-input"
        />

        <div className="upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="16 16 12 12 8 16"></polyline>
            <line x1="12" y1="12" x2="12" y2="21"></line>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
          </svg>
        </div>

        <div className="upload-text">
          <p className="upload-title">DROP OR PASTE CHART</p>
          <p className="upload-sub">paste from clipboard (Ctrl+V) or <span className="link-style">browse files</span></p>
          <p className="upload-formats">PNG · JPG · WEBP · max 10MB</p>
        </div>

        <div className="upload-corner tl"></div>
        <div className="upload-corner tr"></div>
        <div className="upload-corner bl"></div>
        <div className="upload-corner br"></div>
      </div>

      {error && (
        <div className="upload-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
