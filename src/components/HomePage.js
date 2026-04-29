import { useState } from 'react';

const brands = [
  { name: 'YouTube', emoji: '▶️' },
  { name: 'Google', emoji: '🔍' },
  { name: 'Netflix', emoji: '🎬' },
  { name: 'Dropbox', emoji: '📦' },
  { name: 'Slack', emoji: '💬' },
  { name: 'Zoom', emoji: '📹' },
];

const features = [
  { icon: '⚡', title: 'Fast Compression', desc: 'Compress videos up to 90% smaller in seconds using our AI-powered engine.' },
  { icon: '🔒', title: 'Secure Processing', desc: 'Your files are encrypted and automatically deleted after processing.' },
  { icon: '🎞️', title: '40+ Formats', desc: 'Supports MP4, MOV, AVI, MKV, WebM, and 35+ more video formats.' },
  { icon: '☁️', title: 'No Installation', desc: 'Works entirely in your browser. No software download required.' },
  { icon: '🤖', title: 'AI Optimized', desc: 'Smart compression preserves visual quality while reducing file size.' },
  { icon: '📱', title: 'Any Device', desc: 'Works seamlessly on desktop, tablet, and mobile devices.' },
];

const steps = [
  { num: '1', icon: '📤', title: 'Upload Video', desc: 'Drag & drop or browse to select your video file.' },
  { num: '2', icon: '⚙️', title: 'Choose Settings', desc: 'Pick your target size, quality, or format.' },
  { num: '3', icon: '⬇️', title: 'Download File', desc: 'Get your compressed video instantly.' },
];

const useCases = [
  { icon: '📧', title: 'Email Sharing', desc: 'Shrink videos to fit email attachment limits without losing quality.' },
  { icon: '🎮', title: 'Discord Uploads', desc: 'Compress clips under 8MB to share instantly on Discord.' },
  { icon: '💾', title: 'Save Storage', desc: 'Free up space on your phone, laptop, or cloud storage.' },
  { icon: '🌐', title: 'Web Publishing', desc: 'Optimize videos for faster loading on websites and blogs.' },
];

const testimonials = [
  { avatar: '👩‍💼', name: 'Sarah Johnson', role: 'Content Creator', text: 'VideoCompress AI saved me hours of work. My 4K footage compresses in seconds and still looks amazing!' },
  { avatar: '👨‍💻', name: 'Mark Chen', role: 'Software Engineer', text: 'The best free video compressor I\'ve used. Clean UI, fast results, and no watermarks.' },
  { avatar: '👩‍🎨', name: 'Priya Patel', role: 'Graphic Designer', text: 'I compress all my client deliverables here. The quality retention is unmatched.' },
];

const faqs = [
  { q: 'Is VideoCompress AI free to use?', a: 'Yes! The core compression features are completely free. Premium plans unlock batch processing and higher file size limits.' },
  { q: 'What is the maximum file size I can upload?', a: 'Free users can upload files up to 500MB. Premium users get up to 10GB per file.' },
  { q: 'Are my videos stored on your servers?', a: 'No. Files are processed in real-time and permanently deleted from our servers within 1 hour.' },
  { q: 'Which video formats are supported?', a: 'We support MP4, MOV, AVI, MKV, WebM, FLV, WMV, and 35+ other formats.' },
  { q: 'Will compression reduce my video quality?', a: 'Our AI engine intelligently balances size and quality. You can also choose your preferred quality level.' },
];

function HomePage() {
  const [dragging, setDragging] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); };

  return (
    <div className="homepage">

      {/* HERO */}
      <section className="hero-section">
        <div className="container">
          <div className="row">
            <div className="col-md-8 col-md-offset-2 text-center">
              <span className="hero-badge">🤖 AI-Powered Compression</span>
              <h1 className="hero-title">Compress Videos Without Losing Quality</h1>
              <p className="hero-sub">Reduce video file sizes by up to 90% in seconds. Free, fast, and secure — no installation needed.</p>
              <div
                className={`upload-box${dragging ? ' dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="upload-icon">🎬</div>
                <p className="upload-title">Drag & drop your video here</p>
                <p className="upload-sub">or</p>
                <label className="btn-upload" htmlFor="file-input">Browse Files</label>
                <input id="file-input" type="file" accept="video/*" style={{ display: 'none' }} />
                <p className="upload-formats">Supports MP4, MOV, AVI, MKV, WebM, FLV and 35+ more</p>
                <div className="upload-options">
                  <span className="option-tag">🎯 Auto Quality</span>
                  <span className="option-tag">📐 Custom Size</span>
                  <span className="option-tag">🔄 Format Convert</span>
                </div>
              </div>
              <p className="hero-note">✅ No sign-up required &nbsp;·&nbsp; 🔒 Files deleted after 1 hour &nbsp;·&nbsp; ⚡ Results in seconds</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BRANDS */}
      <section className="brands-section">
        <div className="container">
          <p className="brands-label">Trusted by teams at</p>
          <div className="brands-row">
            {brands.map((b) => (
              <div key={b.name} className="brand-item">
                <span className="brand-emoji">{b.emoji}</span>
                <span className="brand-name">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section features-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Everything You Need</h2>
            <p>Powerful features built for creators, developers, and everyday users.</p>
          </div>
          <div className="row">
            {features.map((f) => (
              <div key={f.title} className="col-md-4 col-sm-6">
                <div className="feature-card">
                  <div className="feature-icon">{f.icon}</div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>How It Works</h2>
            <p>Three simple steps to compress your video.</p>
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
                {i < steps.length - 1 && <div className="step-arrow hidden-sm hidden-xs">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="section usecases-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Built for Every Use Case</h2>
            <p>Whether you're a creator, developer, or casual user — we've got you covered.</p>
          </div>
          <div className="row">
            {useCases.map((u) => (
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

      {/* TESTIMONIALS */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>What Our Users Say</h2>
            <p>Thousands of creators trust VideoCompress AI every day.</p>
          </div>
          <div className="row">
            {testimonials.map((t) => (
              <div key={t.name} className="col-md-4">
                <div className="testimonial-card">
                  <p className="testimonial-text">"{t.text}"</p>
                  <div className="testimonial-author">
                    <span className="testimonial-avatar">{t.avatar}</span>
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </div>
                  <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="section comparison-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>See the Difference</h2>
            <p>Same visual quality. Dramatically smaller file size.</p>
          </div>
          <div className="row">
            <div className="col-md-8 col-md-offset-2">
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

      {/* CTA */}
      <section className="cta-section">
        <div className="container text-center">
          <h2>Ready to Compress Your Video?</h2>
          <p>Join over 2 million users who trust VideoCompress AI. Free, fast, and secure.</p>
          <a href="#top" className="btn-cta">Start Compressing Now 🚀</a>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Frequently Asked Questions</h2>
            <p>Got questions? We've got answers.</p>
          </div>
          <div className="row">
            <div className="col-md-8 col-md-offset-2">
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

export default HomePage;
