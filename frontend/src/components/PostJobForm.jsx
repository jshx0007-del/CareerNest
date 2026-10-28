import { useEffect, useState } from "react";
import client from "../api/client";

const EMPTY = {
  title: "",
  companyName: "",
  logoUrl: "",
  aboutCompany: "",
  location: "",
  employmentType: "Full-time",
  description: "",
  skills: "",
  salaryMin: "",
  salaryMax: "",
};

function jobToForm(job) {
  return {
    title: job.title ?? "",
    companyName: job.companyName ?? "",
    logoUrl: job.logoUrl ?? "",
    aboutCompany: job.aboutCompany ?? "",
    location: job.location ?? "",
    employmentType: job.employmentType ?? "Full-time",
    description: job.description ?? "",
    skills: Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills ?? ""),
    salaryMin: job.salary?.min ?? "",
    salaryMax: job.salary?.max ?? "",
  };
}

/**
 * PostJobForm
 * Props:
 *   mode          – "post" (default) | "edit"
 *   initialValues – existing job object when mode === "edit"
 *   onJobPosted   – callback(job) after successful create or update
 */
export default function PostJobForm({ mode = "post", initialValues = null, onJobPosted }) {
  const [form, setForm] = useState(
    mode === "edit" && initialValues ? jobToForm(initialValues) : EMPTY
  );
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Re-populate when a different job is passed in for editing
  useEffect(() => {
    if (mode === "edit" && initialValues) {
      setForm(jobToForm(initialValues));
      setStatus("idle");
      setErrorMsg("");
    }
  }, [initialValues?._id]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const payload = {
        title: form.title.trim(),
        companyName: form.companyName.trim(),
        location: form.location.trim(),
        employmentType: form.employmentType,
        description: form.description.trim() || " ",
        aboutCompany: form.aboutCompany.trim(),
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        salary: {
          min: form.salaryMin ? Number(form.salaryMin) : undefined,
          max: form.salaryMax ? Number(form.salaryMax) : undefined,
          currency: "INR",
        },
      };
      if (form.logoUrl.trim()) payload.logoUrl = form.logoUrl.trim();

      let data;
      if (mode === "edit" && initialValues?._id) {
        ({ data } = await client.patch(`/jobs/${initialValues._id}`, payload));
      } else {
        ({ data } = await client.post("/jobs", payload));
      }

      setStatus("success");
      if (mode !== "edit") setForm(EMPTY);
      if (onJobPosted) onJobPosted(data.job);
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message ?? "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  };

  const isEdit = mode === "edit";

  return (
    <form className="rjf-form" onSubmit={handleSubmit} noValidate>
      {/* Row: Job title + Company name */}
      <div className="rjf-row">
        <div className="rjf-field">
          <label htmlFor="rjf-title">Job title</label>
          <input
            id="rjf-title"
            type="text"
            value={form.title}
            onChange={set("title")}
            required
          />
        </div>
        <div className="rjf-field">
          <label htmlFor="rjf-company">Company name</label>
          <input
            id="rjf-company"
            type="text"
            value={form.companyName}
            onChange={set("companyName")}
            required
          />
        </div>
      </div>

      {/* Company logo URL */}
      <div className="rjf-field rjf-full">
        <label htmlFor="rjf-logo">
          Company logo URL <span className="rjf-optional">optional</span>
        </label>
        <input
          id="rjf-logo"
          type="url"
          placeholder="https://…"
          value={form.logoUrl}
          onChange={set("logoUrl")}
        />
      </div>

      {/* About the company */}
      <div className="rjf-field rjf-full">
        <label htmlFor="rjf-about">
          About the company{" "}
          <span className="rjf-hint">shown on job detail page</span>
        </label>
        <textarea
          id="rjf-about"
          rows={3}
          value={form.aboutCompany}
          onChange={set("aboutCompany")}
        />
      </div>

      {/* Row: Location + Employment type */}
      <div className="rjf-row">
        <div className="rjf-field">
          <label htmlFor="rjf-location">Location</label>
          <input
            id="rjf-location"
            type="text"
            value={form.location}
            onChange={set("location")}
            required
          />
        </div>
        <div className="rjf-field">
          <label htmlFor="rjf-type">Employment type</label>
          <select
            id="rjf-type"
            value={form.employmentType}
            onChange={set("employmentType")}
            required
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
      </div>

      {/* Skills */}
      <div className="rjf-field rjf-full">
        <label htmlFor="rjf-skills">
          Skills <span className="rjf-hint">comma-separated</span>
        </label>
        <input
          id="rjf-skills"
          type="text"
          placeholder="e.g. React, Node.js, MongoDB"
          value={form.skills}
          onChange={set("skills")}
        />
      </div>

      {/* Row: Min + Max salary */}
      <div className="rjf-row">
        <div className="rjf-field">
          <label htmlFor="rjf-sal-min">Minimum salary</label>
          <input
            id="rjf-sal-min"
            type="number"
            min="0"
            value={form.salaryMin}
            onChange={set("salaryMin")}
          />
        </div>
        <div className="rjf-field">
          <label htmlFor="rjf-sal-max">Maximum salary</label>
          <input
            id="rjf-sal-max"
            type="number"
            min="0"
            value={form.salaryMax}
            onChange={set("salaryMax")}
          />
        </div>
      </div>

      {/* Role description */}
      <div className="rjf-field rjf-full">
        <label htmlFor="rjf-desc">Role description</label>
        <textarea
          id="rjf-desc"
          rows={5}
          value={form.description}
          onChange={set("description")}
          required
        />
      </div>

      {status === "error" && (
        <p className="rjf-error" role="alert">
          {errorMsg}
        </p>
      )}

      {status === "success" && (
        <p className="profile-success" role="status">
          ✓ {isEdit ? "Changes saved!" : "Job published!"}
        </p>
      )}

      <button
        id="rjf-submit"
        type="submit"
        className="rjf-publish-btn"
        disabled={status === "loading"}
      >
        {status === "loading"
          ? isEdit ? "Saving…" : "Publishing…"
          : isEdit ? "Save changes" : "Publish job"}
      </button>
    </form>
  );
}
