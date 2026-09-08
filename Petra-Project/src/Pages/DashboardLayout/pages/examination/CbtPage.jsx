

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { request } from "../../../../services/apiClient";

function CbtPage() {
    const [searchParams] = useSearchParams();
    const [quizUrl, setQuizUrl] = useState("");
    const [error, setError] = useState("");
    const applicantId = searchParams.get("applicantId") || "";
    const assessmentId = searchParams.get("assessmentId") || "";

    useEffect(() => {
        if (!applicantId || !assessmentId) {
            setError("This assessment link is missing its application details.");
            return;
        }

        let active = true;
        request("/api/assessments/start", {
            method: "POST",
            body: JSON.stringify({ applicantId, assessmentId }),
        })
            .then((response) => {
                if (active) setQuizUrl(response.quizUrl || response.url || "");
            })
            .catch((requestError) => {
                if (active) setError(requestError.data?.message || requestError.message || "Unable to start the assessment.");
            });

        return () => {
            active = false;
        };
    }, [applicantId, assessmentId]);

    if (error) return <div className="dashboard-page">{error}</div>;
    if (!quizUrl) return <div className="dashboard-page">Preparing your assessment...</div>;

    return (
        <iframe
            src={quizUrl}
            title="Entrance assessment"
            width="100%"
            height="100%"
            style={{ border: "none", minHeight: "100vh" }}
        />
    );

}

export default CbtPage;