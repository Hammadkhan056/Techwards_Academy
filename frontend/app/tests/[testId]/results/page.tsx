'use client';

// ============================================================================
// TECHWARDS ACADEMY - TEST RESULTS PAGE
// Student test results and answer review interface
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { testsApi } from '@/lib/api';
import type { TestResult } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BookOpen, CheckCircle, XCircle, Clock, BarChart2, AlertCircle } from 'lucide-react';

export default function TestResultsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const testId = parseInt(params.testId as string);

    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user?.role === 'ADMIN') {
            router.push('/admin');
            return;
        }

        if (user && testId) {
            loadTestResults();
        }
    }, [user, authLoading, router, testId]);

    const loadTestResults = async () => {
        try {
            const data = await testsApi.getTestResults(testId);
            setTestResult(data);
        } catch (error) {
            console.error('Failed to load test results:', error);
            setError('Failed to load test results. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-blue-600';
        if (percentage >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
            </div>
        );
    }

    if (!testResult) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Results Not Available</h3>
                        <p className="text-gray-600 mb-6">
                            {error || 'Your test results are not available yet or this test has not been completed.'}
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => router.push('/tests')}
                        >
                            Back to Tests
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    const activeQuestion = testResult.answers[activeQuestionIndex];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Test Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {testResult.test.title}
                            </h1>
                            <p className="text-gray-600">
                                Attempt {testResult.attempt_number} • {testResult.test.total_marks} marks
                            </p>
                        </div>
                        <div className="text-right">
                            <span className={`px-4 py-2 rounded-lg bg-green-50 text-green-700 font-medium`}>
                                {testResult.status}
                            </span>
                        </div>
                    </div>

                    {/* Score Summary */}
                    <Card className="mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full border-4 border-green-200 flex items-center justify-center">
                                    <span className={`text-2xl font-bold ${getScoreColor(testResult.results.percentage)}`}>
                                        {testResult.results.percentage}%
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Your Score</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {testResult.results.obtained_marks} / {testResult.results.total_marks}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Correct Answers</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {testResult.answers.filter(a => a.is_correct).length}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Total Questions</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {testResult.answers.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}
                </div>

                {/* Question Navigation and Review */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Question Navigation */}
                    <div className="lg:col-span-1">
                        <Card>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Questions</h3>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {testResult.answers.map((answer, index) => (
                                    <button
                                        key={answer.id}
                                        onClick={() => setActiveQuestionIndex(index)}
                                        className={`w-full p-3 rounded-lg text-left transition-colors ${activeQuestionIndex === index ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'} border`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${activeQuestionIndex === index ? 'bg-blue-600 text-white' : answer.is_correct ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                                {index + 1}
                                            </span>
                                            <span className={`text-sm font-medium ${answer.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                                                {answer.is_correct ? 'Correct' : 'Incorrect'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Question Review */}
                    <div className="lg:col-span-2">
                        <Card>
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    Question {activeQuestionIndex + 1}
                                </h3>
                                <p className="text-gray-700 mb-4">
                                    {activeQuestion.question.text}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <BarChart2 className="w-4 h-4" />
                                        <span>{activeQuestion.question_marks} mark{activeQuestion.question_marks !== 1 && 's'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {activeQuestion.is_correct ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                        )}
                                        <span className={activeQuestion.is_correct ? 'text-green-600' : 'text-red-600'}>
                                            {activeQuestion.is_correct ? 'Correct' : 'Incorrect'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Answer Options */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Your Answer:</h4>
                                    <div className={`p-4 rounded-lg border-2 ${activeQuestion.is_correct ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                                        <p className="text-gray-900">{activeQuestion.selected_option_text}</p>
                                    </div>
                                </div>

                                {!activeQuestion.is_correct && activeQuestion.correct_option_text && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Correct Answer:</h4>
                                        <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50">
                                            <p className="text-gray-900">{activeQuestion.correct_option_text}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                                <Button
                                    variant="ghost"
                                    onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                                    disabled={activeQuestionIndex === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setActiveQuestionIndex(prev => Math.min(testResult.answers.length - 1, prev + 1))}
                                    disabled={activeQuestionIndex === testResult.answers.length - 1}
                                >
                                    Next
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/tests')}
                    >
                        Back to Tests
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => router.push(`/tests/${testId}/history`)}
                    >
                        View All Attempts
                    </Button>
                </div>
            </main>
        </div>
    );
}