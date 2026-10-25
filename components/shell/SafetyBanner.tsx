export function SafetyBanner() {
  return (
    <div role="note" className="border-b border-warn/40 bg-warn-surface px-4 py-1.5 text-center text-xs font-medium text-warn sm:py-2 sm:text-sm">
      <span aria-hidden>⚠ </span>
      <span className="md:hidden">Synthetic data only. Ranks who needs support, never who qualifies. No medical advice.</span>
      <span className="hidden md:inline">
        Synthetic data only. This tool ranks who needs the most support to stay in a trial. It never decides who qualifies or who is excluded, and gives no medical advice.
      </span>
    </div>
  );
}
