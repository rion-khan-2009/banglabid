import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import CountdownBanner from "../components/CountdownBanner";
import PunchHoles from "../components/PunchHoles";
import Loader from "../components/Loader";

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSettings()
      .then((res) => setSettings(res.data || {}))
      .catch(() => setSettings({}))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {settings && (
        <CountdownBanner
          price={settings.price}
          deadline={settings.discountDeadline}
          maintenanceMode={settings.maintenanceMode}
        />
      )}

      <section className="relative overflow-hidden">
        <div className="margin-rule paper-lines mx-auto max-w-5xl px-4 py-14 md:py-20">
          <PunchHoles />
          <div className="grid items-center gap-10 pl-6 md:grid-cols-2 md:pl-16">
            <div>
              <p className="mb-3 inline-block rounded-full bg-[var(--color-ink)] px-3 py-1 font-display text-xs font-semibold text-[var(--color-paper)]">
                অগ্রদূত উপস্থাপন করছে
              </p>
              <h1 className="font-display text-4xl font-extrabold leading-tight text-[var(--color-ink)] md:text-5xl">
                বাংলাবিদ
              </h1>
              <p className="mt-1 font-display text-lg font-semibold text-[var(--color-marigold-dark)]">
                প্রস্তুতি ফ্রি কোর্স
              </p>
              <p className="mt-4 text-base leading-relaxed text-[var(--color-text)]/90 md:text-lg">
                ষষ্ঠ থেকে দশম শ্রেণির শিক্ষার্থীদের জন্য সম্পূর্ণ বিনামূল্যে মডেল টেস্ট কোর্স।
                এমসিকিউ ও লিখিত মক টেস্ট, লাইভ পরীক্ষা, বিস্তারিত বিশ্লেষণ ও র‍্যাঙ্কিং —
                সবকিছু এক জায়গায়।
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rounded-xl bg-[var(--color-redpen)] px-6 py-3 font-display text-base font-bold text-white shadow-lg shadow-[var(--color-redpen)]/20 transition hover:brightness-110 active:scale-95"
                >
                  এখনই ভর্তি হোন
                </Link>
                <Link
                  to="/status"
                  className="rounded-xl border-2 border-[var(--color-ink)] px-6 py-3 font-display text-base font-bold text-[var(--color-ink)] transition hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
                >
                  রেজিস্ট্রেশন স্ট্যাটাস দেখুন
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border-4 border-white bg-[var(--color-ink)] shadow-2xl">
                {settings?.courseImageUrl ? (
                  <img
                    src={settings.courseImageUrl}
                    alt="বাংলাবিদ কোর্স"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--color-paper)]/70">
                    <span className="font-display text-5xl">বি</span>
                    <span className="text-sm">কোর্সের ছবি এডমিন প্যানেল থেকে যুক্ত হবে</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-4 -left-4 rotate-[-4deg] rounded-lg bg-[var(--color-marigold)] px-4 py-2 font-display text-sm font-bold text-[var(--color-ink-dark)] shadow-lg">
                {loading ? "মূল্য লোড হচ্ছে…" : settings?.price ? `৳${settings.price} টাকায়` : "ফ্রি"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">
          কোর্সে যা যা থাকছে
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["এমসিকিউ মক টেস্ট", "৪০টি প্রশ্ন, ৪০ মিনিট সময়, যতবার ইচ্ছা অনুশীলন।"],
            ["লিখিত মক টেস্ট", "উদ্দীপকভিত্তিক প্রশ্ন, খাতায় লিখে ছবি তুলে জমা দিন।"],
            ["লাইভ পরীক্ষা", "নির্দিষ্ট সময়ে সবার সাথে প্রতিযোগিতামূলক পরীক্ষা ও র‍্যাঙ্কিং।"],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="rounded-xl border border-[var(--color-paper-line)] bg-white/60 p-5 shadow-sm"
            >
              <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">{title}</h3>
              <p className="mt-2 text-sm text-[var(--color-text)]/80">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-lg border border-dashed border-[var(--color-paper-line)] p-4 text-sm text-[var(--color-text)]/70">
          পরীক্ষা কেন্দ্র (এক্সাম সেন্টার) ও স্টুডেন্ট লগইন শীঘ্রই আসছে — রেজিস্ট্রেশন এখন থেকেই চালু।
        </p>
      </section>
    </div>
  );
}
