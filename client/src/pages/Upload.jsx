import { useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import { useAppContext } from "../context/AppContext.jsx";
import { API_BASE_URL } from "../lib/api.js";

function Upload() {
  const { setSeries, setSummary, setMessage } = useAppContext();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setStatus("Please select a file to upload.");
      return;
    }
    setStatus("Uploading...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const data = await response.json();
      setSeries(data.data || []);
      setSummary(data.summary || null);
      setMessage("Upload complete.");
      setStatus("Upload complete. Visit the dashboard to explore your data.");
    } catch {
      setStatus("Unable to upload the file. Please check the format.");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Upload data"
        subtitle="Import CSV or JSON exports to power the same charts and coach insights."
      />
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold text-slate-600">Select a file</p>
            <input
              type="file"
              accept=".csv,.json"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
            />
            <p className="mt-3 text-xs text-slate-500">
              Expected columns: date, steps, sleep_hours, stress_index, resting_hr, hrv_rmssd,
              calories_burned, sleep_efficiency.
            </p>
          </div>
          <div className="flex flex-col justify-between gap-4">
            <button
              type="submit"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-glow"
            >
              Upload and analyze
            </button>
            {status ? <p className="text-sm text-slate-600">{status}</p> : null}
          </div>
        </div>
      </form>
    </div>
  );
}

export default Upload;
