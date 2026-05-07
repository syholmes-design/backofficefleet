import { Metadata } from 'next';
import { getBofData } from '@/lib/load-bof-data';
import FleetFinancialsPageClient from '@/components/financials/FleetFinancialsPageClient';

export const metadata: Metadata = {
  title: 'Fleet Financials | BOF',
  description: 'BOF Fleet Financials - Convert loads into financial events with load-level profitability, assumption modeling, and management P&L previews.',
};

export default function FleetFinancialsPage() {
  // Get the BOF data on the server side
  const data = getBofData();

  return (
    <div className="min-h-screen bg-gray-50">
      <FleetFinancialsPageClient initialData={data} />
    </div>
  );
}
