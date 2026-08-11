import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { teacherApi } from "../../../../services/teacherApi";
import '../page-styles/CbtPage.css';

const initialAssessmentForm = {
  title: "",
  subject: "",
  className: "",
  maxScore: 100,
  date: new Date().toISOString().slice(0, 10),
  description: "",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function CbtPage() {
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cmBusyMap, setCmBusyMap] = useState({});
  const [error, setError] = useState(null);
  const [form, setForm] = useState(initialAssessmentForm);

  const parseClassMarkerMeta = (description) => {
    if (!description) return null;
    const marker = "[ClassMarkerMeta]";
    const idx = description.indexOf(marker);
    if (idx === -1) return null;
    try {
      return JSON.parse(description.slice(idx + marker.length).trim());
    } catch (err) {
      return null;
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [assessmentsResponse, resultsResponse] = await Promise.all([
        teacherApi.assessments(),
        teacherApi.results(),
      ]);
      setAssessments(assessmentsResponse.assessments || []);
      setResults(resultsResponse.results || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load CBT data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const publishedResults = useMemo(
    () => results.filter((item) => item.published).length,
    [results],
  );

  const draftResults = useMemo(
    () => results.filter((item) => !item.published).length,
    [results],
  );

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === "maxScore" ? Number(value) : value,
    }));
  };

  const handleCreateAssessment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await teacherApi.createAssessment(form);
      setForm(initialAssessmentForm);
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to create assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (!window.confirm("Delete this assessment? This cannot be undone.")) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await teacherApi.deleteAssessment(assessmentId);
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to delete the assessment.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateRemoteExam = async (assessmentId) => {
    setError(null);
    setCmBusyMap((m) => ({ ...m, [assessmentId]: true }));
    try {
      await teacherApi.classmarker.createExam({ assessmentId });
      await loadData();
    } catch (e) {
      setError(e.message || "Unable to create remote exam");
    } finally {
      setCmBusyMap((m) => ({ ...m, [assessmentId]: false }));
    }
  };

  const handleLaunchRemote = async (assessmentId) => {
    setError(null);
    setCmBusyMap((m) => ({ ...m, [assessmentId]: true }));
    try {
      const response = await teacherApi.classmarker.launch(assessmentId);
      if (response.url) {
        window.open(response.url, "_blank");
      } else {
        setError("No launch URL returned");
      }
    } catch (e) {
      setError(e.message || "Unable to get launch link");
    } finally {
      setCmBusyMap((m) => ({ ...m, [assessmentId]: false }));
    }
  };

  const handleSyncResults = async (assessmentId) => {
    setError(null);
    setCmBusyMap((m) => ({ ...m, [assessmentId]: true }));
    try {
      const response = await teacherApi.classmarker.syncResults(assessmentId);
      await loadData();
      if (!response.success) setError(response.message || "Sync returned no success flag");
    } catch (e) {
      setError(e.message || "Unable to sync results");
    } finally {
      setCmBusyMap((m) => ({ ...m, [assessmentId]: false }));
    }
  };

  const handleTogglePublish = async (resultId, currentPublished) => {
    setBusy(true);
    setError(null);

    try {
      await teacherApi.updateResult(resultId, { published: !currentPublished });
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to update result status.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dashboard-page cbt-page">
      <section className="cbt-hero">
        <div>
          <p className="dashboard-page-label">CBT</p>
          <h1>Computer-Based Test Management</h1>
          <p>Plan assessments, review performance, and publish results from one central exam dashboard.</p>
        </div>
        <button type="button" className="cbt-refresh-button" onClick={loadData} disabled={loading || busy}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </section>

      {error ? (
        <div className="cbt-error">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="cbt-loading">
          <Loader2 size={20} className="spinner" />
          <span>Loading CBT data…</span>
        </div>
      ) : null}

      {!loading ? (
        <section className="cbt-summary-grid">
          <article className="cbt-summary-card">
            <div className="cbt-summary-icon">
              <ClipboardList size={18} />
            </div>
            <div>
              <p>Assessments</p>
              <strong>{assessments.length}</strong>
            </div>
          </article>
          <article className="cbt-summary-card">
            <div className="cbt-summary-icon">
              <BarChart2 size={18} />
            </div>
            <div>
              <p>Published results</p>
              <strong>{publishedResults}</strong>
            </div>
          </article>
          <article className="cbt-summary-card">
            <div className="cbt-summary-icon">
              <Save size={18} />
            </div>
            <div>
              <p>Draft results</p>
              <strong>{draftResults}</strong>
            </div>
          </article>
        </section>
      ) : null}

      <section className="cbt-grid">
        <article className="cbt-panel">
          <div className="cbt-panel-head">
            <h2>Upcoming assessments</h2>
            <span>{assessments.length} planned</span>
          </div>
          {assessments.length ? (
            <ul className="cbt-list">
              {assessments.map((item) => (
                <li key={item.id} className="cbt-list-item">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.subject} • {item.className || "Unassigned"}</p>
                  </div>
                  <div className="cbt-list-meta">
                    <span>{formatDate(item.date)}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {(() => {
                        const meta = parseClassMarkerMeta(item.description);
                        if (meta && meta.remoteId) {
                          return (
                            <>
                              <button type="button" className="cbt-small-button" onClick={() => handleLaunchRemote(item.id)} disabled={cmBusyMap[item.id]}>
                                Launch
                              </button>
                              <button type="button" className="cbt-small-button" onClick={() => handleSyncResults(item.id)} disabled={cmBusyMap[item.id]}>
                                Sync
                              </button>
                            </>
                          );
                        }
                        return (
                          <button type="button" className="cbt-small-button" onClick={() => handleCreateRemoteExam(item.id)} disabled={cmBusyMap[item.id]}>
                            Create (ClassMarker)
                          </button>
                        );
                      })()}
                      <button
                        type="button"
                        className="cbt-icon-button"
                        onClick={() => handleDeleteAssessment(item.id)}
                        disabled={busy}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cbt-empty">No CBT assessments are scheduled yet. Create one to get started.</p>
          )}
        </article>

        <article className="cbt-panel">
          <div className="cbt-panel-head">
            <h2>Recent results</h2>
            <span>{results.length} records</span>
          </div>
          {results.length ? (
            <ul className="cbt-results-list">
              {results.map((item) => (
                <li key={item.id} className="cbt-results-item">
                  <div>
                    <strong>{item.studentName || "Unnamed student"}</strong>
                    <p>{item.subject} • {item.className}</p>
                  </div>
                  <div className="cbt-result-actions">
                    <span className={item.published ? "cbt-pill cbt-pill-success" : "cbt-pill cbt-pill-muted"}>
                      {item.published ? "Published" : "Draft"}
                    </span>
                    <button
                      type="button"
                      className="cbt-small-button"
                      onClick={() => handleTogglePublish(item.id, item.published)}
                      disabled={busy}
                    >
                      {item.published ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cbt-empty">No student results are available yet. Add exam results from the teacher workspace.</p>
          )}
        </article>

        <article className="cbt-panel cbt-form-panel">
          <div className="cbt-panel-head">
            <h2>Create new assessment</h2>
            <span>Plan a new CBT session or exam.</span>
          </div>

          <form className="cbt-form" onSubmit={handleCreateAssessment}>
            <label>
              <span>Title</span>
              <input name="title" value={form.title} onChange={handleFormChange} placeholder="Math term exam" required />
            </label>

            <label>
              <span>Subject</span>
              <input name="subject" value={form.subject} onChange={handleFormChange} placeholder="Mathematics" required />
            </label>

            <label>
              <span>Class</span>
              <input name="className" value={form.className} onChange={handleFormChange} placeholder="JSS 2" />
            </label>

            <label>
              <span>Date</span>
              <input type="date" name="date" value={form.date} onChange={handleFormChange} required />
            </label>

            <label>
              <span>Maximum score</span>
              <input type="number" name="maxScore" min="1" value={form.maxScore} onChange={handleFormChange} />
            </label>

            <label>
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Optional notes for the exam" rows="4" />
            </label>

            <button type="submit" className="cbt-submit-button" disabled={saving || busy}>
              <Plus size={16} />
              <span>{saving ? "Saving assessment…" : "Create assessment"}</span>
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
