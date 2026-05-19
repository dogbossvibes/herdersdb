import { useState } from "react";
import { supabase } from "../supabase";

const SECTIONS = ["Grunddaten", "Stammbaum", "Gesundheit", "DNA", "Titel", "Besitzer"];

function buildGen4() {
  const parts = ["sire","dam"];
  const result = [];
  for (const a of parts) for (const b of parts) for (const c of parts) for (const d of parts) {
    const key = a+"_"+b+"_"+c+"_"+d;
    const label = [a,b,c,d].map(p => p==="sire"?"P":"M").join("");
    result.push({ key, label });
  }
  return result;
}

function buildGen5() {
  const parts = ["sire","dam"];
  const result = [];
  for (const a of parts) for (const b of parts) for (const c of parts) for (const d of parts) for (const e of parts) {
    const key = a+"_"+b+"_"+c+"_"+d+"_"+e;
    const label = [a,b,c,d,e].map(p => p==="sire"?"P":"M").join("");
    result.push({ key, label });
  }
  return result;
}

const PEDIGREE = [
  { gen: 1, label: "Generation 1 – Eltern", nodes: [
    { key: "sire", label: "Vater (Ruede)" },
    { key: "dam",  label: "Mutter (Hundin)" },
  ]},
  { gen: 2, label: "Generation 2 – Grosseltern", nodes: [
    { key: "sire_sire", label: "Vater des Vaters (PP)" },
    { key: "sire_dam",  label: "Mutter des Vaters (PM)" },
    { key: "dam_sire",  label: "Vater der Mutter (MP)" },
    { key: "dam_dam",   label: "Mutter der Mutter (MM)" },
  ]},
  { gen: 3, label: "Generation 3 – Urgrosseltern", nodes: [
    { key: "sire_sire_sire", label: "PPP" },
    { key: "sire_sire_dam",  label: "PPM" },
    { key: "sire_dam_sire",  label: "PMP" },
    { key: "sire_dam_dam",   label: "PMM" },
    { key: "dam_sire_sire",  label: "MPP" },
    { key: "dam_sire_dam",   label: "MPM" },
    { key: "dam_dam_sire",   label: "MMP" },
    { key: "dam_dam_dam",    label: "MMM" },
  ]},
];

const HEALTH = [
  { key: "hd",    label: "HD",           options: ["","A1","A2","B1","B2","C","D","E","nicht untersucht"] },
  { key: "ed",    label: "ED",           options: ["","0/0","1/0","1/1","2/0","2/1","nicht untersucht"] },
  { key: "augen", label: "Augen (CAER)", options: ["","frei","betroffen","nicht untersucht"] },
  { key: "herz",  label: "Herz",         options: ["","frei","betroffen","nicht untersucht"] },
];

const DNA = [
  { key: "mdr1",      label: "MDR1",             options: ["","N/N klar","M/N Traeger","M/M betroffen","nicht getestet"] },
  { key: "dew",       label: "Deg. Myelopathie", options: ["","N/N klar","A/N Traeger","A/A betroffen","nicht getestet"] },
  { key: "farbe",     label: "Farbgenetik",       options: ["","getestet","nicht getestet"] },
  { key: "dna_labor", label: "Labor",             options: ["","Laboklin","Embark","Orivet","Generatio","andere"] },
];

const TITLES = [
  { key: "schutzdienst", label: "Schutzdienst", placeholder: "z.B. KNPV PH1, IPO3, IGP3" },
  { key: "faehrte",      label: "Fahrte",       placeholder: "z.B. FH1, FH2" },
  { key: "obedience",    label: "Obedience",    placeholder: "z.B. OB1, OB2" },
  { key: "sport",        label: "Weitere",      placeholder: "z.B. NZH, NVBK, Rettungshund" },
];

const inp = {
  width: "100%", background: "#fff", border: "1.5px solid #e2e8f0",
  color: "#1e293b", borderRadius: 10, padding: "10px 14px", fontSize: 13.5,
  boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif",
  outline: "none", transition: "border-color .15s",
};
const sel = {
  ...inp, background: "#fff", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
};
const lbl = { fontSize: 11.5, color: "#64748b", display: "block", marginBottom: 5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "Inter, system-ui, sans-serif" };
const card = { background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 18, padding: "28px 32px", marginBottom: 16, boxShadow: "0 2px 12px rgba(15,23,42,0.06)" };

