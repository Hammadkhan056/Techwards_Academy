'use client';

// ============================================================================
// TECHWARDS ACADEMY - TESTS DASHBOARD
// Student test management and test-taking interface
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { testsApi } from '@/lib/api';
import type { TestAssignment } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BookOpen, Clock, CheckCircle, FileText, BarChart2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function TestsDashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [assignments, setAssignments] = useState<TestAssignment[]>([]);
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

        if (user) {
            loadAssignments();
        }
    }, [user, authLoading, router]);

    const loadAssignments = async () => {
        try {
            const data = await testsApi.getAssignedTests();
            setAssignments(data.assignments);
        } catch (error) {
            console.error('Failed to load test assignments:', error);
            setError('Failed to load your tests. Please try again.');
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tests</h1>
                    <p className="text-gray-600">View and manage your assigned tests and results</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                        <Button variant="ghost" size="sm" onClick={loadAssignments} className="ml-4">
                            Retry
                        </Button>
                    </div>
                )}

                {/* Tests Grid */}
                {assignments.length === 0 ? (
                    <Card className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No tests assigned</h3>
                        <p className="text-gray-600 mb-6">
                            You don't have any tests assigned yet. Check back later or contact your instructor.
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => router.push('/courses')}
                        >
                            Browse Courses
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignments.map((assignment) => (
                            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {assignment.test_title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="w-4 h-4" />
                                                Attempt {assignment.attempt_number}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <BarChart2 className="w-4 h-4" />
                                                {assignment.test_total_marks} marks
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(assignment.status).color}`}>
                                            {getStatusInfo(assignment.status).text}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-gray-700 mb-4">
                                    <p className="text-sm">
                                        {assignment.status === 'assigned' && (
                                            <>This test has been assigned to you. Click below to start.</>
                                        )}
                                        {assignment.status === 'started' && (
                                            <>You have started this test. Continue where you left off.</>
                                        )}
                                        {assignment.status === 'submitted' && (
                                            <>Your test has been submitted and is awaiting evaluation.</>
                                        )}
                                        {assignment.status === 'evaluated' && (
                                            <>Your test has been evaluated. View your results.</>
                                        )}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>Assigned {new Date(assignment.assigned_at).toLocaleDateString()}</span>
                                    {assignment.status === 'assigned' && (
                                        <Link
                                            href={`/tests/${assignment.test}/start`}
                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Start Test →
                                        </Link>
                                    )}
                                    {assignment.status === 'started' && (
                                        <Link
                                            href={`/tests/${assignment.test}/attempt/${assignment.attempt_number}`}
                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Continue →
                                        </Link>
                                    )}
                                    {['submitted', 'evaluated'].includes(assignment.status) && (
                                        <Link
                                            href={`/tests/${assignment.test}/results`}
                                            className="text-green-600 hover:text-green-700 font-medium"
                                        >
                                            View Results →
                                        </Link>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}