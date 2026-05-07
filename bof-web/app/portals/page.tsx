import { Metadata } from 'next';
import { getPortalCards } from '@/lib/demo-portals';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Three Portals. One Operating System',
  description: 'BOF gives every stakeholder the view they need — managers control operation, drivers execute work, and customers see status, proof, and documents.',
};

export default function PortalsPage() {
  const portalCards = getPortalCards();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Three portals. One operating system.
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            BOF gives every stakeholder the view they need — managers control operation, drivers execute work, and customers see status, proof, and documents.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {portalCards.map((portal) => (
            <div
              key={portal.id}
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow duration-300"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {portal.id === 'manager' && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0M12 15V7m0 0a3 3 0 00-6h3a3 3 0 006 0v8a3 3 0 00-6zm0 0a9 9 0 11-18 0 9 9 0 0118 0"
                    />
                  )}
                  {portal.id === 'driver' && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0M12 14a7 7 0 00-7 7h4a7 7 0 007-7h-4z"
                    />
                  )}
                  {portal.id === 'customer' && (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0M4 15H3m0 0h6m0 0v6m0 0v6a2 2 0 002 2h8a2 2 0 002-2v-6a2 2 0 00-2-2z"
                    />
                  )}
                </svg>
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {portal.title}
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {portal.description}
              </p>

              {/* CTA */}
              <Link
                href={portal.href}
                className="inline-flex items-center justify-center w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                {portal.cta}
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5-5m5 5V7m0 0a3 3 0 00-6h3a3 3 0 006 0v8a3 3 0 00-6zm0 0a9 9 0 11-18 0 9 9 0 0118 0"
                  />
                </svg>
              </Link>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            BOF Demo — Enterprise fleet management system with role-based access
          </p>
        </div>
      </div>
    </div>
  );
}
