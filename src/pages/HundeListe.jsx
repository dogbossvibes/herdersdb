import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const coiColor = (coi) => {
  if (coi < 3) return "#22c55e";
  if (coi < 5) return "#f59e0b";
  if (coi < 8) return "#f97316";
  return "#ef4444";
};

const coiBg = (coi) => {
  if (coi < 3) return "#f0fdf4";
  if (coi < 5) return "#fffbeb";
  if (coi < 8) return "#fff7ed";
  return "#fef2f2";
};

const font = "Inter, system-ui, sans-serif";

export default function HundeListe() {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");

  useEffect(() => {
    supabase.from("dogs").select("*").then(({ data, error }) => {
      if (error) setFetchError(error.message);
      else setDogs(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = dogs.filter((d) => {
    const matchSearch =
      (d.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.country_of_birth || "").toLowerCase().includes(search.toLowerCase());
    const matchGender = genderFilter === "all" || d.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const dog = dogs.find((d) => d.id === selected);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Lade Hunde...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
        <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 14, padding: "24px 32px", color: "#dc2626", fontSize: 14 }}>
          Fehler beim Laden: {fetchError}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: font, color: "#1e293b", padding: "28px 32px" }}>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* Sidebar */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <input
            placeholder="Suche nach Name, Land..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", background: "#fff", border: "1.5px solid #e2e8f0", color: "#1e293b", borderRadius: 10, padding: "10px 14px", fontSize: 13.5, marginBottom: 10, boxSizing: "border-box", fontFamily: font, outline: "none" }}
          />

          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[["all", "Alle"], ["male", "Rueden"], ["female", "Huendinnen"]].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setGenderFilter(v)}
                style={{ flex: 1, background: genderFilter === v ? "#6366f1" : "#fff", border: "1.5px solid " + (genderFilter === v ? "#6366f1" : "#e2e8f0"), color: genderFilter === v ? "#fff" : "#64748b", borderRadius: 8, padding: "7px", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: font, transition: "all .15s" }}
              >
                {l}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>
            {filtered.length} {filtered.length === 1 ? "Hund" : "Hunde"}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#cbd5e1", fontSize: 13 }}>Keine Hunde gefunden</div>
          )}

          {filtered.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelected(d.id === selected ? null : d.id)}
              style={{ background: selected === d.id ? "#eef2ff" : "#fff", border: "1.5px solid " + (selected === d.id ? "#6366f1" : "#f1f5f9"), borderRadius: 14, padding: "14px 16px", cursor: "pointer", marginBottom: 8, boxShadow: "0 1px 4px rgba(15,23,42,0.05)", transition: "all .15s" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                    {d.country_of_birth && <span style={{ marginRight: 4 }}>{d.country_of_birth} ·</span>}{d.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 3 }}>
                    {[d.coat_type, d.hd ? "HD " + d.hd : null].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {d.coi_genomic != null && (
                  <div style={{ background: coiBg(d.coi_genomic), borderRadius: 8, padding: "3px 9px", textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: coiColor(d.coi_genomic) }}>COI {d.coi_genomic}%</div>
                  </div>
                )}
              </div>
              {d.titles && d.titles.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {d.titles.map((t) => (
                    <span key={t} style={{ background: "#f1f5f9", color: "#475569", fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99 }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div style={{ flex: 1, background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 20, padding: "32px 36px", boxShadow: "0 2px 12px rgba(15,23,42,0.06)", minHeight: 400 }}>
          {!dog && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 300, flexDirection: "column", gap: 12, color: "#cbd5e1" }}>
              <div style={{ fontSize: 40 }}>🐕</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Hund auswaehlen</div>
            </div>
          )}
          {dog && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 20, borderBottom: "1.5px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{dog.name}</div>
                  <div style={{ color: "#94a3b8", fontSize: 13.5, marginTop: 4 }}>
                    {[dog.country_of_birth, dog.coat_type, dog.gender === "male" ? "Rüde" : dog.gender === "female" ? "Hündin" : dog.gender].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {dog.titles && dog.titles.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {dog.titles.map((t) => (
                      <span key={t} style={{ background: "#eef2ff", color: "#6366f1", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {dog.coi_genomic != null && (
                <div style={{ background: coiBg(dog.coi_genomic), border: "1.5px solid " + coiColor(dog.coi_genomic) + "33", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ color: "#475569", fontWeight: 600, fontSize: 13 }}>Inzuchtkoeffizient (COI)</span>
                    <span style={{ color: coiColor(dog.coi_genomic), fontWeight: 800, fontSize: 20 }}>{dog.coi_genomic}%</span>
                  </div>
                  <div style={{ background: "#e2e8f0", borderRadius: 99, height: 8, overflow: "hidden" }}>
                    <div style={{ width: dog.coi_genomic + "%", background: coiColor(dog.coi_genomic), height: "100%", borderRadius: 99, transition: "width .4s ease" }} />
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  dog.hd            && ["HD-Ergebnis",  dog.hd],
                  dog.date_of_birth && ["Geburtsjahr",  new Date(dog.date_of_birth).getFullYear()],
                  dog.country_of_birth && ["Geburtsland", dog.country_of_birth],
                  dog.gender        && ["Geschlecht",   dog.gender === "male" ? "Rüde" : dog.gender === "female" ? "Hündin" : dog.gender],
                  dog.height_cm     && ["Groesse",      dog.height_cm + " cm"],
                  dog.weight_kg     && ["Gewicht",      dog.weight_kg + " kg"],
                  dog.registry_number && ["Zuchtbuch-Nr.", dog.registry_number],
                  dog.chip_number   && ["Chip-Nr.",     dog.chip_number],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} style={{ background: "#f8fafc", border: "1.5px solid #f1f5f9", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>{k}</div>
                    <div style={{ fontSize: 15, color: "#0f172a", fontWeight: 700, marginTop: 5 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
