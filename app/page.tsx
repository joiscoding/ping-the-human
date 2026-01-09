import { LeadsTable } from "@/components/leads-table";
import { StateHeatMap } from "@/components/state-heat-map";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Ping the Human
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            View and manage incoming leads from Angi
          </p>
        </div>

        {/* State Heat Map */}
        <div className="mb-8">
          <StateHeatMap />
        </div>

        {/* Leads Table */}
        <LeadsTable />
      </div>
    </div>
  );
}
