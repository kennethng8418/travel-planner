import { TravelPlanner } from "@/components/TravelPlanner";
import { TropicalBackdrop } from "@/components/TropicalBackdrop";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-[var(--background)]">
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(199,167,106,0.18) 0%, transparent 28%), radial-gradient(circle at 85% 80%, rgba(31,181,201,0.14) 0%, transparent 35%)",
        }}
      />
      <TropicalBackdrop />
      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <TravelPlanner />
      </main>
      <footer className="relative py-4 text-center text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] sm:text-xs">
        Day-by-day plans · refine anytime in chat
      </footer>
    </div>
  );
}
