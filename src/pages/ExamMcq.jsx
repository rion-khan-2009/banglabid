import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useExamSecurity } from "../hooks/useExamSecurity";
import Loader from "../components/Loader";

const EXAM_MINUTES = 40;

export default function ExamMcq() {
  const [stage, setStage] = useState("gate"); // gate -> exam -> result
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedText }
  const [secondsLeft, setSecondsLeft] = useState(EXAM_MINUTES * 60);
  const [result, setResult] = useState(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const examMetaRef = useRef({ phone: "", email: "" });

  async function submitExam({ autoSubmitted = false } = {}) {
    if (stage !== "exam") return;
    setStage("submitting");
    security.exitSecurityMode();

    const payload = Object.entries(answersRef.current).map(([id, selectedText]) => ({ id, selectedText }));
    try {
      const res = await api.submitMcqExam({
        phone: examMetaRef.current.phone,
        email: examMetaRef.current.email,
        examType: "mock",
        answers: payload,
        violations: security.violations,
        autoSubmitted,
      });
      if (res.ok) {
        setResult(res.data);
        setStage("result");
      } else {
        setError(res.message || "জমা দেওয়া যায়নি।");
        setStage("exam");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করা যায়নি।");
      setStage("exam");
    }
  }

  const security = useExamSecurity({
    enabled: stage === "exam",
    onAutoSubmit: () => submitExam({ autoSubmitted: true }),
  });

  // টাইমার
  useEffect(() => {
    if (stage !== "exam") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          submitExam({ autoSubmitted: false });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  async function startExam(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.startMcqExam(phone, email, "mock");
      if (res.ok) {
        setQuestions(res.data.questions);
        examMetaRef.current = { phone, email };
        setSecondsLeft(EXAM_MINUTES * 60);
        setAnswers({});
        setStage("exam");
      } else {
        setError(res.message || "পরীক্ষা শুরু করা যায়নি।");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "gate") {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-[var(--color-ink)]">এমসিকিউ মক টেস্ট</h1>
        <p className="mt-1 text-sm text-[var(--color-text)]/70">
          পরীক্ষা শুরু করতে আপনার রেজিস্ট্রেশনের মোবাইল নম্বর ও ইমেইল দিন (রেজিস্ট্রেশন কনফার্মড থাকতে হবে)।
        </p>

        <div className="mt-4 rounded-lg border border-[var(--color-bluepen)]/30 bg-[var(--color-bluepen)]/10 p-3 text-xs leading-relaxed text-[var(--color-ink)]">
          পরীক্ষা শুরু হলে স্ক্রিন ফুলস্ক্রিন হয়ে যাবে, রাইট-ক্লিক ও কপি বন্ধ থাকবে, এবং ট্যাব
          পরিবর্তন করলে বা ফুলস্ক্রিন থেকে বের হলে সতর্কতা দেখানো হবে। ৩ বার সতর্কতার পর পরীক্ষা
          স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-[var(--color-redpen)]/10 px-4 py-2 text-sm font-medium text-[var(--color-redpen)]">
            {error}
          </p>
        )}

        <form onSubmit={startExam} className="mt-4 space-y-4">
          <input
            className="input"
            required
            placeholder="মোবাইল নম্বর"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
            inputMode="numeric"
            maxLength={11}
          />
          <input
            className="input"
            required
            type="email"
            placeholder="ইমেইল"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--color-redpen)] px-6 py-3 font-display font-bold text-white disabled:opacity-60"
          >
            {loading ? "শুরু হচ্ছে…" : "পরীক্ষা শুরু করুন"}
          </button>
        </form>
        {loading && <Loader />}
      </div>
    );
  }

  if (stage === "submitting") {
    return <Loader full label="উত্তর জমা হচ্ছে…" />;
  }

  if (stage === "result" && result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-[var(--color-paper-line)] bg-white/70 p-6 text-center">
          <p className="font-display text-lg font-semibold text-[var(--color-ink)]">আপনার ফলাফল</p>
          <p className="mt-2 font-display text-5xl font-extrabold text-[var(--color-greenpen)]">
            {result.score} <span className="text-2xl text-[var(--color-text)]/60">/ {result.total}</span>
          </p>
        </div>

        <h2 className="mt-8 font-display text-xl font-bold text-[var(--color-ink)]">বিশ্লেষণ</h2>
        <div className="mt-4 space-y-3">
          {result.details.map((d, i) => (
            <div
              key={d.id}
              className={`rounded-xl border p-4 ${
                d.isCorrect
                  ? "border-[var(--color-greenpen)]/30 bg-[var(--color-greenpen)]/5"
                  : "border-[var(--color-redpen)]/30 bg-[var(--color-redpen)]/5"
              }`}
            >
              <p className="font-semibold text-[var(--color-ink)]">
                {i + 1}. {d.question}
              </p>
              <p className="mt-1 text-sm">
                আপনার উত্তর: <span className={d.isCorrect ? "text-[var(--color-greenpen)]" : "text-[var(--color-redpen)]"}>{d.selectedText || "উত্তর দেননি"}</span>
              </p>
              {!d.isCorrect && (
                <p className="text-sm text-[var(--color-greenpen)]">সঠিক উত্তর: {d.correctText}</p>
              )}
              {d.explanation && <p className="mt-1 text-xs text-[var(--color-text)]/60">ব্যাখ্যা: {d.explanation}</p>}
            </div>
          ))}
        </div>

        <Link
          to="/"
          className="mt-8 inline-block rounded-xl bg-[var(--color-ink)] px-6 py-3 font-display font-bold text-white"
        >
          হোমপেজে ফিরুন
        </Link>
      </div>
    );
  }

  // stage === "exam"
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeUp = secondsLeft <= 300; // শেষ ৫ মিনিটে লাল রঙে সতর্ক করা

  return (
    <div
      className="min-h-screen bg-[var(--color-paper)] pb-24 select-none"
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className={`sticky top-0 z-30 flex items-center justify-between px-4 py-2 font-display font-bold text-white ${
          timeUp ? "bg-[var(--color-redpen)]" : "bg-[var(--color-ink)]"
        }`}
      >
        <span>এমসিকিউ মক টেস্ট</span>
        <span className="tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-[var(--color-paper-line)] bg-white/70 p-4">
            <p className="font-semibold text-[var(--color-ink)]">
              {i + 1}. {q.question}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    answers[q.id] === opt
                      ? "border-[var(--color-marigold)] bg-[var(--color-marigold)]/15"
                      : "border-[var(--color-paper-line)]"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    className="accent-[var(--color-marigold)]"
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => submitExam({ autoSubmitted: false })}
          className="w-full rounded-xl bg-[var(--color-redpen)] px-6 py-3 font-display text-base font-bold text-white"
        >
          পরীক্ষা জমা দিন
        </button>
      </div>

      {security.warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="font-display text-lg font-bold text-[var(--color-redpen)]">⚠ সতর্কতা</p>
            <p className="mt-2 text-sm text-[var(--color-text)]">{security.warning.message}</p>
            {!security.warning.final && (
              <button
                onClick={() => {
                  security.dismissWarning();
                  security.requestFullscreen();
                }}
                className="mt-4 rounded-xl bg-[var(--color-ink)] px-5 py-2 font-display font-bold text-white"
              >
                বুঝেছি, চালিয়ে যাই
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
