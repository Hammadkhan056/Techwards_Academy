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
import { AlertCircle, CheckCircle, Clock, XCircle, BookOpen, List, Timer, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TestStartPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const testId = parseInt(params.testId as string);

    const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
            console.log('Starting test load for testId:', testId);
            const data = await testsApi.startTest(testId);
            console.log('Test data received:', data);
            setTestAttempt(data);

            // Initialize answers
            const initialAnswers: Record<number, number> = {};
            if (data.questions && data.questions.length > 0) {
                data.questions.forEach((question: { id: number }) => {
                    initialAnswers[question.id] = 0; // 0 means no answer selected
                });
                console.log('Initialized answers for', data.questions.length, 'questions');
            } else {
                console.warn('No questions found in test data');
            }
            setAnswers(initialAnswers);

            // Start timer if due date exists
            if (data.due_at) {
                startTimer(new Date(data.due_at));
            }

        } catch (error: any) {
            console.error('Failed to load test:', error);
            
            // Provide specific error messages based on the error
            if (error.response?.status === 403) {
                const errorMessage = error.response.data?.error || 'Access denied';
                if (errorMessage.includes('Only Students allowed')) {
                    setError('Only students can access tests. Please log in as a student.');
                } else if (errorMessage.includes('Complete profile')) {
                    setError('Please complete your profile before starting a test.');
                } else if (errorMessage.includes('not enrolled')) {
                    setError('You are not enrolled in the course for this test.');
                } else if (errorMessage.includes('not assigned')) {
                    setError('This test has not been assigned to you or has already been completed.');
                    router.push('/tests');
                } else {
                    setError(`Access denied: ${errorMessage}`);
                }
            } else if (error.response?.status === 404) {
                setError('Test not found or inactive. Please contact your instructor.');
            } else {
                setError('Failed to load test. Please try again later.');
            }
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

    const handleNextQuestion = () => {
        if (currentQuestionIndex < testAttempt!.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
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

    const [showSubmitModal, setShowSubmitModal] = useState(false);

    const handleOpenSubmitModal = () => {
        setShowSubmitModal(true);
    };

    const handleCloseSubmitModal = () => {
        setShowSubmitModal(false);
    };

    const handleConfirmSubmit = async () => {
        setShowSubmitModal(false);
        await handleSubmit();
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

    const handleStartTest = () => {
        router.push(`/tests/${testId}/attempt/${testAttempt.attempt_number}`);
    };

    const currentQuestion = testAttempt.questions[currentQuestionIndex];

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

                {/* Question Navigation */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Questions</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                Question {currentQuestionIndex + 1} of {testAttempt.questions.length}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {testAttempt.questions.map((question, index) => (
                            <button
                                key={question.id}
                                onClick={() => setCurrentQuestionIndex(index)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${currentQuestionIndex === index ? 'bg-blue-600 text-white' : answers[question.id] !== 0 ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Current Question */}
                <Card className="mb-6">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Question {currentQuestionIndex + 1}: {currentQuestion.text}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {currentQuestion.marks} mark{currentQuestion.marks !== 1 && 's'}
                                </p>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                                {answers[currentQuestion.id] !== 0 ? (
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
                            {currentQuestion.options.map((option) => (
                                <div
                                    key={option.id}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                        answers[currentQuestion.id] === option.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                    onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-blue-600 font-medium text-sm">
                                                {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-900">{option.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={handlePreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleNextQuestion}
                                disabled={currentQuestionIndex === testAttempt.questions.length - 1}
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Submit Button */}
                <div className="mt-8 sticky bottom-6 bg-white py-4 border-t border-gray-200">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={handleOpenSubmitModal}
                        isLoading={isSubmitting}
                    >
                        Submit Test
                    </Button>
                </div>

                {/* Submission Confirmation Modal */}
                {showSubmitModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <Card className="max-w-md w-full mx-4">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">Submit Test</h3>
                                    <button
                                        onClick={handleCloseSubmitModal}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="mb-6">
                                    <p className="text-gray-600 mb-4">
                                        Are you sure you want to submit your test? Once submitted, you cannot change your answers.
                                    </p>
                                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                                        <p className="font-medium">
                                            <AlertCircle className="w-5 h-5 inline-block mr-2" />
                                            Please review your answers before submitting.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleCloseSubmitModal}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleConfirmSubmit}
                                        isLoading={isSubmitting}
                                    >
                                        Confirm Submit
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}