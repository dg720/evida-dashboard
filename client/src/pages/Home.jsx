import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext.jsx";
import SectionHeader from "../components/SectionHeader.jsx";

function Home() {
  const { personas, currentPersonaId, setCurrentPersonaId } = useAppContext();

  return (
    <div className="space-y-12">
      <section className="gradient-border">
        <div className="glass-card rounded-[18px] p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Wearables, simplified</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-ink md:text-5xl">
            See the story behind your steps, sleep, and stress.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Evida turns raw wearable data into a calm, readable dashboard and a supportive Health
            Coach. Compare personas, spot trends, and set smarter micro-goals.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-glow"
            >
              Explore the dashboard
            </Link>
            <Link
              to="/chat"
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
            >
              Talk to the Health Coach
            </Link>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Choose a persona"
          subtitle="Each persona ships with 30 days of wearable data so you can explore the dashboard."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {personas.map((persona) => (
            <button
              key={persona.id}
              type="button"
              onClick={() => setCurrentPersonaId(persona.id)}
              className={[
                "glass-card flex flex-col gap-3 rounded-2xl p-6 text-left transition",
                currentPersonaId === persona.id
                  ? "ring-2 ring-accent"
                  : "hover:-translate-y-1 hover:shadow-glow",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-xl font-semibold text-ink">{persona.name}</p>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accentDeep">
                  {persona.days} days
                </span>
              </div>
              <p className="text-sm text-slate-600">{persona.description}</p>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}

export default Home;
