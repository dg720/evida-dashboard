import { Link, NavLink } from "react-router-dom";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Chat Coach", to: "/chat" },
];

function NavBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 shadow-glow">
            <img src="/evida-icon.png" alt="Evida icon" className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-ink">Evida</p>
            <p className="text-xs text-slate-500">Wearables Health Dashboard & Coach</p>
          </div>
        </Link>
        <nav className="hidden gap-4 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-accent text-white shadow-glow"
                    : "text-slate-600 hover:bg-slate-100",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="md:hidden">
          <NavLink
            to="/dashboard"
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-glow"
          >
            Open Dashboard
          </NavLink>
        </div>
      </div>
    </header>
  );
}

export default NavBar;
