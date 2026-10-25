/** Responsible-use reminder, kept quiet in the page footer. */
export function SafetyNote() {
  return (
    <footer className="border-t border-line">
      <p className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted">
        Synthetic data only. Trial Mirror ranks who needs the most support to stay in a trial. It never decides who qualifies or who is
        excluded, and gives no medical advice.
      </p>
    </footer>
  );
}
