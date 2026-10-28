import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

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

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', location: '', employmentType: '' });
  const [loading, setLoading] = useState(true);
  const [viewed, setViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('viewedJobs') || '[]'); } catch { return []; }
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/jobs', { params: filters });
      setJobs(data.jobs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markViewed = (id) => {
    setViewed((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem('viewedJobs', JSON.stringify(next));
      return next;
    });
  };

  return (
    <section className="jobs-page">
      {/* Header */}
      <div className="jobs-page-header">
        <p className="eyebrow">Open roles</p>
        <h1>Find your next opportunity</h1>
      </div>

      {/* Filters */}
      <form
        className="jobs-filters"
        onSubmit={(e) => { e.preventDefault(); load(); }}
      >
        <input
          className="jobs-filter-input"
          placeholder="Title, skill, or company"
          value={filters.keyword}
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
        />
        <input
          className="jobs-filter-input"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
        <select
          className="jobs-filter-select"
          value={filters.employmentType}
          onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
        >
          <option value="">Any type</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Contract</option>
          <option>Internship</option>
        </select>
        <button className="button" type="submit">Search</button>
      </form>

      {/* Job list */}
      {loading ? (
        <div className="jobs-loading">
          {[1, 2, 3].map((n) => (
            <div key={n} className="job-skeleton" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="jobs-empty">
          <p>No roles match those filters yet.</p>
          <button className="button secondary" onClick={() => { setFilters({ keyword: '', location: '', employmentType: '' }); load(); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="jobs-list">
          {jobs.map((job) => (
            <Link
              key={job._id}
              to={`/jobs/${job._id}`}
              className="job-list-card"
              onClick={() => markViewed(job._id)}
            >
              <div className="job-list-logo">
                {job.logoUrl ? (
                  <img src={job.logoUrl} alt={job.companyName} />
                ) : (
                  <span>{initials(job.companyName)}</span>
                )}
              </div>
              <div className="job-list-info">
                <div className="job-list-title-row">
                  <span className="job-list-title">{job.title}</span>
                  {viewed.includes(job._id) && (
                    <span className="job-viewed-badge">Viewed</span>
                  )}
                </div>
                <span className="job-list-meta">
                  {job.companyName} · {job.location}
                </span>
                <span className="job-list-sub">
                  {timeAgo(job.createdAt)} · {job.employmentType}
                </span>
              </div>
              <div className="job-list-chevron">›</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
