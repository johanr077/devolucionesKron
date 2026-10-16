import { AccessGate } from "@/components/AccessGate";
import { ReturnForm } from "@/components/ReturnForm";

export default function Home() {
  return (
    <main className="mx-auto min-h-dvh max-w-xl">
      <header className="relative bg-kron-purple text-white">
        <div className="px-5 pb-16 pt-7">
          <span className="inline-flex rounded-full bg-kron-indigo px-5 py-1.5 font-display text-2xl font-bold lowercase tracking-tight ring-1 ring-white/25">
            krön
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight">
            Devoluciones y mercancía no entregada
          </h1>
          <p className="mt-1 text-sm text-white/75">Escanea la nota, marca lo que regresa y envía.</p>
        </div>
        {/* Borde de chocolate derretido */}
        <svg
          className="absolute bottom-0 left-0 h-10 w-full"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,40 C240,80 480,0 720,30 C960,60 1200,10 1440,40 L1440,80 L0,80 Z" fill="#5A2E17" />
          <path d="M0,56 C240,86 480,26 720,50 C960,74 1200,34 1440,58 L1440,80 L0,80 Z" fill="#F7EEDF" />
        </svg>
      </header>
      <AccessGate>
        <ReturnForm />
      </AccessGate>
    </main>
  );
}
