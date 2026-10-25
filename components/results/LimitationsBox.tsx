import { Card } from "@/components/shell/ui";

export function LimitationsBox() {
  return (
    <Card title="Limits">
      <ul className="max-w-[75ch] list-disc space-y-1.5 pl-5">
        <li>The point values are judgment calls. Check them against a past trial&apos;s real dropout before real use. The score is not a predicted chance of dropping out.</li>
        <li>The ranking decides who to offer help first. Never use it to exclude anyone.</li>
        <li>The AI only sees totals and patient IDs; scoring is plain code. Groups under 10 people are hidden.</li>
        <li>Race, ethnicity and immigration status are not inputs. Neighborhood is only used for group totals.</li>
        <li>Trial payments are set by the trial team and its ethics board. This tool never suggests amounts.</li>
        <li>No medical advice. For medical questions talk to a clinician; in an emergency call 911.</li>
      </ul>
    </Card>
  );
}
