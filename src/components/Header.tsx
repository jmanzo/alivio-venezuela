export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xl"
          aria-hidden
        >
          🤝
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold leading-tight text-slate-900">
            AlivioVenezuela
          </h1>
          <p className="truncate text-xs text-slate-500">
            Coordinación de ayuda en tiempo real · sin registro
          </p>
        </div>
      </div>
    </header>
  );
}
