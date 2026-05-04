import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const QUALITY_PRESETS = [
  { label: 'High Quality', desc: '~30% smaller', crf: 28, icon: '' },
  { label: 'Balanced',     desc: '~60% smaller', crf: 35, icon: '' },
  { label: 'Small Size',   desc: '~80% smaller', crf: 42, icon: '' },
];

const FORMAT_OPTIONS = ['mp4', 'webm', 'mov', 'avi'];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CompressorPage({ file, onBack, settings = {} }) {
  const initFormat = settings.convertFormat || 'mp4';
  const initQuality = settings.customSizeMB ? 1 : (settings.quality ?? 1);

  const [quality, setQuality]         = useState(initQuality);
  const [format, setFormat]           = useState(initFormat);
  const [customSizeMB, setCustomSizeMB] = useState(settings.customSizeMB || '');
  const [useCustomSize, setUseCustomSize] = useState(!!settings.customSizeMB);
  const [status, setStatus]           = useState('idle'); // idle | loading | compressing | done | error
  const [progress, setProgress]       = useState(0);
  const [outputUrl, setOutputUrl]     = useState(null);
  const [outputSize, setOutputSize]   = useState(null);
  const [duration, setDuration]       = useState(null);
  const [errorMsg, setErrorMsg]       = useState('');
  const ffmpegRef = useRef(null);
  const videoRef  = useRef(null);

  // Read video duration from the file
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.src = url;
    vid.onloadedmetadata = () => {
      setDuration(vid.duration);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL:   await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
      wasmURL:   await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const handleCompress = async () => {
    setStatus('loading');
    setProgress(0);
    setOutputUrl(null);
    setErrorMsg('');

    try {
      const ffmpeg = await loadFFmpeg();
      setStatus('compressing');

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(Math.max(0, Math.min(100, p * 100))));
      });

      const inputExt   = file.name.split('.').pop().toLowerCase();
      const inputName  = `input.${inputExt}`;
      const outputName = `output.${format}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const crf = QUALITY_PRESETS[quality].crf;

      // Build ffmpeg args
      let args;
      if (useCustomSize && customSizeMB) {
        // Two-pass bitrate targeting for custom size
        const targetBits = parseFloat(customSizeMB) * 8 * 1024 * 1024;
        const dur = duration || 60;
        const videoBitrate = Math.max(100, Math.floor((targetBits / dur) * 0.9 / 1000)); // kbps
        args = [
          '-i', inputName,
          '-c:v', 'libx264',
          '-b:v', `${videoBitrate}k`,
          '-preset', 'fast',
          '-c:a', 'aac', '-b:a', '64k',
          '-movflags', '+faststart',
          outputName,
        ];
      } else if (format === 'webm') {
        args = ['-i', inputName, '-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-c:a', 'libopus', outputName];
      } else {
        args = ['-i', inputName, '-c:v', 'libx264', '-crf', String(crf), '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outputName];
      }

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: `video/${format}` });
      setOutputSize(blob.size);
      setOutputUrl(URL.createObjectURL(blob));
      setStatus('done');
      setProgress(100);
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || 'Compression failed. Please try another file or format.');
      setStatus('error');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = `compressed_${file.name.replace(/\.[^.]+$/, '')}.${format}`;
    a.click();
  };

  const savings = outputSize ? Math.round((1 - outputSize / file.size) * 100) : 0;

  return (
    <div className="compressor-page">
      <div className="container">
        <button className="btn-back" onClick={onBack}>← Back</button>

        <div className="row">
          {/* Left: file info + settings */}
          <div className="col-md-5">
            <div className="comp-card">
              <h4 className="comp-card-title">📁 Source File</h4>
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
                  <strong>{file.type || 'video'}</strong>
                </div>
                {duration && (
                  <div className="file-info-row">
                    <span>Duration</span>
                    <strong>{formatDuration(duration)}</strong>
                  </div>
                )}
              </div>

              {/* Video preview */}
              <video
                ref={videoRef}
                src={URL.createObjectURL(file)}
                className="video-preview"
                controls
                muted
              />
            </div>

            <div className="comp-card">
              <h4 className="comp-card-title">⚙️ Compression Settings</h4>

              <label className="settings-label">Quality Preset</label>
              <div className="quality-grid">
                {QUALITY_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    className={`quality-btn${quality === i ? ' active' : ''}${useCustomSize ? ' disabled-look' : ''}`}
                    onClick={() => { setQuality(i); setUseCustomSize(false); }}
                    disabled={status === 'compressing' || status === 'loading'}
                  >
                    <span className="quality-icon">{p.icon}</span>
                    <span className="quality-label">{p.label}</span>
                    <span className="quality-desc">{p.desc}</span>
                  </button>
                ))}
              </div>

              <label className="settings-label">Custom Target Size</label>
              <div className="custom-size-row">
                <input
                  type="number"
                  className={`option-size-input${useCustomSize ? ' active' : ''}`}
                  placeholder="e.g. 8"
                  min="0.1" step="0.1"
                  value={customSizeMB}
                  onChange={(e) => { setCustomSizeMB(e.target.value); setUseCustomSize(!!e.target.value); }}
                  disabled={status === 'compressing' || status === 'loading'}
                />
                <span className="option-size-unit">MB</span>
                {useCustomSize && <span className="custom-size-active-badge">✓ Active</span>}
              </div>

              <label className="settings-label">Output Format</label>
              <div className="format-grid">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f}
                    className={`format-btn${format === f ? ' active' : ''}`}
                    onClick={() => setFormat(f)}
                    disabled={status === 'compressing' || status === 'loading'}
                  >
                    .{f.toUpperCase()}
                  </button>
                ))}
              </div>

              {status === 'idle' || status === 'error' ? (
                <button className="btn-compress" onClick={handleCompress}>
                  ⚡ Compress Video
                </button>
              ) : status === 'loading' ? (
                <button className="btn-compress loading" disabled>
                  <span className="spinner" /> Loading Engine…
                </button>
              ) : status === 'compressing' ? (
                <button className="btn-compress loading" disabled>
                  <span className="spinner" /> Compressing…
                </button>
              ) : null}

              {status === 'error' && (
                <div className="error-msg">⚠️ {errorMsg}</div>
              )}
            </div>
          </div>

          {/* Right: progress + output */}
          <div className="col-md-7">
            {(status === 'loading' || status === 'compressing') && (
              <div className="comp-card progress-card">
                <h4 className="comp-card-title">
                  {status === 'loading' ? '⏳ Loading FFmpeg Engine…' : '🔄 Compressing…'}
                </h4>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${status === 'loading' ? 5 : progress}%` }} />
                </div>
                <p className="progress-pct">
                  {status === 'loading' ? 'Initializing WebAssembly engine (one-time)…' : `${progress}% complete`}
                </p>
                <p className="progress-note">
                  Processing happens entirely in your browser. No data is uploaded to any server.
                </p>
              </div>
            )}

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
                    <div className="result-badge">{savings}% smaller</div>
                  </div>
                </div>

                <video src={outputUrl} className="video-preview" controls />

                <button className="btn-download" onClick={handleDownload}>
                  ⬇️ Download Compressed Video
                </button>
                <button className="btn-compress-again" onClick={() => { setStatus('idle'); setOutputUrl(null); }}>
                  🔄 Compress Again with Different Settings
                </button>
              </div>
            )}

            {status === 'idle' && (
              <div className="comp-card idle-card">
                <div className="idle-icon">⚡</div>
                <h4>Ready to Compress</h4>
                <p>Choose your quality preset and output format, then click <strong>Compress Video</strong> to start.</p>
                <ul className="idle-features">
                  <li>✅ 100% in-browser — no uploads</li>
                  <li>✅ Powered by FFmpeg WebAssembly</li>
                  <li>✅ Supports MP4, WebM, MOV, AVI output</li>
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
