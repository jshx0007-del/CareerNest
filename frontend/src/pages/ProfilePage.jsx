import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const { data } = await client.patch('/auth/profile', { name, email });
      if (setUser) setUser(data.user);
      setStatus('success');
      // Brief success flash, then idle
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section className="profile-page">
      <p className="eyebrow">Your account</p>
      <h1 className="profile-heading">Profile</h1>
      <p className="profile-sub">Keep your details current to get the most from CareerNest.</p>

      <div className="profile-card">
        <h2 className="profile-section-title">Personal details</h2>

        <form className="profile-form" onSubmit={handleSubmit} noValidate>
          <div className="profile-field">
            <label htmlFor="prof-name">Name</label>
            <input
              id="prof-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="profile-field">
            <label htmlFor="prof-email">Email</label>
            <input
              id="prof-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="profile-field">
            <label htmlFor="prof-avatar">
              Profile image{' '}
              <span className="rjf-optional">optional · max 2 MB</span>
            </label>
            <input
              id="prof-avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files[0] || null)}
              className="profile-file-input"
            />
          </div>

          <div className="profile-field">
            <label>Role</label>
            <div className="profile-role-badge">{user?.role}</div>
          </div>

          {status === 'error' && (
            <p className="rjf-error" role="alert">{errorMsg}</p>
          )}

          {status === 'success' && (
            <p className="profile-success" role="status">✓ Profile saved successfully.</p>
          )}

          <button
            type="submit"
            className="button profile-save-btn"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      {/* Applicant-only: My Applications section */}
      {user?.role === 'applicant' && (
        <div className="profile-card" style={{ marginTop: 24 }}>
          <h2 className="profile-section-title">My applications</h2>
          <ApplicationsList />
        </div>
      )}
    </section>
  );
}

function ApplicationsList() {
  const [apps, setApps] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    try {
      const { data } = await client.get('/applications');
      setApps(data.applications);
    } catch {
      setApps([]);
    } finally {
      setLoaded(true);
    }
  };

  if (!loaded) {
    return (
      <button className="button secondary" onClick={load}>
        Load my applications
      </button>
    );
  }

  if (!apps || apps.length === 0) {
    return <p style={{ color: '#8a9088', fontSize: 14 }}>You haven't applied to any jobs yet.</p>;
  }

  const statusColors = {
    submitted: '#8a9088',
    reviewing: '#a25d32',
    shortlisted: '#234b39',
    rejected: '#a72f21',
    hired: '#1a6b3a',
  };

  return (
    <div className="app-list">
      {apps.map((app) => (
        <div key={app._id} className="app-row">
          <div className="app-row-info">
            <span className="app-row-title">{app.job?.title ?? 'Unknown role'}</span>
            <span className="app-row-meta">
              {app.job?.companyName} · {app.job?.location}
            </span>
          </div>
          <span
            className="app-row-status"
            style={{ color: statusColors[app.status] || '#657064' }}
          >
            {app.status}
          </span>
        </div>
      ))}
    </div>
  );
}
