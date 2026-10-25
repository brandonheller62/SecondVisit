export function SafetyBanner() {
  return (
    <div role="note" className="border-b border-warn/40 bg-[#2a2310] px-4 py-2 text-center text-sm font-medium text-warn">
      <span aria-hidden>⚠ </span>
      Synthetic data only. This tool never says whether a real person qualifies and gives no medical advice.
    </div>
  );
}
