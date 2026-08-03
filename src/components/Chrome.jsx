import { Link } from "react-router-dom";

export function TopBar() {
  return (
    <header className="border-b border-[var(--color-paper-line)] bg-[var(--color-paper)]/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-ink)] font-display text-sm font-bold text-[var(--color-paper)]">
            অ
          </span>
          <span className="font-display text-lg font-bold text-[var(--color-ink)]">
            অগ্রদূত
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-[var(--color-ink)]">
          <Link
            to="/status"
            className="rounded-full bg-[var(--color-marigold)] px-4 py-1.5 font-display font-bold text-[var(--color-ink-dark)] shadow-sm transition hover:brightness-110"
          >
            রেজিস্ট্রেশন স্ট্যাটাস
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-paper-line)] bg-[var(--color-ink)] py-6 text-center text-sm text-[var(--color-paper)]/80">
      <p>© ২০২৬ অগ্রদূত। সর্বস্বত্ব সংরক্ষিত।</p>
    </footer>
  );
}
