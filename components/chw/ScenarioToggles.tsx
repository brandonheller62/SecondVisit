import type { Scenario } from "@/lib/types";

const toggles: { key: keyof Scenario; label: string; icon: string; help: string; tone: "accent" | "warn" }[] = [
  { key: "eveningVisits", label: "Evening visits", icon: "☾", help: "Offer a 5:30 PM option for morning visits", tone: "accent" },
  { key: "rideVouchers", label: "Ride vouchers", icon: "⛟", help: "Rides paid up front", tone: "accent" },
  { key: "stormWeek", label: "Storm closure week", icon: "☈", help: "Hurricane closes the clinic for a week", tone: "warn" },
];

export function ScenarioToggles({ scenario, onChange }: { scenario: Scenario; onChange: (s: Scenario) => void }) {
  return (
    <fieldset className="flex flex-wrap gap-3">
      <legend className="sr-only">What-if scenario</legend>
      {toggles.map((t) => {
        const on = scenario[t.key];
        const onStyle = t.tone === "warn" ? "border-warn bg-warn/15" : "border-accent bg-accent/15";
        return (
          <button
            key={t.key}
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => onChange({ ...scenario, [t.key]: !on })}
            className={`flex min-w-56 flex-1 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
              on ? onStyle : "border-line bg-surface hover:border-muted"
            }`}
          >
            <span aria-hidden className="text-2xl">{t.icon}</span>
            <span className="flex-1">
              <span className="block font-semibold">{t.label}</span>
              <span className="block text-sm text-muted">{t.help}</span>
            </span>
            <span
              aria-hidden
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${on ? (t.tone === "warn" ? "bg-warn text-bg" : "bg-accent text-accent-ink") : "bg-surface-2 text-muted"}`}
            >
              {on ? "ON" : "OFF"}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
