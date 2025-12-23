import NavBar from "./NavBar.jsx";
import Footer from "./Footer.jsx";
import { useAppContext } from "../context/AppContext.jsx";

function Layout({ children }) {
  const { theme } = useAppContext();

  return (
    <div
      style={{
        "--accent": theme.accent,
        "--accent-soft": theme.accentSoft,
        "--accent-deep": theme.accentDeep,
      }}
      className="min-h-screen text-ink"
    >
      <div className="absolute inset-0 -z-10 opacity-80">
        <div className="absolute left-[10%] top-10 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute right-[12%] top-32 h-56 w-56 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute left-[30%] bottom-10 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />
      </div>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-6">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
