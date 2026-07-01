export function SetupBanner() {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-bold">🧪 Modo demostración (datos de ejemplo)</p>
      <p className="mt-1">
        Estás viendo datos en memoria. La sincronización en vivo entre
        dispositivos se activa al configurar Supabase: ejecuta{" "}
        <code className="rounded bg-amber-100 px-1">
          supabase/migrations/0001_init.sql
        </code>{" "}
        y define{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>
        ,{" "}
        <code className="rounded bg-amber-100 px-1">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        y{" "}
        <code className="rounded bg-amber-100 px-1">
          SUPABASE_SERVICE_ROLE_KEY
        </code>
        .
      </p>
    </div>
  );
}
