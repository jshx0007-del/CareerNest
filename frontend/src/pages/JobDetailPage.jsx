import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function initials(name) {
  return name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';
}

/* ── Apply Modal ─────────────────────────────────────── */
function ApplyModal({ job, onClose }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const overlayRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const fd = new FormData();
      fd.append('jobId', job._id);
      if (coverLetter.trim()) fd.append('coverLetter', coverLetter.trim());
      if (resume) fd.append('resume', resume);
      await client.post('/applications', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('success');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message ?? 'Something went wrong.');
      setStatus('error');
    }
  };

  const closeOnOverlay = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (status === 'success') {
    return (
      <div className="modal-overlay" ref={overlayRef} onClick={closeOnOverlay}>
        <div className="modal-box">
          <div className="modal-success">
            <div className="modal-success-icon">✓</div>
            <h2>Application submitted!</h2>
            <p>We've sent your application for <strong>{job.title}</strong> at {job.companyName}. Good luck!</p>
            <button className="button" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={closeOnOverlay}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Apply for</p>
            <h2 className="modal-title">{job.title}</h2>
            <p className="modal-subtitle">{job.companyName} · {job.location}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" encType="multipart/form-data">
          <div className="modal-field">
            <label htmlFor="apply-cover">Cover letter <span className="rjf-optional">optional</span></label>
            <textarea
              id="apply-cover"
              rows={5}
              placeholder="Tell the recruiter why you're a great fit…"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="apply-resume">
              Resume / CV <span className="rjf-optional">optional · PDF or DOCX</span>
            </label>
            <input
              id="apply-resume"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResume(e.target.files[0] || null)}
              className="modal-file-input"
            />
          </div>

          {status === 'error' && (
            <p className="rjf-error" role="alert">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="button modal-submit-btn"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Job Detail Page ─────────────────────────────────── */
export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get(`/jobs/${id}`);
        setJob(data.job);
        // Mark as viewed
        try {
          const viewed = JSON.parse(localStorage.getItem('viewedJobs') || '[]');
          if (!viewed.includes(id)) {
            localStorage.setItem('viewedJobs', JSON.stringify([...viewed, id]));
          }
        } catch {}
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Check if user already applied
  useEffect(() => {
    if (!user || user.role !== 'applicant') return;
    client.get('/applications').then(({ data }) => {
      const applied = data.applications.some((a) => a.job?._id === id || a.job === id);
      setAlreadyApplied(applied);
    }).catch(() => {});
  }, [user, id]);

  if (loading) {
    return (
      <div className="jd-page">
        <div className="jd-skeleton-header" />
        <div className="jd-skeleton-body" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="jd-page">
        <Link to="/jobs" className="jd-back">← All jobs</Link>
        <p style={{ marginTop: 32, color: '#657064' }}>Job not found or no longer available.</p>
      </div>
    );
  }

  const skills = Array.isArray(job.skills) ? job.skills : [];

  return (
    <div className="jd-page">
      <Link to="/jobs" className="jd-back">← All jobs</Link>

      <div className="jd-layout">
        {/* LEFT — main content */}
        <div className="jd-main">
          {/* Header */}
          <div className="jd-header">
            <div className="jd-logo">
              {job.logoUrl ? (
                <img src={job.logoUrl} alt={job.companyName} />
              ) : (
                <span>{initials(job.companyName)}</span>
              )}
            </div>
            <div>
              <p className="eyebrow">{job.employmentType}</p>
              <h1 className="jd-title">{job.title}</h1>
              <p className="jd-meta">
                {job.companyName} · {job.location} · Posted {timeAgo(job.createdAt)}
              </p>
            </div>
          </div>

          <hr className="jd-divider" />

          {/* About the role */}
          <section className="jd-section">
            <h2>About the role</h2>
            <p className="jd-description">{job.description}</p>
            {skills.length > 0 && (
              <div className="jd-skills">
                {skills.map((s) => (
                  <span key={s} className="jd-skill-tag">{s}</span>
                ))}
              </div>
            )}
          </section>

          <hr className="jd-divider" />

          {/* Salary */}
          {(job.salary?.min || job.salary?.max) && (
            <>
              <section className="jd-section">
                <h2>Compensation</h2>
                <p className="jd-description">
                  {job.salary.min && job.salary.max
                    ? `₹${job.salary.min.toLocaleString()} – ₹${job.salary.max.toLocaleString()} per year`
                    : job.salary.min
                    ? `From ₹${job.salary.min.toLocaleString()} per year`
                    : `Up to ₹${job.salary.max.toLocaleString()} per year`}
                </p>
              </section>
              <hr className="jd-divider" />
            </>
          )}

          {/* About company */}
          <section className="jd-section">
            <h2>About {job.companyName}</h2>
            <p className="jd-description">
              {job.aboutCompany || 'Company information will be shared by the recruiter soon.'}
            </p>
          </section>
        </div>

        {/* RIGHT — sticky apply card */}
        <aside className="jd-aside">
          <div className="jd-apply-card">
            <p className="eyebrow">Interested?</p>
            <h2 className="jd-apply-heading">Make your move.</h2>
            <p className="jd-apply-sub">
              Apply directly and keep track of your application from your workspace.
            </p>

            {!user ? (
              <Link to="/login" className="button jd-apply-btn">
                Sign in to apply
              </Link>
            ) : user.role !== 'applicant' ? (
              <p className="jd-apply-note">Recruiters cannot apply to jobs.</p>
            ) : alreadyApplied ? (
              <div className="jd-applied-badge">
                <span>✓</span> Application submitted
              </div>
            ) : (
              <button
                className="button jd-apply-btn"
                onClick={() => setShowModal(true)}
              >
                Apply now
              </button>
            )}
          </div>
        </aside>
      </div>

      {showModal && (
        <ApplyModal
          job={job}
          onClose={() => {
            setShowModal(false);
            setAlreadyApplied(true);
          }}
        />
      )}
    </div>
  );
}
