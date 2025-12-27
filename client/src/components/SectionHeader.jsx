function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-display text-2xl font-semibold text-ink">{title}</p>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex-1">{action}</div> : null}
    </div>
  );
}

export default SectionHeader;
