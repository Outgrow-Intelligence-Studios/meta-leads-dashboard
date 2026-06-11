import { Lock01 } from "@untitledui/icons";
import type { Lead } from "../lib/api";

export default function AnalyticsPage({ leads }: { leads: Lead[] }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="rounded-full bg-secondary p-4 mb-4">
        <Lock01 className="w-8 h-8 text-brand" />
      </div>
      <h2 className="flex items-center gap-2 text-2xl font-bold text-primary">
        Coming Soon <Lock01 className="size-5 text-brand" />
      </h2>
      <p className="text-tertiary mt-2">We're working hard to bring you the Analytics feature.</p>
    </div>
  );
}
