'use client';

// ============================================================================
// TECHWARDS ACADEMY - TEST HISTORY PAGE
// Student test attempt history and performance tracking
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { testsApi } from '@/lib/api';
import type { TestAssignment } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BookOpen, Clock, CheckCircle, BarChart2, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function TestHistoryPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const testId = parseInt(params.testId as string);

    const [testHistory, setTestHistory] = useState<{
        test: { id: number; title: string; total_marks: number };
        total_attempts: number;
        attempts: TestAssignment[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

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
            loadTestHistory();
        }
    }, [user, authLoading, router, testId]);

    const loadTestHistory = async () => {
        try {
            const data = await testsApi.getTestHistory(testId);
            setTestHistory(data);
        } catch (error) {
            console.error('Failed to load test history:', error);
            setError('Failed to load test history. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'assigned':
                return { text: 'Not Started', icon: <Clock className="w-4 h-4" />, color: 'text-gray-600' };
            case 'started':
                return { text: 'In Progress', icon: <RefreshCw className="w-4 h-4" />, color: 'text-blue-600' };
            case 'submitted':
                return { text: 'Submitted', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600' };
            case 'evaluated':
                return { text: 'Evaluated', icon: <BarChart2 className="w-4 h-4" />, color: 'text-purple-600' };
            default:
                return { text: status, icon: null, color: 'text-gray-600' };
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </div>
        );
    }

    if (!testHistory) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">History Not Available</h3>
                        <p className="text-gray-600 mb-6">
                            {error || 'Test history is not available or you have not attempted this test yet.'}
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
                                {testHistory.test.title}
                            </h1>
                            <p className="text-gray-600">
                                {testHistory.total_attempts} attempt{testHistory.total_attempts !== 1 && 's'}
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => router.push(`/tests/${testId}/start`)}
                            disabled={testHistory.attempts.some(a => a.status === 'started')}
                        >
                            New Attempt
                        </Button>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Review your previous attempts and track your progress over time.
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}
                </div>

                {/* Attempts List */}
                <div className="space-y-4">
                    {testHistory.attempts.map((attempt, index) => (
                        <Card key={attempt.id} className="hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Attempt {attempt.attempt_number}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{new Date(attempt.assigned_at).toLocaleDateString()}</span>
                                        </div>
                                        {attempt.submitted_at && (
                                            <div className="flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Submitted {new Date(attempt.submitted_at).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(attempt.status).color}`}>
                                        {getStatusInfo(attempt.status).text}
                                    </span>
                                </div>
                            </div>

                            <div className="text-gray-700 mb-4">
                                {attempt.status === 'evaluated' && (
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full border-4 border-green-200 flex items-center justify-center">
                                            <span className={`text-xl font-bold ${getScoreColor(attempt.obtained_marks! / attempt.total_marks! * 100)}`}>
                                                {Math.round(attempt.obtained_marks! / attempt.total_marks! * 100)}%
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Your Score</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {attempt.obtained_marks} / {attempt.total_marks}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {attempt.status === 'submitted' && (
                                    <p className="text-gray-600">Your test has been submitted and is awaiting evaluation.</p>
                                )}
                                {attempt.status === 'started' && (
                                    <p className="text-gray-600">You have started this attempt but not yet submitted it.</p>
                                )}
                                {attempt.status === 'assigned' && (
                                    <p className="text-gray-600">This attempt has been assigned to you.</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>Attempt {attempt.attempt_number} of {testHistory.total_attempts}</span>
                                <div className="flex gap-2">
                                    {attempt.status === 'evaluated' && (
                                        <Link
                                            href={`/tests/${testId}/results`}
                                            className="text-green-600 hover:text-green-700 font-medium"
                                        >
                                            View Results
                                        </Link>
                                    )}
                                    {attempt.status === 'started' && (
                                        <Link
                                            href={`/tests/${testId}/attempt/${attempt.attempt_number}`}
                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Continue
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Back Button */}
                <div className="mt-8">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/tests')}
                    >
                        Back to Tests
                    </Button>
                </div>
            </main>
        </div>
    );
}