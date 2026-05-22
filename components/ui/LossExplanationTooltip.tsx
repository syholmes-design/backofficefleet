'use client';

import { useState } from 'react';
import type { LossExplanation } from '@/lib/load-profitability';

interface LossExplanationTooltipProps {
  explanation: LossExplanation;
  children: React.ReactNode;
}

export default function LossExplanationTooltip({ explanation, children }: LossExplanationTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center cursor-help text-teal-600 hover:text-teal-700 ml-1"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {children}
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-80 p-3 bg-white border border-gray-200 rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              {explanation.shortTooltip}
            </div>
            
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Primary Loss Drivers:</div>
              <ul className="text-xs text-gray-600 space-y-1">
                {explanation.primaryLossDrivers.map((driver, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-teal-600 mr-1">•</span>
                    {driver}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Recommended Review Actions:</div>
              <ul className="text-xs text-gray-600 space-y-1">
                {explanation.recommendedReviewActions.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-teal-600 mr-1">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
