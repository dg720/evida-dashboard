import { useAppContext } from "../context/AppContext.jsx";

function PersonaSelector() {
  const { personas, currentPersonaId, setCurrentPersonaId } = useAppContext();

  return (
    <div className="flex flex-wrap gap-3">
      {personas.map((persona) => (
        <button
          key={persona.id}
          type="button"
          onClick={() => setCurrentPersonaId(persona.id)}
          className={[
            "rounded-full px-4 py-2 text-sm font-medium transition",
            persona.id === currentPersonaId
              ? "bg-accent text-white shadow-glow"
              : "bg-white/70 text-slate-600 hover:bg-white",
          ].join(" ")}
        >
          {persona.name}
        </button>
      ))}
    </div>
  );
}

export default PersonaSelector;
