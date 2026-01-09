import { LeadDetail } from "@/components/lead-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LeadDetail leadId={id} />
      </div>
    </div>
  );
}
