import { BusFront, MapPinned, UsersRound, Wrench } from "lucide-react";
import "../page-styles/BusPage.css";

export default function BusPage() {
  return (
    <div className="dashboard-page bus-page">
      <header className="bus-hero">
        <div>
          <p className="dashboard-page-label">Academics / Transport</p>
          <h1>School bus</h1>
          <p>
            Keep routes, drivers, and student transport assignments in one
            operational view.
          </p>
        </div>
        <button type="button" className="bus-primary-action">
          <BusFront size={17} /> Add route
        </button>
      </header>
      <section className="bus-stat-grid">
        <article>
          <MapPinned size={19} />
          <strong>0</strong>
          <span>Active routes</span>
        </article>
        <article>
          <UsersRound size={19} />
          <strong>0</strong>
          <span>Assigned learners</span>
        </article>
        <article>
          <Wrench size={19} />
          <strong>0</strong>
          <span>Vehicles in service</span>
        </article>
      </section>
      <section className="bus-empty-panel">
        <div className="bus-empty-icon">
          <BusFront size={26} />
        </div>
        <h2>Transport setup is ready</h2>
        <p>
          Connect your routes and vehicle assignments here when transport
          records are available.
        </p>
        <button type="button" className="bus-secondary-action">
          Create first route
        </button>
      </section>
    </div>
  );
}
