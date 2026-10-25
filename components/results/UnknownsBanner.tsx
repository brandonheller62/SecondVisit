import { ArrowRight, Warning } from "@phosphor-icons/react/dist/ssr";
import { ico } from "@/components/shell/icons";
import { Button } from "@/components/shell/ui";

function listPhrase(items: string[]) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`;
}

/** Shown above everything in Results when the schedule has unknown visit fields. */
export function UnknownsBanner({ fields, distinguishable, source, onPasteSchedule }: {
  fields: string[];
  distinguishable: boolean;
  source: "registry" | "pasted";
  onPasteSchedule: () => void;
}) {
  return (
    <section role="status" className="flex flex-wrap items-start justify-between gap-4 rounded-xl border-2 border-warn/70 bg-warn/10 p-5">
      <div className="flex min-w-0 max-w-[75ch] gap-3">
        <Warning {...ico} className={`${ico.className} mt-1 text-warn`} />
        <div>
          <h2 className="text-xl font-semibold">The {source === "registry" ? "registry" : "pasted schedule"} does not state {listPhrase(fields)}.</h2>
          <p className="mt-1">
            {distinguishable
              ? "Those fields are scored with the defaults described under Advanced, so the differences between visits may be understated."
              : "All visits are scored the same, so we cannot say which visit is hardest."}
          </p>
        </div>
      </div>
      <Button variant="primary" onClick={onPasteSchedule}>
        Paste the visit schedule <ArrowRight {...ico} />
      </Button>
    </section>
  );
}
