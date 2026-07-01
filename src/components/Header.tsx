import Link from "next/link";

interface HeaderProps {
  /** Optional secondary line shown under the title. */
  subtitle?: string;
  /** When set, shows a "back to centros" link instead of the nav. */
  back?: boolean;
}

export function Header({ subtitle, back }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xl"
            aria-hidden
          >
            🤝
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-extrabold leading-tight text-slate-900">
              AlivioVenezuela
            </span>
            <span className="block truncate text-xs text-slate-500">
              {subtitle ?? "Centros de acopio · qué donar en tiempo real"}
            </span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm font-semibold">
          {back ? (
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              ← Centros
            </Link>
          ) : (
            <>
              <Link
                href="/registrar"
                className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"
              >
                Registrar
              </Link>
              <Link
                href="/centro"
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                Soy un centro
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
