import Link from "next/link";

const REPO_URL = "https://github.com/jmanzo/centros-de-acopio-ven";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/60">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-relaxed">
          Centros de Acopio Ven · Herramienta libre y sin fines de lucro ·{" "}
          <span className="whitespace-nowrap">© {year}</span>
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a
            href={`${REPO_URL}/blob/main/CHANGELOG.md`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-700 hover:underline"
          >
            Changelog
          </a>
          <a
            href={`${REPO_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-700 hover:underline"
          >
            Licencia AGPL-3.0
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-700 hover:underline"
          >
            Código
          </a>
          <Link
            href="/admin"
            className="text-slate-400 hover:text-slate-700 hover:underline"
          >
            Administración
          </Link>
        </nav>
      </div>
    </footer>
  );
}
