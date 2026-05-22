'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ASSESSMENT_TRACKS } from '@/lib/assessment-tracks';
import { Suspense } from 'react';
import type { AssessmentTrack } from '@/lib/assessment-tracks';

function AssessmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [autoRedirect, setAutoRedirect] = useState(false);
  
  const sectorParam = searchParams?.get('sector');
  
  useEffect(() => {
    // Auto-redirect to specific assessment if sector parameter is provided
    if (sectorParam) {
      const sectorToRoute: Record<string, string> = {
        'for-hire': '/assessment/for-hire-carriers',
        'for_hire': '/assessment/for-hire-carriers',
        'private-fleet': '/assessment/private-fleets',
        'private_fleet': '/assessment/private-fleets',
        'government': '/assessment/government-fleets',
        'bof-vault': '/assessment/bof-vault',
        'vault': '/assessment/bof-vault'
      };
      
      const targetRoute = sectorToRoute[sectorParam.toLowerCase()];
      if (targetRoute) {
        setAutoRedirect(true);
        router.push(targetRoute);
      }
    }
  }, [sectorParam, router]);
  
  if (autoRedirect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Assessment</h1>
          <p className="text-gray-600 mb-6">Taking you to your specific assessment...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Take the Fleet Back Office Assessment
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the assessment that matches your fleet. BOF will identify where operations, documents, compliance, cash flow, customer proof, records, and back-office controls are creating risk or lost margin.
            </p>
          </div>
        </div>
      </div>

      {/* BOF Vault - Separate Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">For Individual Drivers</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              BOF Vault is your personal document management system. Create a secure vault for your CDL, medical card, MVR, and other driving credentials.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg shadow-lg border border-teal-200 hover:shadow-xl transition-shadow duration-200">
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">BOF Vault</h3>
                  <span className="bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full">Individual Driver</span>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  For individual drivers to organize and maintain their driving credentials. Upload once, access anywhere, and stay ready for your next opportunity.
                </p>
                <Link href="/assessment/bof-vault">
                  <button
                    className="w-full bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors duration-200"
                  >
                    Create My Driver Vault
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Assessments */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">For Fleet Operations</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the assessment that matches your fleet type. BOF will identify where operations, documents, compliance, cash flow, and back-office controls are creating risk or lost margin.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ASSESSMENT_TRACKS.filter(track => track.id !== 'bof-vault').map((track: AssessmentTrack) => (
              <div
                key={track.id}
                className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200"
              >
                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {track.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                    {track.description}
                  </p>
                  <Link href={track.route}>
                    <button
                      className="w-full bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors duration-200"
                    >
                      {track.ctaLabel}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Assessment results are for demo and operational planning purposes only. 
              They are not legal, tax, accounting, insurance, employment, or compliance advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Assessment</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        </div>
      </div>
    }>
      <AssessmentPageContent />
    </Suspense>
  );
}
