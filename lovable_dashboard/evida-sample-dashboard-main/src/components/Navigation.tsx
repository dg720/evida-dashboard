import { Activity, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();

  const tabs = [
    { id: "mvp", label: "MVP Dashboard", path: "/mvp" },
    { id: "today", label: "Extended Dashboard", path: "/" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  location.pathname === tab.path
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Profile */}
          <button className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
            <User className="w-5 h-5 text-primary" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
