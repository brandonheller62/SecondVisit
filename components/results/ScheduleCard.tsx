import { fmtMaybe } from "@/lib/format";
import type { VisitSchedule } from "@/lib/types";
import { Badge, Card } from "@/components/shell/ui";

/** The visit schedule the agent extracted, with every unstated field shown as "unknown". */
export function ScheduleCard({ schedule, unknownNotes }: { schedule: VisitSchedule; unknownNotes: string[] }) {
  const cell = (v: string) => (v === "unknown" ? <span className="italic text-warn">unknown</span> : v);
  return (
    <Card
      title="Visit schedule the agent extracted"
      subtitle={schedule.notes}
      actions={<Badge tone="neutral">{schedule.source === "pasted" ? "From pasted protocol text" : "From registry text"}</Badge>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <caption className="sr-only">Extracted visits</caption>
          <thead className="text-sm text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3 font-medium">Visit</th>
              <th scope="col" className="py-2 pr-3 font-medium">Week</th>
              <th scope="col" className="py-2 pr-3 font-medium">Length</th>
              <th scope="col" className="py-2 pr-3 font-medium">Fasting</th>
              <th scope="col" className="py-2 pr-3 font-medium">Time of day</th>
              <th scope="col" className="py-2 pr-3 font-medium">In person</th>
              <th scope="col" className="py-2 font-medium">Procedures</th>
            </tr>
          </thead>
          <tbody>
            {schedule.visits.map((v) => (
              <tr key={v.id} className="border-b border-line/60 align-top">
                <th scope="row" className="py-2 pr-3 font-medium">{v.label}</th>
                <td className="py-2 pr-3 tabular-nums">{cell(fmtMaybe(v.week))}</td>
                <td className="py-2 pr-3">{cell(fmtMaybe(v.durationMinutes, (m) => `${m} min`))}</td>
                <td className="py-2 pr-3">{cell(fmtMaybe(v.fasting, (f) => (f ? "Yes" : "No")))}</td>
                <td className="py-2 pr-3">{cell(fmtMaybe(v.timeOfDay))}</td>
                <td className="py-2 pr-3">{cell(fmtMaybe(v.inPerson, (f) => (f ? "Yes" : "No")))}</td>
                <td className="py-2 text-sm text-muted">{v.procedures.join(", ") || "not stated"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {unknownNotes.length > 0 && (
        <ul className="mt-4 space-y-1 rounded-lg bg-bg p-3 text-sm">
          {unknownNotes.map((n) => (
            <li key={n}><span aria-hidden className="text-warn">? </span>{n}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