function Field({ f, form, set }) {
  return (
    <div style={{ gridColumn: f.full ? "1 / -1" : "auto", marginBottom: 18 }}>
      <label style={lbl}>{f.label}</label>
      {f.type === "select"
        ? <select value={form[f.key]||""} onChange={e => set(f.key, e.target.value)} style={sel}>
            {f.options.map(o => <option key={o} value={o}>{o||"– bitte waehlen –"}</option>)}
          </select>
        : f.type === "textarea"
          ? <textarea value={form[f.key]||""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder||""} rows={3} style={{...inp, resize:"vertical"}} />
          : <input type={f.type||"text"} value={form[f.key]||""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder||""} style={inp} />
      }
    </div>
  );
}

export default function HundImport() {
  const [section, setSection] = useState(0);
  const [form, setForm] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [openGen, setOpenGen] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase.from("dogs").insert({
      name:             form.name             || null,
      gender:           form.gender           || null,
      date_of_birth:    form.date_of_birth    || null,
      coat_type:        form.coat_type        || null,
      country_of_birth: form.country_of_birth || null,
      chip_number:      form.chip_number      || null,
      registry_number:  form.registry_number  || null,
      registry_org:     form.registry_org     || null,
      height_cm:        form.height_cm        ? Number(form.height_cm) : null,
      weight_kg:        form.weight_kg        ? Number(form.weight_kg) : null,
    });
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setSubmitted(true);
  };

  const gen4 = buildGen4();
  const gen5 = buildGen5();
  const allPedigree = [...PEDIGREE, { gen:4, label:"Generation 4 ("+gen4.length+" Vorfahren)", nodes: gen4 }, { gen:5, label:"Generation 5 ("+gen5.length+" Vorfahren)", nodes: gen5 }];

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const totalFilled = Object.values(form).filter(v => v && v !== "").length;
  const progress = Math.round((section / (SECTIONS.length - 1)) * 100);

  if (submitted) {
    return (
      <div style={{ minHeight:"100vh", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter, system-ui, sans-serif" }}>
        <div style={{ textAlign:"center", maxWidth:400, background:"#fff", borderRadius:24, padding:"48px 40px", boxShadow:"0 8px 40px rgba(15,23,42,0.10)" }}>
          <div style={{ width:64, height:64, background:"#ecfdf5", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:28 }}>✓</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:8 }}>Hund gespeichert!</div>
          <div style={{ color:"#64748b", fontSize:14, marginBottom:28 }}>
            <span style={{ color:"#6366f1", fontWeight:700 }}>{form.name||"Unbekannt"}</span> wurde erfolgreich eingetragen.
          </div>
          <button onClick={() => { setSubmitted(false); setForm({}); setSection(0); }}
            style={{ background:"#6366f1", border:"none", color:"#fff", borderRadius:12, padding:"12px 28px", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"Inter, system-ui, sans-serif", boxShadow:"0 4px 14px rgba(99,102,241,0.35)" }}>
            Weiteren Hund eingeben
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", fontFamily:"Inter, system-ui, sans-serif", color:"#1e293b" }}>
      <div style={{ maxWidth:960, margin:"0 auto", padding:"36px 32px" }}>

        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#0f172a", marginBottom:2, letterSpacing:"-0.02em" }}>Hund erfassen</div>
          <div style={{ fontSize:13, color:"#94a3b8" }}>{totalFilled} {totalFilled === 1 ? "Feld" : "Felder"} ausgefuellt</div>
          <div style={{ marginTop:12, height:4, background:"#e2e8f0", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width: progress+"%", background:"linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius:99, transition:"width .3s ease" }} />
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", gap:28 }}>

          <div>
            <div style={{ background:"#fff", border:"1.5px solid #f1f5f9", borderRadius:18, padding:"12px", boxShadow:"0 2px 12px rgba(15,23,42,0.06)" }}>
              {SECTIONS.map((sec, i) => (
                <button key={i} onClick={() => setSection(i)} style={{
                  width:"100%", background: section===i ? "#6366f1" : "transparent",
                  border:"none", color: section===i ? "#fff" : "#64748b",
                  borderRadius:10, padding:"10px 14px", cursor:"pointer", fontSize:13,
                  fontWeight: section===i ? 700 : 500, fontFamily:"Inter, system-ui, sans-serif",
                  textAlign:"left", marginBottom:2, transition:"all .15s",
                  display:"flex", alignItems:"center", gap:8,
                }}>
                  <span style={{ width:20, height:20, borderRadius:6, background: section===i ? "rgba(255,255,255,0.2)" : "#f1f5f9", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color: section===i ? "#fff" : "#94a3b8", flexShrink:0 }}>{i+1}</span>
                  {sec}
                </button>
              ))}
            </div>
            <div style={{ marginTop:12 }}>
              <button onClick={handleSave} disabled={saving} style={{ width:"100%", background:"#6366f1", border:"none", color:"#fff", borderRadius:12, padding:"13px", cursor: saving ? "not-allowed" : "pointer", fontSize:14, fontWeight:700, fontFamily:"Inter, system-ui, sans-serif", boxShadow:"0 4px 14px rgba(99,102,241,0.30)", opacity: saving ? 0.7 : 1, transition:"opacity .15s" }}>
                {saving ? "Speichert..." : "Speichern"}
              </button>
            </div>
          </div>

          <div>

            {section === 0 && (
              <div style={card}>
                <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:22, paddingBottom:16, borderBottom:"1.5px solid #f1f5f9" }}>Grunddaten</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
                  {[
                    { key:"name",                label:"Vollstaendiger Name *",  full:true, placeholder:"z.B. Arko van de Herdershof" },
                    { key:"gender",              label:"Geschlecht *",           type:"select", options:["","Ruede (male)","Hundin (female)"] },
                    { key:"date_of_birth",       label:"Geburtsdatum *",         type:"date" },
                    { key:"coat_type",           label:"Haartyp *",              type:"select", options:["","Kurzhaar","Langhaar","Rauhhaar"] },
                    { key:"country_of_birth",    label:"Geburtsland *",          type:"select", options:["","NL","DE","CH","BE","FR","PL","CZ","US","UK","andere"] },
                    { key:"country_of_residence",label:"Aktuelles Wohnland",     type:"select", options:["","NL","DE","CH","BE","FR","PL","CZ","US","UK","andere"] },
                    { key:"chip_number",         label:"Chip-Nummer",            placeholder:"756098100012345" },
                    { key:"registry_number",     label:"Zuchtbuchnummer",        placeholder:"z.B. NHSB 2901234" },
                    { key:"registry_org",        label:"Zuchtbuch-Org.",         type:"select", options:["","NHSB","SKG","VDH","SCC","AKC","KC","andere"] },
                    { key:"height_cm",           label:"Widerristhoehe (cm)",    type:"number", placeholder:"62" },
                    { key:"weight_kg",           label:"Gewicht (kg)",           type:"number", placeholder:"32" },
                  ].map(f => <Field key={f.key} f={f} form={form} set={set} />)}
                </div>
              </div>
            )}

            {section === 1 && (
              <div style={card}>
                <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:6, paddingBottom:16, borderBottom:"1.5px solid #f1f5f9" }}>Stammbaum – 5 Generationen</div>
                <div style={{ fontSize:13, color:"#94a3b8", marginBottom:20 }}>P = Vaterseite, M = Mutterseite. Z.B. PPM = Mutter des Vaters des Vaters.</div>
                {allPedigree.map(gen => (
                  <div key={gen.gen} style={{ marginBottom:10 }}>
                    <button onClick={() => setOpenGen(openGen===gen.gen ? 0 : gen.gen)}
                      style={{ width:"100%", background: openGen===gen.gen ? "#f5f3ff" : "#f8fafc", border:"1.5px solid "+ (openGen===gen.gen ? "#c4b5fd" : "#e2e8f0"), color: openGen===gen.gen ? "#6366f1" : "#475569", borderRadius:10, padding:"11px 16px", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"Inter, system-ui, sans-serif", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all .15s" }}>
                      <span>{gen.label}</span>
                      <span style={{ fontSize:11, opacity:.7 }}>{openGen===gen.gen ? "▲ schliessen" : "▼ oeffnen"}</span>
                    </button>
                    {openGen === gen.gen && (
                      <div style={{ marginTop:10, display:"grid", gridTemplateColumns: gen.gen <= 2 ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap:"0 16px", padding:"16px", background:"#f8fafc", borderRadius:12 }}>
                        {gen.nodes.map(node => (
                          <div key={node.key} style={{ marginBottom:14 }}>
                            <label style={{ ...lbl, color: node.key.startsWith("sire") ? "#3b82f6" : "#ec4899" }}>{node.label}</label>
                            <input value={form[node.key+"_name"]||""} onChange={e => set(node.key+"_name", e.target.value)} placeholder="Name" style={{ ...inp, marginBottom:6 }} />
                            <input value={form[node.key+"_reg"]||""}  onChange={e => set(node.key+"_reg",  e.target.value)} placeholder="Reg.-Nr." style={{ ...inp, fontSize:12, padding:"7px 12px" }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {section === 2 && (
              <div style={card}>
                <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:22, paddingBottom:16, borderBottom:"1.5px solid #f1f5f9" }}>Gesundheit</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
                  {HEALTH.map(f => <Field key={f.key} f={{ ...f, type:"select" }} form={form} set={set} />)}
                  <Field f={{ key:"health_date", label:"Untersuchungsdatum", type:"date" }} form={form} set={set} />
                  <Field f={{ key:"health_vet", label:"Tierarzt / Klinik", placeholder:"z.B. Tierklinik Zuerich" }} form={form} set={set} />
                </div>
              </div>
            )}

            {section === 3 && (
              <div style={card}>
                <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:22, paddingBottom:16, borderBottom:"1.5px solid #f1f5f9" }}>DNA-Analyse</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
                  {DNA.map(f => <Field key={f.key} f={{ ...f, type:"select" }} form={form} set={set} />)}
                  <Field f={{ key:"dna_date", label:"Testdatum", type:"date" }} form={form} set={set} />
                  <Field f={{ key:"coi_genomic", label:"Genomischer COI (%) von Embark/Orivet", type:"number", placeholder:"z.B. 4.2" }} form={form} set={set} />
                </div>
              </div>
            )}

            {section === 4 && (
              <div style={card}>
                <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:22, paddingBottom:16, borderBottom:"1.5px solid #f1f5f9" }}>Titel und Pruefungen</div>
                {TITLES.map(f => <Field key={f.key} f={f} form={form} set={set} />)}
                <Field f={{ key:"zuchteigung", label:"Zuchteignungspruefung", type:"select", options:["","Bestanden","Nicht bestanden","Ausstehend","Nicht erforderlich"] }} form={form} set={set} />
                <Field f={{ key:"titles_notes", label:"Weitere Angaben", type:"textarea", placeholder:"Weitere Pruefungen, Wettkampfergebnisse..." }} form={form} set={set} />
              </div>
            )}

            {section === 5 && (
              <div style={card}>
                <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:22, paddingBottom:16, borderBottom:"1.5px solid #f1f5f9" }}>Besitzer und Zuchter</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
                  {[
                    { key:"owner",             label:"Aktueller Besitzer" },
                    { key:"country_residence", label:"Wohnland Besitzer",  type:"select", options:["","NL","DE","CH","BE","FR","PL","CZ","US","UK","andere"] },
                    { key:"breeder",           label:"Zuchter" },
                    { key:"kennel",            label:"Zwingername",        placeholder:"z.B. van de Herdershof" },
                    { key:"breeding_approved", label:"Zuchtzulassung",     type:"select", options:["","Ja","Nein","In Pruefung"] },
                    { key:"workingdog_url",    label:"Working-dog URL",    type:"url", placeholder:"https://www.working-dog.com/dog/..." },
                    { key:"notes",             label:"Notizen",            type:"textarea", full:true, placeholder:"Weitere Angaben..." },
                  ].map(f => <Field key={f.key} f={f} form={form} set={set} />)}
                </div>
              </div>
            )}

            {saveError && (
              <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:10, fontSize:13, color:"#dc2626", fontFamily:"Inter, system-ui, sans-serif" }}>
                Fehler: {saveError}
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
              <button onClick={() => setSection(Math.max(0, section-1))} disabled={section===0}
                style={{ background:"#fff", border:"1.5px solid #e2e8f0", color: section===0 ? "#cbd5e1" : "#475569", borderRadius:10, padding:"9px 22px", cursor: section===0 ? "not-allowed" : "pointer", fontSize:13, fontWeight:600, fontFamily:"Inter, system-ui, sans-serif" }}>
                Zurueck
              </button>
              {section < SECTIONS.length-1
                ? <button onClick={() => setSection(section+1)} style={{ background:"#6366f1", border:"none", color:"#fff", borderRadius:10, padding:"9px 24px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"Inter, system-ui, sans-serif", boxShadow:"0 4px 14px rgba(99,102,241,0.30)" }}>Weiter →</button>
                : <button onClick={handleSave} disabled={saving} style={{ background:"#6366f1", border:"none", color:"#fff", borderRadius:10, padding:"9px 24px", cursor: saving ? "not-allowed" : "pointer", fontSize:13, fontWeight:700, fontFamily:"Inter, system-ui, sans-serif", boxShadow:"0 4px 14px rgba(99,102,241,0.30)", opacity: saving ? 0.7 : 1 }}>{saving ? "Speichert..." : "Hund speichern"}</button>
              }
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
