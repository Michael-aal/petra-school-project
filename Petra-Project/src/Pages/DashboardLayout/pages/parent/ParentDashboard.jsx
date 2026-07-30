import { useContext } from "react";
import { UserContext } from "../../../../context/UserContext"
import {ArrowRight, GraduationCap, ClipboardCheck, FileText, BookOpen} from "lucide-react"
import "../page-styles/ParentDashboard.css"

export default function ParentDashboard(){
  //1. Get the logged-in user's info and global student list 
  const { userInfo } = useContext(UserContext);
  
  // 2. Safely get the children array (defaults to empty array if none yet)
  const myChildren = userInfo?.children || [];

  return (
    <div className="parent-dashboard dashboard-home">
      <section className="parent-hero">
        <article className="parent-hero-card">
          <h3>Welcome back, {userInfo?.firstName || "Parent"}</h3>
          <p>Here is the latest progress for your {myChildren.length} enrolled child(ren).</p>
          <div className="parent-chip-row">
            <span className="parent-chip">{myChildren.length} children enrolled</span>
            {/* Add more dynamic chips here based on real data */}
          </div>
        </article>
      </section>

      <section className="parent-grid">
        <article className="dashboard-home-panel">
          <h2>Your Children</h2>
          {myChildren.length > 0 ? (
            <div className="parent-list">
              {myChildren.map((child) => (
                <div key={child.id} className="parent-list-item">
                  <div>
                    <strong>{child.name}</strong>
                    <p>{child.class}</p>
                  </div>
                  <div className="parent-pill">{child.status || "Active"}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ padding: "20px", color: "oklch(0.6 0.02 250)" }}>
              No children linked to this account yet. Please contact the school admin.
            </p>
          )}
        </article>
      </section>
    </div>
  )}