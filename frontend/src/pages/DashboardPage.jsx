import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PostJobForm from '../components/PostJobForm';
import client from '../api/client';

/* ── Recruiter Dashboard ──────────────────────────────── */
function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null); // null = post new
  const [selectedJob, setSelectedJob] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const loadJobs = async () => {
    try {
      const { data } = await client.get('/jobs/mine');
      setJobs(data.jobs);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => { loadJobs(); }, []);

  const handleJobPosted = (job) => {
    setJobs((prev) => [job, ...prev]);
    setEditingJob(null);
  };

  const handleJobUpdated = (updatedJob) => {
    setJobs((prev) => prev.map((j) => (j._id === updatedJob._id ? updatedJob : j)));
    setEditingJob(null);
  };

  const loadSubmissions = async (job) => {
    setSelectedJob(job);
    setLoadingSubmissions(true);
    try {
      const { data } = await client.get('/applications');
      const filtered = data.applications.filter(
        (a) => a.job?._id === job._id || a.job === job._id
      );
      setSubmissions(filtered);
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const updateStatus = async (appId, status) => {
    try {
      await client.patch(`/applications/${appId}/status`, { status });
      setSubmissions((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status } : a))
      );
    } catch {}
  };

  const statusColors = {
    submitted: '#8a9088',
    reviewing: '#a25d32',
    shortlisted: '#234b39',
    rejected: '#a72f21',
    hired: '#1a6b3a',
  };

  return (
    <div className="rec-dashboard">
      {/* LEFT — form panel */}
      <div className="rec-panel rec-panel-form">
        {editingJob ? (
          <>
            <div className="rec-panel-topbar">
              <p className="rec-eyebrow">Job Management</p>
              <button
                className="rec-cancel-btn"
                onClick={() => setEditingJob(null)}
              >
                Cancel edit
              </button>
            </div>
            <h1 className="rec-heading">Edit job post</h1>
            <PostJobForm
              mode="edit"
              initialValues={editingJob}
              onJobPosted={handleJobUpdated}
            />
          </>
        ) : (
          <>
            <p className="rec-eyebrow">Job Management</p>
            <h1 className="rec-heading">Post a new role</h1>
            <PostJobForm onJobPosted={handleJobPosted} />
          </>
        )}
      </div>

      {/* RIGHT — submissions panel */}
      <div className="rec-panel rec-panel-submissions">
        <p className="rec-eyebrow">Applications</p>
        <h2 className="rec-heading">Job submissions</h2>
        <p className="rec-sub">
          {jobs.length === 0
            ? 'Choose a role to see its applicants.'
            : selectedJob
            ? `Applicants for: ${selectedJob.title}`
            : 'Click a role to review applicants.'}
        </p>

        {/* Job list */}
        {loadingJobs ? (
          <div className="rec-jobs-loading">
            {[1, 2].map((n) => <div key={n} className="rec-job-skeleton" />)}
          </div>
        ) : (
          <div className="rec-job-list">
            {jobs.map((job) => (
              <div
                key={job._id}
                className={`rec-job-row ${selectedJob?._id === job._id ? 'rec-job-row--active' : ''}`}
              >
                <div className="rec-job-info" onClick={() => loadSubmissions(job)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && loadSubmissions(job)}>
                  <span className="rec-job-title">{job.title}</span>
                  <span className="rec-job-meta">
                    {job.companyName} · {job.location}
                  </span>
                </div>
                <div className="rec-job-actions">
                  <button
                    className="rec-link-btn"
                    onClick={() => setEditingJob(job)}
                  >
                    Edit
                  </button>
                  <button
                    className="rec-link-btn rec-link-btn--primary"
                    onClick={() => loadSubmissions(job)}
                  >
                    Submissions
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Applicants */}
        {selectedJob && (
          <div className="rec-applicants">
            <div className="rec-applicants-divider" />
            {loadingSubmissions ? (
              <p className="rec-sub">Loading applicants…</p>
            ) : submissions.length === 0 ? (
              <p className="rec-sub">No applications yet for this role.</p>
            ) : (
              submissions.map((app) => (
                <div key={app._id} className="rec-applicant-row">
                  <div className="rec-applicant-info">
                    <span className="rec-applicant-name">
                      {app.applicant?.name ?? 'Unknown'}
                    </span>
                    <span className="rec-applicant-email">
                      {app.applicant?.email}
                    </span>
                    {app.coverLetter && (
                      <p className="rec-applicant-cover">{app.coverLetter}</p>
                    )}
                    {app.resume?.url && (
                      <a
                        href={app.resume.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rec-link-btn rec-link-btn--primary"
                      >
                        View resume ↗
                      </a>
                    )}
                  </div>
                  <div className="rec-applicant-actions">
                    <span
                      className="app-status-badge"
                      style={{ color: statusColors[app.status] }}
                    >
                      {app.status}
                    </span>
                    <select
                      className="rec-status-select"
                      value={app.status}
                      onChange={(e) => updateStatus(app._id, e.target.value)}
                    >
                      <option value="submitted">submitted</option>
                      <option value="reviewing">reviewing</option>
                      <option value="shortlisted">shortlisted</option>
                      <option value="rejected">rejected</option>
                      <option value="hired">hired</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Applicant Dashboard ──────────────────────────────── */
function ApplicantDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/applications').then(({ data }) => {
      setApps(data.applications);
    }).catch(() => setApps([])).finally(() => setLoading(false));
  }, []);

  const statusColors = {
    submitted: '#8a9088',
    reviewing: '#a25d32',
    shortlisted: '#234b39',
    rejected: '#a72f21',
    hired: '#1a6b3a',
  };

  return (
    <section className="dashboard">
      <p className="eyebrow">applicant workspace</p>
      <h1>Welcome back, {user.name.split(' ')[0]}.</h1>
      <p className="lead">Track applications and keep your profile ready for the next great role.</p>

      <div className="role-cards">
        {/* Applications card */}
        <article className="dashboard-card">
          <h2>My applications</h2>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : apps.length === 0 ? (
            <>
              <p className="muted">You haven't applied to any jobs yet.</p>
              <Link to="/jobs" className="button small" style={{ marginTop: 12, display: 'inline-block' }}>
                Browse jobs
              </Link>
            </>
          ) : (
            <div className="app-list">
              {apps.slice(0, 5).map((app) => (
                <div key={app._id} className="app-row">
                  <div className="app-row-info">
                    <span className="app-row-title">{app.job?.title ?? 'Unknown role'}</span>
                    <span className="app-row-meta">
                      {app.job?.companyName} · {app.job?.location}
                    </span>
                  </div>
                  <span className="app-row-status" style={{ color: statusColors[app.status] }}>
                    {app.status}
                  </span>
                </div>
              ))}
              {apps.length > 5 && (
                <Link to="/profile" className="rec-link-btn rec-link-btn--primary" style={{ marginTop: 8 }}>
                  View all {apps.length} applications →
                </Link>
              )}
            </div>
          )}
        </article>

        {/* Profile card */}
        <article className="dashboard-card">
          <h2>Profile</h2>
          <p className="muted">Keep your details current to get the most from CareerNest.</p>
          <div className="dashboard-profile-preview">
            <div className="dashboard-avatar">
              {user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="dashboard-profile-name">{user.name}</p>
              <p className="dashboard-profile-email">{user.email}</p>
            </div>
          </div>
          <Link to="/profile" className="button small secondary" style={{ marginTop: 16, display: 'inline-block' }}>
            Edit profile
          </Link>
        </article>
      </div>
    </section>
  );
}

/* ── Main export ─────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();

  if (user.role === 'recruiter' || user.role === 'admin') {
    return <RecruiterDashboard />;
  }

  return <ApplicantDashboard />;
}
