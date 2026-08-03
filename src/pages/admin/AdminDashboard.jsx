import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import Loader from "../../components/Loader";

function useAdminToken() {
  const navigate = useNavigate();
  const token = localStorage.getItem("banglabid_admin_token");
  useEffect(() => {
    if (!token) navigate("/system-3212/admin-panel/login");
  }, [token, navigate]);
  return token;
}

export default function AdminDashboard() {
  const token = useAdminToken();
  const [tab, setTab] = useState("registrations");
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("banglabid_admin_token");
    navigate("/system-3212/admin-panel/login");
  }

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="flex items-center justify-between border-b border-[var(--color-paper-line)] bg-white/70 px-4 py-3">
        <h1 className="font-display text-xl font-bold text-[var(--color-ink)]">অ্যাডমিন প্যানেল — বাংলাবিদ</h1>
        <button onClick={logout} className="rounded-lg border-2 border-[var(--color-redpen)] px-3 py-1.5 text-sm font-bold text-[var(--color-redpen)]">
          লগআউট
        </button>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex gap-2">
          {[
            ["registrations", "রেজিস্ট্রেশন"],
            ["settings", "সেটিংস"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-2 font-display text-sm font-bold ${
                tab === key ? "bg-[var(--color-ink)] text-white" : "bg-white text-[var(--color-ink)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "registrations" ? <Registrations token={token} /> : <Settings token={token} />}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL = { pending: "পেন্ডিং", confirmed: "কনফার্মড", rejected: "রিজেক্টেড" };
const STATUS_CLS = {
  pending: "bg-[var(--color-marigold)]/20 text-[var(--color-marigold-dark)]",
  confirmed: "bg-[var(--color-greenpen)]/15 text-[var(--color-greenpen)]",
  rejected: "bg-[var(--color-redpen)]/15 text-[var(--color-redpen)]",
};

function Registrations({ token }) {
  const [rows, setRows] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("all");

  function load() {
    setRows(null);
    api.adminListRegistrations(token).then((res) => setRows(res.ok ? res.data : []));
  }

  useEffect(load, [token]);

  async function updateStatus(id, status) {
    setBusyId(id);
    await api.adminUpdateRegistrationStatus(token, id, status);
    setBusyId(null);
    load();
  }

  if (rows === null) return <Loader label="রেজিস্ট্রেশন লোড হচ্ছে…" />;

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <div className="mb-4 flex gap-2 text-sm">
        {["all", "pending", "confirmed", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 font-semibold ${
              filter === f ? "bg-[var(--color-ink)] text-white" : "bg-white text-[var(--color-ink)]"
            }`}
          >
            {f === "all" ? "সব" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.length === 0 && <p className="text-sm text-[var(--color-text)]/60">কোনো রেজিস্ট্রেশন নেই।</p>}
        {visible.map((r) => (
          <div key={r.id} className="rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display font-bold text-[var(--color-ink)]">{r.name}</p>
                <p className="text-sm text-[var(--color-text)]/70">
                  {r.className} শ্রেণি · {r.school} · {r.division}
                </p>
                <p className="text-sm text-[var(--color-text)]/70">{r.phone} · {r.email}</p>
                <p className="mt-1 text-sm text-[var(--color-bluepen)]">
                  বিকাশ: {r.bkashSender} · TrxID: {r.transactionId}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLS[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </div>

            {r.status !== "confirmed" && r.status !== "rejected" && (
              <div className="mt-3 flex gap-2">
                <button
                  disabled={busyId === r.id}
                  onClick={() => updateStatus(r.id, "confirmed")}
                  className="rounded-lg bg-[var(--color-greenpen)] px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  কনফার্ম করুন
                </button>
                <button
                  disabled={busyId === r.id}
                  onClick={() => updateStatus(r.id, "rejected")}
                  className="rounded-lg bg-[var(--color-redpen)] px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  রিজেক্ট করুন
                </button>
              </div>
            )}
            {(r.status === "confirmed" || r.status === "rejected") && (
              <button
                disabled={busyId === r.id}
                onClick={() => updateStatus(r.id, "pending")}
                className="mt-3 text-xs font-semibold text-[var(--color-bluepen)] underline"
              >
                পেন্ডিং-এ ফিরিয়ে নিন
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings({ token }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then((res) => setForm(res.data || {}));
  }, []);

  if (!form) return <Loader label="সেটিংস লোড হচ্ছে…" />;

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await api.adminUpdateSettings(token, form);
    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-4 rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-5">
      <Field label="কোর্স ফি (৳)">
        <input className="input" value={form.price || ""} onChange={set("price")} placeholder="যেমনঃ 99" />
      </Field>
      <Field label="ছাড়ের মেয়াদ শেষ হওয়ার তারিখ-সময়">
        <input className="input" type="datetime-local" value={form.discountDeadline || ""} onChange={set("discountDeadline")} />
      </Field>
      <Field label="কোর্স ছবির URL (Google Drive/Imgur লিংক)">
        <input className="input" value={form.courseImageUrl || ""} onChange={set("courseImageUrl")} placeholder="https://..." />
        <span className="mt-1 block text-xs text-[var(--color-text)]/60">
          Google Drive: ছবিতে রাইট-ক্লিক → Share → "Anyone with the link" সিলেক্ট করে লিংক কপি করুন
          (শেয়ার লিংক দিলেই চলবে, বিশেষ ফরম্যাটে বদলাতে হবে না)। Imgur: ছবি আপলোডের পর যে লিংক
          পাবেন সেটাই দিন।
        </span>
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
        <input type="checkbox" checked={!!form.maintenanceMode} onChange={set("maintenanceMode")} />
        মেইনটেন্যান্স মোড চালু করুন
      </label>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white disabled:opacity-60"
      >
        {saving ? "সেভ হচ্ছে…" : "সেভ করুন"}
      </button>
      {saved && <p className="text-center text-sm font-semibold text-[var(--color-greenpen)]">সেভ হয়েছে ✓</p>}
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-[var(--color-ink)]">{label}</span>
      {children}
    </label>
  );
}
