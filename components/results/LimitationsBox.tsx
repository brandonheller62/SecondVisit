import { Card } from "@/components/shell/ui";

export function LimitationsBox() {
  return (
    <Card title="Limitations and responsible use" className="border-warn/50">
      <ul className="list-disc space-y-2 pl-5">
        <li><b>The weights are unvalidated assumptions.</b> Check them against a past trial&apos;s real dropout before any real use.</li>
        <li>Risk compounds over visits, so trials with many visits push more people into High. Compare patients within one trial, not across trials.</li>
        <li>The score ranks who to offer support first. It never decides eligibility and must never be used to exclude, deprioritize or reject anyone.</li>
        <li>Demo data is synthetic. Uploads must be de-identified; files with identifying columns are rejected. Rows are processed in memory and never stored or logged.</li>
        <li>The AI model sees only aggregates and patient IDs, never patient rows. Scoring, simulation and group summaries are plain code.</li>
        <li>Groups under 10 people are not reported.</li>
        <li>Neighborhood is used only for group reporting. Language matters only when the trial&apos;s materials are not offered in it. Race, ethnicity and immigration status are not inputs.</li>
        <li>Registry records often lack visit details; anything not stated is treated as &quot;unknown&quot; and filled with the defaults in Assumptions.</li>
        <li>Spanish and Haitian Creole drafts are machine-drafted and need native-speaker/CHW review.</li>
        <li>This tool does not answer medical questions. For medical questions talk to a clinician; in an emergency call 911.</li>
      </ul>
    </Card>
  );
}
