function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-accent text-white shadow-glow"
          : "bg-white/70 text-slate-600 hover:bg-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default TabButton;
