import "./SkeletonLoader.css";

export function SkeletonBox({ width = "100%", height = "20px", borderRadius = "8px", className = "" }) {
  return (
    <div
      className={`petra-skeleton-shimmer ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="petra-skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="petra-skeleton-card">
          <div className="skeleton-card-head">
            <SkeletonBox width="45%" height="16px" />
            <SkeletonBox width="36px" height="36px" borderRadius="10px" />
          </div>
          <SkeletonBox width="70%" height="32px" borderRadius="6px" />
          <div className="skeleton-card-foot">
            <SkeletonBox width="35%" height="16px" borderRadius="999px" />
            <SkeletonBox width="40%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="petra-skeleton-table-wrap">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} width={`${80 / cols}%`} height="18px" />
        ))}
      </div>
      <div className="skeleton-table-body">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="skeleton-table-row">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonBox key={c} width={`${c === 0 ? 30 : c === 1 ? 60 : 45}%`} height="16px" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SkeletonLoader({ type = "table", count = 4, rows = 5, cols = 5 }) {
  if (type === "cards") return <SkeletonCards count={count} />;
  return <SkeletonTable rows={rows} cols={cols} />;
}
