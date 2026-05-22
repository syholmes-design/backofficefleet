'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getAssessmentTrack, 
  getDefaultSectionsForTrack, 
  calculateAssessmentScore,
  getRecommendedModules,
  getRiskAreas,
  type AssessmentAnswer,
  type AssessmentResult,
  type Question
} from '@/lib/assessment-tracks';

export type AssessmentAnswerValue = string | string[] | number | boolean | null;

type AssessmentTrackPageClientProps = {
  trackId: string;
};

export default function AssessmentTrackPageClient({ trackId }: AssessmentTrackPageClientProps) {
  const track = getAssessmentTrack(trackId);
  
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [showSectionSelector, setShowSectionSelector] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (track) {
      const defaultSections = getDefaultSectionsForTrack(trackId);
      setSelectedSectionIds(defaultSections.map(s => s.id));
    }
  }, [trackId, track]);

  if (!track) {
    return <div>Assessment track not found</div>;
  }

  const selectedSections = track.sections.filter(section => 
    selectedSectionIds.includes(section.id)
  );

  const toggleSection = (sectionId: string) => {
    const section = track.sections.find(s => s.id === sectionId);
    if (!section?.required) {
      setSelectedSectionIds(prev => 
        prev.includes(sectionId) 
          ? prev.filter(id => id !== sectionId)
          : [...prev, sectionId]
      );
    }
  };

  const startAssessment = () => {
    setShowSectionSelector(false);
    setCurrentSection(0);
  };

  const updateAnswer = (questionId: string, value: AssessmentAnswerValue) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => a.questionId === questionId ? { ...a, value } : a);
      }
      return [...prev, { questionId, value }];
    });
  };

  const nextSection = () => {
    if (currentSection < selectedSections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      completeAssessment();
    }
  };

  const previousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const completeAssessment = () => {
    const scoreResult = calculateAssessmentScore(trackId, answers, selectedSectionIds);
    const recommendedModules = getRecommendedModules(trackId);
    const riskAreas = getRiskAreas(trackId);
    const skippedSections = track.sections.filter(s => !s.required && !selectedSectionIds.includes(s.id));

    setAssessmentResult({
      trackId,
      score: scoreResult.score,
      scoreCategory: scoreResult.scoreCategory,
      completedSections: selectedSectionIds,
      skippedSections: skippedSections.map(s => s.id),
      riskAreas,
      recommendedModules,
      answers
    });
    setShowResults(true);
  };

  const skipSection = () => {
    nextSection();
  };

  const getSkipButtonText = (sectionId: string) => {
    const skipTexts: Record<string, string> = {
      'hr-workforce': 'Skip HR',
      'settlements-pay-visibility': 'Skip Settlements',
      'fleet-financials': 'Skip Finance',
      'workforce-records': 'Skip Workforce',
      'cost-visibility': 'Skip Finance',
      'budget-visibility': 'Skip Budget',
      'procurement-vendor': 'Skip Budget'
    };
    return skipTexts[sectionId] || 'Skip Section';
  };

  const getContinueButtonText = (sectionId: string) => {
    const continueTexts: Record<string, string> = {
      'hr-workforce': 'Continue HR Questions',
      'settlements-pay-visibility': 'Continue Settlements Questions',
      'fleet-financials': 'Continue Finance Questions',
      'workforce-records': 'Continue Workforce Questions',
      'cost-visibility': 'Continue Finance Questions',
      'budget-visibility': 'Continue Budget Questions',
      'procurement-vendor': 'Continue Budget Questions'
    };
    return continueTexts[sectionId] || 'Next Section';
  };

  const renderQuestion = (question: Question) => {
    const answer = answers.find(a => a.questionId === question.id)?.value;

    switch (question.type) {
      case 'single_choice':
        return (
          <div className="space-y-3">
            {question.options?.map(option => (
              <label key={option.value} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={answer === option.value}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map(option => (
              <label key={option.value} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={Array.isArray(answer) && answer.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(answer) ? answer : [];
                    if (e.target.checked) {
                      updateAnswer(question.id, [...currentValues, option.value]);
                    } else {
                      updateAnswer(question.id, currentValues.filter(v => v !== option.value));
                    }
                  }}
                  className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={answer === true}
                onChange={() => updateAnswer(question.id, true)}
                className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
              />
              <span className="text-gray-700">Yes</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={answer === false}
                onChange={() => updateAnswer(question.id, false)}
                className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
              />
              <span className="text-gray-700">No</span>
            </label>
          </div>
        );

      case 'scale_1_5':
        return (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(scale => (
              <label key={scale} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name={question.id}
                  value={scale}
                  checked={answer === scale}
                  onChange={(e) => updateAnswer(question.id, Number(e.target.value))}
                  className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="text-gray-700">{scale}</span>
              </label>
            ))}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            min={question.min}
            max={question.max}
            value={typeof answer === 'number' ? answer : ''}
            onChange={(e) => {
              const nextValue = e.target.value === "" ? null : Number(e.target.value);
              updateAnswer(question.id, nextValue);
            }}
            placeholder={question.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        );

      case 'short_text':
        return (
          <input
            type="text"
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        );

      default:
        return <div>Question type not supported</div>;
    }
  };

  // Section Selector View
  if (showSectionSelector) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-8">
              <div className="mb-8">
                <Link href="/assessment" className="text-teal-600 hover:text-teal-700 mb-4 inline-block">
                  ← Back to Assessment Selection
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {track.title} Assessment
                </h1>
                <p className="text-gray-600 mb-6">
                  Select the sections you want to include in your assessment. Required sections cannot be deselected.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {track.sections.map(section => (
                  <div
                    key={section.id}
                    className={`border rounded-lg p-4 ${
                      section.required 
                        ? 'border-gray-200 bg-gray-50' 
                        : 'border-gray-200 hover:border-teal-300 cursor-pointer'
                    }`}
                    onClick={() => !section.required && toggleSection(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {section.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            section.required 
                              ? 'bg-blue-100 text-blue-800' 
                              : selectedSectionIds.includes(section.id)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {section.required ? 'Required' : selectedSectionIds.includes(section.id) ? 'Selected' : 'Optional'}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{section.description}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {section.estimatedQuestions} questions
                        </p>
                      </div>
                      {!section.required && (
                        <div className="ml-4">
                          <input
                            type="checkbox"
                            checked={selectedSectionIds.includes(section.id)}
                            onChange={() => toggleSection(section.id)}
                            className="w-5 h-5 text-teal-600 border-gray-300 focus:ring-teal-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <div className="text-sm text-gray-500">
                  {selectedSections.length} sections selected • {selectedSections.reduce((sum, s) => sum + s.estimatedQuestions, 0)} total questions
                </div>
                <button
                  onClick={startAssessment}
                  disabled={selectedSections.length === 0}
                  className="bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Start Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results View
  if (showResults && assessmentResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">
                Assessment Results
              </h1>

              {/* Score */}
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {track.scoreType}
                </h2>
                <div className="flex items-center space-x-4">
                  <div className={`text-4xl font-bold ${
                    assessmentResult.scoreCategory === 'Strong' ? 'text-green-600' :
                    assessmentResult.scoreCategory === 'Needs Attention' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {assessmentResult.score}%
                  </div>
                  <div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      assessmentResult.scoreCategory === 'Strong' ? 'bg-green-100 text-green-800' :
                      assessmentResult.scoreCategory === 'Needs Attention' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {assessmentResult.scoreCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Areas */}
              {assessmentResult.riskAreas.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Risk Areas</h2>
                  <div className="space-y-2">
                    {assessmentResult.riskAreas.map((area: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-red-500">•</span>
                        <span className="text-gray-700">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Modules */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommended BOF Modules</h2>
                <div className="grid grid-cols-2 gap-3">
                  {assessmentResult.recommendedModules.map((module: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded">
                      <span className="text-teal-600">✓</span>
                      <span className="text-gray-700">{module}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Summary */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Section Summary</h2>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">
                      {assessmentResult.completedSections.length} sections completed
                    </span>
                  </div>
                  {assessmentResult.skippedSections.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">○</span>
                      <span className="text-gray-500">
                        {assessmentResult.skippedSections.length} sections skipped
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowResults(false);
                    setShowSectionSelector(true);
                    setCurrentSection(0);
                    setAnswers([]);
                  }}
                  className="bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Retake Assessment
                </button>
                <Link
                  href="/assessment"
                  className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
                >
                  Back to Assessment Selection
                </Link>
              </div>

              {/* Disclaimer */}
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-500">
                  Assessment results are for demo and operational planning purposes only. 
                  They are not legal, tax, accounting, insurance, employment, or compliance advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assessment Questions View
  const currentSectionData = selectedSections[currentSection];
  const progress = ((currentSection + 1) / selectedSections.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          {/* Progress Bar */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {track.title} Assessment
              </h1>
              <span className="text-sm text-gray-500">
                Section {currentSection + 1} of {selectedSections.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Section */}
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {currentSectionData.title}
              </h2>
              <p className="text-gray-600 mb-4">{currentSectionData.description}</p>
            </div>

            {/* Questions */}
            <div className="space-y-8">
              {currentSectionData.questions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <div className="mb-4">
                    <span className="text-sm text-gray-500 font-medium">
                      Question {index + 1} of {currentSectionData.questions.length}
                    </span>
                    {question.required && (
                      <span className="ml-2 text-red-500 text-sm">*</span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {question.question}
                  </h3>
                  {renderQuestion(question)}
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={previousSection}
                disabled={currentSection === 0}
                className="bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Previous Section
              </button>
              <div className="flex space-x-3">
                {!currentSectionData.required && (
                  <button
                    onClick={skipSection}
                    className="bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                  >
                    {getSkipButtonText(currentSectionData.id)}
                  </button>
                )}
                <button
                  onClick={nextSection}
                  className="bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors duration-200"
                >
                  {currentSection === selectedSections.length - 1 ? 'Complete Assessment' : getContinueButtonText(currentSectionData.id)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
