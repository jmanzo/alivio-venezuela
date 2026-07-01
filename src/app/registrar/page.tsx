import { Header } from "@/components/Header";
import { RegisterCentroForm } from "@/components/RegisterCentroForm";

export const metadata = {
  title: "Registrar un centro de acopio — Centros de Acopio",
};

export default function RegistrarPage() {
  return (
    <>
      <Header subtitle="Registrar un centro" back />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4">
          <h1 className="text-xl font-extrabold text-slate-900">
            Registrar un centro de acopio
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Completa los datos de tu centro. Una vez aprobado, podrás publicar en
            tiempo real qué artículos necesitas.
          </p>
          <div className="mt-4">
            <RegisterCentroForm />
          </div>
        </div>
      </main>
    </>
  );
}
