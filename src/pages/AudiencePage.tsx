const segments = [
  { name: "High Intent (Hot)", count: 12, color: "bg-utility-red-500" },
  { name: "Engaged (Contacted)", count: 24, color: "bg-utility-yellow-500" },
  { name: "New Leads", count: 48, color: "bg-utility-blue-500" },
  { name: "Converted (Won)", count: 18, color: "bg-utility-green-500" },
  { name: "Lost / Closed", count: 9, color: "bg-utility-neutral-400" },
];

const total = segments.reduce((s, seg) => s + seg.count, 0);

export default function AudiencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">Audience</h2>
        <p className="text-sm text-tertiary mt-0.5">
          Segment your leads by engagement and readiness.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map((seg) => (
          <div
            key={seg.name}
            className="rounded-xl border border-secondary bg-primary p-5 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${seg.color}`} />
              <div className="text-sm font-medium text-primary">{seg.name}</div>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-primary">
              {seg.count}
            </div>
            <div className="mt-1 text-xs text-tertiary">
              {Math.round((seg.count / total) * 100)}% of total leads
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-secondary bg-primary p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-primary mb-3">Audience Distribution</h3>
        <div className="flex h-4 rounded-full overflow-hidden ring-1 ring-inset ring-secondary">
          {segments.map((seg) => (
            <div
              key={seg.name}
              className={seg.color}
              style={{ width: `${(seg.count / total) * 100}%` }}
              title={`${seg.name}: ${seg.count}`}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {segments.map((seg) => (
            <div key={seg.name} className="flex items-center gap-1.5 text-xs text-tertiary">
              <div className={`h-2 w-2 rounded-full ${seg.color}`} />
              <span className="truncate">{seg.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
