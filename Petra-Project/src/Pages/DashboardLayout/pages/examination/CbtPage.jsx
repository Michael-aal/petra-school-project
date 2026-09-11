
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { request } from "../../../../services/apiClient";
import "../page-styles/CbtPage.css";

function CbtPage() {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const applicantId = searchParams.get("applicantId") || "";
    const assessmentId = searchParams.get("assessmentId") || "";

    const startExam = async () => {
        if (!applicantId || !assessmentId) {
            setError("This assessment link is missing its application details.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await request("/api/assessments/start", {
                method: "POST",
                body: JSON.stringify({ applicantId, assessmentId }),
            });

            const quizUrl = response.quizUrl || response.url || "";
            if (!quizUrl) {
                setError("No assessment URL was returned by the backend.");
                return;
            }

            window.location.assign(quizUrl);
        } catch (requestError) {
            setError(requestError.data?.message || requestError.message || "Unable to start the assessment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-page cbt-page simple">
            <div className="cbt-page-shell">
                <section className="cbt-card">
                    <div className="cbt-card-header">
                        <span className="cbt-logo">PETRA SCHOOL</span>
                        <span className="cbt-kicker">Entrance Examination</span>
                    </div>

                    <div className="cbt-card-body">
                        <div className="cbt-check-icon" aria-hidden="true">✓</div>
                        <h1>Application submitted successfully.</h1>
                        <p className="cbt-subtitle">Your examination is ready.</p>

                        <div className="cbt-instructions">
                            <p>Please read the following instructions carefully:</p>
                            <ol>
                                <li>Click START EXAM to launch your assessment.</li>
                                <li>Complete the exam in one session.</li>
                                <li>Do not share your test link or personal details.</li>
                            </ol>
                        </div>

                        {error ? <div className="cbt-error">{error}</div> : null}

                        <button className="cbt-primary-btn" type="button" onClick={startExam} disabled={loading || !applicantId || !assessmentId}>
                            {loading ? "Preparing..." : "START EXAM"}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default CbtPage;