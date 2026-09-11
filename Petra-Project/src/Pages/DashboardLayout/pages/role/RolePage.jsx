export default function RolePage({ title, description }) {
  return (
    <div className="dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>
      <section className="dashboard-home-content">
        <article className="dashboard-home-panel">
          <h2>{title}</h2>
          <p>{description}</p>
        </article>
      </section>
    </div>
  );
}

