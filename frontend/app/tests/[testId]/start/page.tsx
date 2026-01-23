'use client';

// ============================================================================
// TECHWARDS ACADEMY - TEST START PAGE
// Student test-taking interface with MCQ questions
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { testsApi } from '@/lib/api';
import type { TestAttempt, TestSubmission } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AlertCircle, CheckCircle, Clock, XCircle, BookOpen } from 'lucide-react';

export default function TestStartPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const testId = parseInt(params.testId as string);

    const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

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
            loadTestAttempt();
        }
    }, [user, authLoading, router, testId]);

    const loadTestAttempt = async () => {
        try {
            const data = await testsApi.startTest(testId);
            setTestAttempt(data);

            // Initialize answers
            const initialAnswers: Record<number, number> = {};
            data.questions.forEach((question: { id: number }) => {
                initialAnswers[question.id] = 0; // 0 means no answer selected
            });
            setAnswers(initialAnswers);

            // Start timer if due date exists
            if (data.due_at) {
                startTimer(new Date(data.due_at));
            }

        } catch (error) {
            console.error('Failed to load test:', error);
            setError('Failed to load test. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const startTimer = (dueDate: Date) => {
        const updateTimer = () => {
            const now = new Date();
            const diff = dueDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Time expired!');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    };

    const handleAnswerSelect = (questionId: number, optionId: number) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmit = async () => {
        if (!testAttempt) return;

        // Check if all questions are answered
        const unanswered = testAttempt.questions.filter(q => answers[q.id] === 0);
        if (unanswered.length > 0) {
            if (!confirm(`You have ${unanswered.length} unanswered questions. Are you sure you want to submit?`)) {
                return;
            }
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Prepare submissions
            const submissions: TestSubmission[] = testAttempt.questions.map(question => ({
                question_id: question.id,
                selected_option_id: answers[question.id]
            }));

            const result = await testsApi.submitTest(testId, submissions);

            // Redirect to results page
            router.push(`/tests/${testId}/results`);

        } catch (error) {
            console.error('Failed to submit test:', error);
            setError('Failed to submit test. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getAnswerStatus = (questionId: number) => {
        const selectedOptionId = answers[questionId];
        if (selectedOptionId === 0) return null; // No answer
        return 'answered';
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!testAttempt) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Test Not Available</h3>
                        <p className="text-gray-600 mb-6">
                            {error || 'This test is not available or has not been assigned to you.'}
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Test Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {testAttempt.test.title}
                            </h1>
                            <p className="text-gray-600">
                                Attempt {testAttempt.attempt_number} • {testAttempt.test.total_marks} marks
                            </p>
                        </div>
                        <div className="text-right">
                            {timeLeft && (
                                <div className={`px-4 py-2 rounded-lg ${timeLeft.includes('expired') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                    <Clock className="w-5 h-5 inline-block mr-2" />
                                    {timeLeft}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
                        <p className="font-medium">
                            <AlertCircle className="w-5 h-5 inline-block mr-2" />
                            Please read all questions carefully. You can change your answers before submitting.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}
                </div>

                {/* Questions */}
                <div className="space-y-6">
                    {testAttempt.questions.map((question, index) => (
                        <Card key={question.id} className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Question {index + 1}: {question.text}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {question.marks} mark{question.marks !== 1 && 's'}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 ml-4">
                                    {getAnswerStatus(question.id) === 'answered' ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            Answered
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full flex items-center gap-1">
                                            <XCircle className="w-4 h-4" />
                                            Unanswered
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {question.options.map((option) => (
                                    <div
                                        key={option.id}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                            answers[question.id] === option.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                        onClick={() => handleAnswerSelect(question.id, option.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-blue-600 font-medium text-sm">
                                                    {String.fromCharCode(65 + question.options.indexOf(option))}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900">{option.text}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Submit Button */}
                <div className="mt-8 sticky bottom-6 bg-white py-4 border-t border-gray-200">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                    >
                        Submit Test
                    </Button>
                </div>
            </main>
        </div>
    );
}