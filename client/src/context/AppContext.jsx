import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { deriveTheme } from "../lib/theme.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [personas, setPersonas] = useState([]);
  const [currentPersonaId, setCurrentPersonaId] = useState(null);
  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userContext, setUserContext] = useState({
    age: 34,
    gender: "male",
    fitness_goal: "Train for a half marathon",
    sleep_goal: "Improve sleep duration",
  });

  useEffect(() => {
    async function loadPersonas() {
      setLoading(true);
      try {
        const data = await apiFetch("/personas");
        setPersonas(data);
        if (data.length) {
          setCurrentPersonaId((prev) => prev || data[0].id);
        }
      } catch {
        setMessage("Unable to load personas.");
      } finally {
        setLoading(false);
      }
    }
    loadPersonas();
  }, []);

  useEffect(() => {
    async function loadPersonaData() {
      if (!currentPersonaId) {
        return;
      }
      setLoading(true);
      try {
        const data = await apiFetch(`/persona/${currentPersonaId}/data`);
        setSeries(data.data || []);
        setSummary(data.summary || null);
      } catch {
        setMessage("Unable to load persona data.");
      } finally {
        setLoading(false);
      }
    }
    loadPersonaData();
  }, [currentPersonaId]);

  const theme = useMemo(() => deriveTheme(summary?.stress_index), [summary]);

  const value = {
    personas,
    currentPersonaId,
    setCurrentPersonaId,
    series,
    setSeries,
    summary,
    setSummary,
    loading,
    message,
    setMessage,
    userContext,
    setUserContext,
    theme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
