import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// ── Constants ──────────────────────────────────────────────────────────────
const VIDEO_QUALITY = [
  { label: 'High Quality', desc: '~30% smaller', crf: 28, icon: '🏆' },
  { label: 'Balanced',     desc: '~60% smaller', crf: 35, icon: '⚖️' },
  { label: 'Small Size',   desc: '~80% smaller', crf: 42, icon: '💾' },
];
const IMAGE_QUALITY = [
  { label: 'High Quality', desc: '~40% smaller', q: 0.8, icon: '🏆' },
  { label: 'Balanced',     desc: '~65% smaller', q: 0.6, icon: '⚖️' },
  { label: 'Small Size',   desc: '~85% smaller', q: 0.3, icon: '💾' },
];
const VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'avi'];
const IMAGE_FORMATS = ['jpeg', 'png', 'webp'];

const brands   = ['YouTube','Google','Netflix','Dropbox','Slack','Zoom'];
const brandEmoji = { YouTube:'▶️', Google:'🔍', Netflix:'🎬', Dropbox:'📦', Slack:'💬', Zoom:'📹' };

const steps = [
  { num:'1', icon:'📤', title:'Upload File',           desc:'Drag & drop or browse to select your video or image.' },
  { num:'2', icon:'⚙️', title:'Choose Settings',       desc:'Pick quality preset and output format.' },
  { num:'3', icon:'⬇️', title:'Download Compressed',   desc:'Get your compressed file instantly.' },
];
const useCases = [
  { icon:'📧', title:'Email Sharing',   desc:'Shrink files to fit email attachment limits.' },
  { icon:'🎮', title:'Discord Uploads', desc:'Compress clips under 8MB to share on Discord.' },
  { icon:'💾', title:'Save Storage',    desc:'Free up space on your device or cloud storage.' },
  { icon:'🌐', title:'Web Publishing',  desc:'Optimize files for faster loading on websites.' },
];
const faqs = [
  { q:'Is VideoCompress AI free?',              a:'Yes! Core compression is completely free.' },
  { q:'What is the maximum file size?',         a:'Up to 500MB for free users.' },
  { q:'Are my files stored on your servers?',   a:'No. Files are processed in-browser and never uploaded.' },
  { q:'Which formats are supported?',           a:'MP4, MOV, AVI, MKV, WebM, FLV, WMV, JPEG, PNG, WebP and more.' },
  { q:'Will compression reduce quality?',       a:'Our engine balances size and quality. You choose the preset.' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(b) {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(2))} ${s[i]}`;
}
function formatDuration(s) {
  const m = Math.floor(s / 60).toString().padStart(2,'0');
  return `${m}:${Math.floor(s % 60).toString().padStart(2,'0')}`;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function HomePage() {
  const [tab, setTab]           = useState('video');
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState(null);
  const [openFaq, setOpenFaq]   = useState(null);
  const fileInputRef            = useRef(null);
  const compressorRef           = useRef(null);

  // Video compression state
  const [vQuality, setVQuality]   = useState(1);
  const [vFormat, setVFormat]     = useState('mp4');
  const [vStatus, setVStatus]     = useState('idle');
  const [vProgress, setVProgress] = useState(0);
  const [vOutput, setVOutput]     = useState(null);
  const [vOutSize, setVOutSize]   = useState(null);
  const [vDuration, setVDuration] = useState(null);
  const [vError, setVError]       = useState('');
  const [vCustomMB, setVCustomMB] = useState('');
  const ffmpegRef                 = useRef(null);

  // Image compression state
  const [iQuality, setIQuality]   = useState(0);
  const [iFormat, setIFormat]     = useState('jpeg');
  const [iStatus, setIStatus]     = useState('idle');
  const [iOutput, setIOutput]     = useState(null);
  const [iOutSize, setIOutSize]   = useState(null);
  const [iDimensions, setIDimensions] = useState(null);
  const canvasRef                 = useRef(null);

  // Stable preview URL — created once per file, revoked on cleanup
  const [previewUrl, setPreviewUrl] = useState(null);

  const isVideo = file?.type.startsWith('video/');
  const isImage = file?.type.startsWith('image/');

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Scroll to compressor when file is picked
  useEffect(() => {
    if (file && compressorRef.current) {
      setTimeout(() => compressorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [file]);

  // Read video duration
  useEffect(() => {
    if (!file || !isVideo) return;
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.src = url;
    vid.onloadedmetadata = () => { setVDuration(vid.duration); URL.revokeObjectURL(url); };
  }, [file, isVideo]);

  // Read image dimensions
  useEffect(() => {
    if (!file || !isImage) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setIDimensions({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.src = url;
  }, [file, isImage]);

  const resetFile = useCallback(() => {
    setFile(null);
    setVStatus('idle'); setVOutput(null); setVOutSize(null); setVProgress(0); setVError(''); setVCustomMB('');
    setIStatus('idle'); setIOutput(null); setIOutSize(null); setIDimensions(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const pickFile = (f) => {
    if (!f) return;
    resetFile();
    if (tab === 'video' && f.type.startsWith('video/')) setFile(f);
    else if (tab === 'image' && f.type.startsWith('image/')) setFile(f);
    else alert(`Please select a ${tab} file.`);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  };

  // ── Video Compression ──
  const compressVideo = async () => {
    setVStatus('loading'); setVProgress(0); setVOutput(null); setVError('');
    try {
      if (!ffmpegRef.current) {
        const ffmpeg = new FFmpeg();
        const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`,   'text/javascript'),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        ffmpegRef.current = ffmpeg;
      }
      const ffmpeg = ffmpegRef.current;
      setVStatus('compressing');
      ffmpeg.on('progress', ({ progress: p }) => setVProgress(Math.round(Math.max(0, Math.min(100, p * 100)))));

      const ext = file.name.split('.').pop().toLowerCase();
      const inName  = `input.${ext}`;
      const outName = `output.${vFormat}`;
      await ffmpeg.writeFile(inName, await fetchFile(file));

      const crf = VIDEO_QUALITY[vQuality].crf;
      let args;
      if (vCustomMB && parseFloat(vCustomMB) > 0) {
        const targetBits  = parseFloat(vCustomMB) * 8 * 1024 * 1024;
        const dur         = vDuration || 60;
        const videoBitrate = Math.max(100, Math.floor((targetBits / dur) * 0.9 / 1000));
        args = ['-i', inName, '-c:v', 'libx264', '-b:v', `${videoBitrate}k`, '-preset', 'fast', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', outName];
      } else if (vFormat === 'webm') {
        args = ['-i', inName, '-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-c:a', 'libopus', outName];
      } else {
        args = ['-i', inName, '-c:v', 'libx264', '-crf', String(crf), '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outName];
      }

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data.buffer], { type: `video/${vFormat}` });
      setVOutSize(blob.size);
      setVOutput(URL.createObjectURL(blob));
      setVStatus('done'); setVProgress(100);
    } catch (e) {
      setVError(e.message || 'Compression failed. Try a different format.');
      setVStatus('error');
    }
  };

  // ── Image Compression ──
  const compressImage = () => {
    if (!file || !canvasRef.current) return;
    setIStatus('compressing'); setIOutput(null); setIOutSize(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = canvasRef.current;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d', { alpha: iFormat === 'png' });
        ctx.drawImage(img, 0, 0);

        const mime = iFormat === 'png' ? 'image/png' : iFormat === 'webp' ? 'image/webp' : 'image/jpeg';
        const q = IMAGE_QUALITY[iQuality].q;

        canvas.toBlob((blob) => {
          if (!blob) {
            alert('Compression failed. Try a different format.');
            setIStatus('idle');
            return;
          }
          setIOutSize(blob.size);
          setIOutput(URL.createObjectURL(blob));
          setIStatus('done');
        }, mime, iFormat === 'png' ? undefined : q);
      } catch (err) {
        console.error(err);
        alert('Image compression failed.');
        setIStatus('idle');
      }
    };
    img.onerror = () => {
      alert('Failed to load image.');
      setIStatus('idle');
    };
    img.src = previewUrl;
  };

  const download = (url, name) => {
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  };

  const vSavings = vOutSize ? Math.round((1 - vOutSize / file?.size) * 100) : 0;
  const iSavings = iOutSize ? Math.round((1 - iOutSize / file?.size) * 100) : 0;

  return (
    <div className="homepage">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="container">
          <div className="row">
            <div className="col-md-8 offset-md-2 text-center">
              <span className="hero-badge">🤖 AI-Powered Compression</span>
              <h1 className="hero-title">Compress Videos & Images Without Losing Quality</h1>
              <p className="hero-sub">Reduce file sizes by up to 90% in seconds. Free, fast, and secure — no installation needed.</p>

              {/* Tab switcher */}
              <div className="upload-tabs">
                <button className={`upload-tab${tab === 'video' ? ' active' : ''}`} onClick={() => { setTab('video'); resetFile(); }}>🎬 Video</button>
                <button className={`upload-tab${tab === 'image' ? ' active' : ''}`} onClick={() => { setTab('image'); resetFile(); }}>🖼️ Image</button>
              </div>

              {/* Upload box — only shown when no file selected */}
              {!file && (
                <div
                  className={`upload-box${dragging ? ' dragging' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <div className="upload-icon">{tab === 'video' ? '🎬' : '🖼️'}</div>
                  <p className="upload-title">Drag & drop your {tab} here</p>
                  <p className="upload-sub">or</p>
                  <label className="btn-upload" htmlFor="file-input">Browse Files</label>
                  <input
                    id="file-input" ref={fileInputRef} type="file"
                    accept={tab === 'video' ? 'video/*' : 'image/*'}
                    style={{ display: 'none' }}
                    onChange={(e) => pickFile(e.target.files[0])}
                  />
                  <p className="upload-formats">
                    {tab === 'video' ? 'Supports MP4, MOV, AVI, MKV, WebM, FLV and 35+ more' : 'Supports JPEG, PNG, WebP, GIF, BMP and more'}
                  </p>
                </div>
              )}

              {/* ── INLINE COMPRESSOR ── */}
              {file && (
                <div className="inline-compressor" ref={compressorRef}>
                  <div className="row">
                    {/* Left: preview + file info */}
                    <div className="col-md-5">
                      <div className="comp-card">
                        <div className="comp-card-header">
                          <h4 className="comp-card-title">{isVideo ? '🎬 Source Video' : '🖼️ Source Image'}</h4>
                          <button className="btn-change-file" onClick={resetFile}>✕ Change File</button>
                        </div>
                        <div className="file-info">
                          <div className="file-info-row"><span>Name</span><strong title={file.name}>{file.name.length > 26 ? file.name.slice(0,23)+'…' : file.name}</strong></div>
                          <div className="file-info-row"><span>Size</span><strong>{formatBytes(file.size)}</strong></div>
                          <div className="file-info-row"><span>Type</span><strong>{file.type}</strong></div>
                          {isVideo && vDuration && <div className="file-info-row"><span>Duration</span><strong>{formatDuration(vDuration)}</strong></div>}
                          {isImage && iDimensions && <div className="file-info-row"><span>Dimensions</span><strong>{iDimensions.w} × {iDimensions.h}px</strong></div>}
                        </div>
                        {isVideo && <video src={previewUrl} className="media-preview" controls muted />}
                        {isImage && <img src={previewUrl} alt="preview" className="media-preview" />}
                      </div>

                      {/* Settings */}
                      <div className="comp-card">
                        <h4 className="comp-card-title">⚙️ Settings</h4>

                        <label className="settings-label">Quality</label>
                        <div className="quality-grid">
                          {(isVideo ? VIDEO_QUALITY : IMAGE_QUALITY).map((p, i) => (
                            <button
                              key={i}
                              className={`quality-btn${(isVideo ? vQuality : iQuality) === i ? ' active' : ''}`}
                              onClick={() => isVideo ? setVQuality(i) : setIQuality(i)}
                              disabled={isVideo ? (vStatus === 'loading' || vStatus === 'compressing') : iStatus === 'compressing'}
                            >
                              <span className="quality-icon">{p.icon}</span>
                              <span className="quality-label">{p.label}</span>
                              <span className="quality-desc">{p.desc}</span>
                            </button>
                          ))}
                        </div>

                        {isVideo && (
                          <>
                            <label className="settings-label">Custom Target Size (optional)</label>
                            <div className="custom-size-row">
                              <input
                                type="number"
                                className={`option-size-input${vCustomMB ? ' active' : ''}`}
                                placeholder="e.g. 8"
                                min="0.1" step="0.1"
                                value={vCustomMB}
                                onChange={(e) => setVCustomMB(e.target.value)}
                                disabled={vStatus === 'loading' || vStatus === 'compressing'}
                              />
                              <span className="option-size-unit">MB</span>
                              {vCustomMB && <span className="custom-size-active-badge">✓ Active</span>}
                            </div>
                            {vCustomMB && <p className="custom-size-hint">Quality preset will be ignored — targeting {vCustomMB} MB output.</p>}
                          </>
                        )}

                        <label className="settings-label">Output Format</label>
                        <div className="format-grid">
                          {(isVideo ? VIDEO_FORMATS : IMAGE_FORMATS).map((f) => (
                            <button
                              key={f}
                              className={`format-btn${(isVideo ? vFormat : iFormat) === f ? ' active' : ''}`}
                              onClick={() => isVideo ? setVFormat(f) : setIFormat(f)}
                              disabled={isVideo ? (vStatus === 'loading' || vStatus === 'compressing') : iStatus === 'compressing'}
                            >
                              .{f.toUpperCase()}
                            </button>
                          ))}
                        </div>

                        {/* Compress button */}
                        {isVideo && (
                          <>
                            {(vStatus === 'idle' || vStatus === 'error') && (
                              <button className="btn-compress" onClick={compressVideo}>⚡ Compress Video</button>
                            )}
                            {vStatus === 'loading' && (
                              <button className="btn-compress loading" disabled><span className="spinner" /> Loading Engine…</button>
                            )}
                            {vStatus === 'compressing' && (
                              <button className="btn-compress loading" disabled><span className="spinner" /> Compressing…</button>
                            )}
                            {vStatus === 'done' && (
                              <button className="btn-compress" onClick={() => { setVStatus('idle'); setVOutput(null); }}>🔄 Compress Again</button>
                            )}
                            {vStatus === 'error' && <div className="error-msg">⚠️ {vError}</div>}
                          </>
                        )}
                        {isImage && (
                          <>
                            {(iStatus === 'idle' || iStatus === 'error') && (
                              <button className="btn-compress" onClick={compressImage}>⚡ Compress Image</button>
                            )}
                            {iStatus === 'compressing' && (
                              <button className="btn-compress loading" disabled><span className="spinner" /> Compressing…</button>
                            )}
                            {iStatus === 'done' && (
                              <button className="btn-compress" onClick={() => { setIStatus('idle'); setIOutput(null); }}>🔄 Compress Again</button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: progress + result */}
                    <div className="col-md-7">
                      {/* Video: loading/progress */}
                      {isVideo && (vStatus === 'loading' || vStatus === 'compressing') && (
                        <div className="comp-card progress-card">
                          <h4 className="comp-card-title">{vStatus === 'loading' ? '⏳ Loading Engine…' : '🔄 Compressing…'}</h4>
                          <div className="progress-bar-wrap">
                            <div className="progress-bar-fill" style={{ width: `${vStatus === 'loading' ? 5 : vProgress}%` }} />
                          </div>
                          <p className="progress-pct">{vStatus === 'loading' ? 'Initializing WebAssembly (one-time)…' : `${vProgress}% complete`}</p>
                          <p className="progress-note">Processing entirely in your browser. Files never leave your device.</p>
                        </div>
                      )}

                      {/* Video: done */}
                      {isVideo && vStatus === 'done' && vOutput && (
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
                              <div className="result-stat-size">{formatBytes(vOutSize)}</div>
                              <div className="result-badge">{vSavings}% smaller</div>
                            </div>
                          </div>
                          <video src={vOutput} className="media-preview" controls />
                          <button className="btn-download" onClick={() => download(vOutput, `compressed_${file.name.replace(/\.[^.]+$/,'')}.${vFormat}`)}>
                            ⬇️ Download Compressed Video
                          </button>
                        </div>
                      )}

                      {/* Image: done */}
                      {isImage && iStatus === 'done' && iOutput && (
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
                              <div className="result-stat-size">{formatBytes(iOutSize)}</div>
                              {iSavings > 0
                                ? <div className="result-badge">{iSavings}% smaller</div>
                                : <div className="result-badge result-badge-warn">No reduction</div>
                              }
                            </div>
                          </div>
                          <img src={iOutput} alt="compressed" className="media-preview" />
                          <button className="btn-download" onClick={() => download(iOutput, `compressed_${file.name.replace(/\.[^.]+$/,'')}.${iFormat}`)}>
                            ⬇️ Download Compressed Image
                          </button>
                        </div>
                      )}

                      {/* Idle hint */}
                      {((isVideo && vStatus === 'idle') || (isImage && iStatus === 'idle')) && (
                        <div className="comp-card idle-card">
                          <div className="idle-icon">{isVideo ? '⚡' : '🖼️'}</div>
                          <h4>Ready to Compress</h4>
                          <p>Choose quality and format on the left, then click <strong>Compress {isVideo ? 'Video' : 'Image'}</strong>.</p>
                          <ul className="idle-features">
                            <li>✅ 100% in-browser — no uploads</li>
                            <li>✅ {isVideo ? 'Powered by FFmpeg WebAssembly' : 'Powered by Canvas API'}</li>
                            <li>✅ Files never leave your device</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!file && <p className="hero-note">✅ No sign-up required &nbsp;·&nbsp; 🔒 Files never uploaded &nbsp;·&nbsp; ⚡ Results in seconds</p>}
            </div>
          </div>
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section className="brands-section">
        <div className="container">
          <p className="brands-label">Trusted by teams at</p>
          <div className="brands-row">
            {brands.map(b => (
              <div key={b} className="brand-item">
                <span className="brand-emoji">{brandEmoji[b]}</span>
                <span className="brand-name">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section how-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>How It Works</h2>
            <p>Three simple steps to compress your file.</p>
          </div>
          <div className="row">
            {steps.map((s, i) => (
              <div key={s.num} className="col-md-4 text-center">
                <div className="step-card">
                  <div className="step-num">{s.num}</div>
                  <div className="step-icon">{s.icon}</div>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="section usecases-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Built for Every Use Case</h2>
            <p>Whether you're a creator, developer, or casual user — we've got you covered.</p>
          </div>
          <div className="row">
            {useCases.map(u => (
              <div key={u.title} className="col-md-3 col-sm-6">
                <div className="usecase-card">
                  <div className="usecase-icon">{u.icon}</div>
                  <h5>{u.title}</h5>
                  <p>{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="section comparison-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>See the Difference</h2>
            <p>Same visual quality. Dramatically smaller file size.</p>
          </div>
          <div className="row">
            <div className="col-md-8 offset-md-2">
              <div className="comparison-box">
                <div className="comparison-side before">
                  <div className="comparison-label">Before</div>
                  <div className="comparison-visual">🎥</div>
                  <div className="comparison-size">245 MB</div>
                  <div className="comparison-meta">Original · MP4 · 1080p</div>
                </div>
                <div className="comparison-arrow">⚡</div>
                <div className="comparison-side after">
                  <div className="comparison-label">After</div>
                  <div className="comparison-visual">🎬</div>
                  <div className="comparison-size">24 MB</div>
                  <div className="comparison-meta">Compressed · MP4 · 1080p</div>
                  <div className="comparison-badge">90% smaller</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container text-center">
          <h2>Ready to Compress Your File?</h2>
          <p>Join over 2 million users who trust VideoCompress AI. Free, fast, and secure.</p>
          <button className="btn-cta" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Start Compressing Now 🚀
          </button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section faq-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Frequently Asked Questions</h2>
            <p>Got questions? We've got answers.</p>
          </div>
          <div className="row">
            <div className="col-md-8 offset-md-2">
              {faqs.map((f, i) => (
                <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                  <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    {f.q}
                    <span className="faq-toggle">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && <div className="faq-answer">{f.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
