import { useContext } from "react";
import { useParams } from "react-router-dom";
import { UserContext } from "../../../../context/UserContext";
import "../page-styles/ParentDashboard.css";
import { getParentPortalProfile } from "../../../../utils/parentPortalData";

export default function ParentDashboard() {
  const { parentId } = useParams();
  const { userInfo } = useContext(UserContext);

  const selectedParent = getParentPortalProfile(parentId);
  const myChildren = selectedParent?.children || userInfo?.children || [];
  const parentLabel =
    selectedParent?.parentName || userInfo?.firstName || "Parent";

  return (
    <div className="parent-dashboard dashboard-home">
      <section className="parent-hero">
        <article className="parent-hero-card">
          <h3>
            {selectedParent
              ? `Parent portal for ${parentLabel}`
              : `Welcome back, ${parentLabel}`}
          </h3>
          <p>
            {selectedParent
              ? `Here is the latest progress for ${parentLabel}'s ${myChildren.length} linked child(ren).`
              : `Here is the latest progress for your ${myChildren.length} enrolled child(ren).`}
          </p>
          <div className="parent-chip-row">
            <span className="parent-chip">
              {myChildren.length} children linked
            </span>
            {selectedParent ? (
              <span className="parent-chip">{selectedParent.email}</span>
            ) : null}
          </div>
        </article>
      </section>

      <section className="parent-grid">
        <article className="dashboard-home-panel">
          <h2>
            {selectedParent ? `${parentLabel}'s Children` : "Your Children"}
          </h2>
          {myChildren.length > 0 ? (
            <div className="parent-list">
              {myChildren.map((child) => (
                <div key={child.id} className="parent-list-item">
                  <div>
                    <strong>{child.name}</strong>
                    <p>
                      {child.class}
                      {child.teacher ? ` • ${child.teacher}` : ""}
                    </p>
                  </div>
                  <div className="parent-pill">{child.status || "Active"}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ padding: "20px", color: "oklch(0.6 0.02 250)" }}>
              No children linked to this account yet. Please contact the school
              admin.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}
