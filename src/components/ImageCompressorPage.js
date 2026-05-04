import { useState, useEffect, useRef } from 'react';

const QUALITY_PRESETS = [
  { label: 'High Quality', desc: '~40% smaller', quality: 0.8, icon: '' },
  { label: 'Balanced',     desc: '~65% smaller', quality: 0.6, icon: '' },
  { label: 'Small Size',   desc: '~85% smaller', quality: 0.3, icon: '' },
];

const FORMAT_OPTIONS = ['jpeg', 'png', 'webp'];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function ImageCompressorPage({ file, onBack, settings = {} }) {
  const initFormat  = settings.convertFormat || 'jpeg';
  const initQuality = settings.quality ?? 0;

  const [quality, setQuality]       = useState(initQuality);
  const [format, setFormat]         = useState(initFormat);
  const [status, setStatus]         = useState('idle');
  const [outputUrl, setOutputUrl]   = useState(null);
  const [outputSize, setOutputSize] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [file]);

  const handleCompress = () => {
    setStatus('compressing');
    setOutputUrl(null);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
      const q = QUALITY_PRESETS[quality].quality;

      canvas.toBlob((blob) => {
        setOutputSize(blob.size);
        setOutputUrl(URL.createObjectURL(blob));
        setStatus('done');
        URL.revokeObjectURL(url);
      }, mimeType, q);
    };

    img.src = url;
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = `compressed_${file.name.replace(/\.[^.]+$/, '')}.${format}`;
    a.click();
  };

  const savings = outputSize ? Math.round((1 - outputSize / file.size) * 100) : 0;
  const previewUrl = URL.createObjectURL(file);

  return (
    <div className="compressor-page">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="container">
        <button className="btn-back" onClick={onBack}>← Back</button>

        <div className="row">
          {/* Left: file info + settings */}
          <div className="col-md-5">
            <div className="comp-card">
              <h4 className="comp-card-title">🖼️ Source Image</h4>
              <div className="file-info">
                <div className="file-info-row">
                  <span>Name</span>
                  <strong title={file.name}>{file.name.length > 28 ? file.name.slice(0, 25) + '…' : file.name}</strong>
                </div>
                <div className="file-info-row">
                  <span>Size</span>
                  <strong>{formatBytes(file.size)}</strong>
                </div>
                <div className="file-info-row">
                  <span>Type</span>
                  <strong>{file.type}</strong>
                </div>
                {dimensions && (
                  <div className="file-info-row">
                    <span>Dimensions</span>
                    <strong>{dimensions.w} × {dimensions.h}px</strong>
                  </div>
                )}
              </div>
              <img src={previewUrl} alt="preview" className="image-preview" />
            </div>

            <div className="comp-card">
              <h4 className="comp-card-title">⚙️ Compression Settings</h4>

              <label className="settings-label">Quality Preset</label>
              <div className="quality-grid">
                {QUALITY_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    className={`quality-btn${quality === i ? ' active' : ''}`}
                    onClick={() => setQuality(i)}
                    disabled={status === 'compressing'}
                  >
                    <span className="quality-icon">{p.icon}</span>
                    <span className="quality-label">{p.label}</span>
                    <span className="quality-desc">{p.desc}</span>
                  </button>
                ))}
              </div>

              <label className="settings-label">Output Format</label>
              <div className="format-grid">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f}
                    className={`format-btn${format === f ? ' active' : ''}`}
                    onClick={() => setFormat(f)}
                    disabled={status === 'compressing'}
                  >
                    .{f.toUpperCase()}
                  </button>
                ))}
              </div>

              {(status === 'idle' || status === 'done' || status === 'error') && (
                <button className="btn-compress" onClick={handleCompress}>
                  ⚡ Compress Image
                </button>
              )}
              {status === 'compressing' && (
                <button className="btn-compress loading" disabled>
                  <span className="spinner" /> Compressing…
                </button>
              )}
            </div>
          </div>

          {/* Right: output */}
          <div className="col-md-7">
            {status === 'done' && outputUrl && (
              <div className="comp-card output-card">
                <h4 className="comp-card-title">✅ Compression Complete!</h4>

                <div className="result-stats">
                  <div className="result-stat before">
                    <div className="result-stat-label">Original</div>
                    <div className="result-stat-size">{formatBytes(file.size)}</div>
                  </div>
                  <div className="result-arrow">→</div>
                  <div className="result-stat after">
                    <div className="result-stat-label">Compressed</div>
                    <div className="result-stat-size">{formatBytes(outputSize)}</div>
                    {savings > 0
                      ? <div className="result-badge">{savings}% smaller</div>
                      : <div className="result-badge result-badge-warn">No reduction</div>
                    }
                  </div>
                </div>

                <img src={outputUrl} alt="compressed" className="image-preview" />

                <button className="btn-download" onClick={handleDownload}>
                  ⬇️ Download Compressed Image
                </button>
                <button className="btn-compress-again" onClick={() => { setStatus('idle'); setOutputUrl(null); }}>
                  🔄 Compress Again with Different Settings
                </button>
              </div>
            )}

            {status === 'idle' && (
              <div className="comp-card idle-card">
                <div className="idle-icon">🖼️</div>
                <h4>Ready to Compress</h4>
                <p>Choose your quality preset and output format, then click <strong>Compress Image</strong>.</p>
                <ul className="idle-features">
                  <li>✅ 100% in-browser — no uploads</li>
                  <li>✅ Powered by Canvas API</li>
                  <li>✅ Supports JPEG, PNG, WebP output</li>
                  <li>✅ Files never leave your device</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
