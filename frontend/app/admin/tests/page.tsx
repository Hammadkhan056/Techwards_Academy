'use client';

// ============================================================================
// TECHWARDS ACADEMY - ADMIN TEST MANAGEMENT
// Admin interface for managing tests
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { testsApi, coursesApi } from '@/lib/api';
import type { Test, Course } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Play,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

export default function AdminTestsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    
    const [tests, setTests] = useState<Test[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredTests, setFilteredTests] = useState<Test[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'ADMIN')) {
            router.push('/dashboard');
            return;
        }

        if (user?.role === 'ADMIN') {
            loadData();
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        filterTests();
    }, [tests, searchTerm, filterStatus, selectedCourse]);

    const loadData = async () => {
        try {
            // Load tests (using admin endpoint)
            const testsData = await fetch('http://127.0.0.1:8000/api/tests/admin/tests/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (testsData.ok) {
                const testsResult = await testsData.json();
                setTests(testsResult.results || []);
            }

            // Load courses for filter
            const coursesData = await coursesApi.getAll();
            setCourses(coursesData.results || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterTests = () => {
        let filtered = tests;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(test =>
                test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                test.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (filterStatus === 'published') {
            filtered = filtered.filter(test => test.is_published);
        } else if (filterStatus === 'draft') {
            filtered = filtered.filter(test => !test.is_published);
        }

        // Filter by course
        if (selectedCourse) {
            filtered = filtered.filter(test => test.course === selectedCourse);
        }

        setFilteredTests(filtered);
    };

    const handlePublishTest = async (testId: number) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/tests/admin/tests/${testId}/publish/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                await loadData();
            }
        } catch (error) {
            console.error('Failed to publish test:', error);
            alert('Failed to publish test. Please try again.');
        }
    };

    const handleUnpublishTest = async (testId: number) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/tests/admin/tests/${testId}/unpublish/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                await loadData();
            }
        } catch (error) {
            console.error('Failed to unpublish test:', error);
            alert('Failed to unpublish test. Please try again.');
        }
    };

    const handleDeleteTest = async (testId: number) => {
        if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/tests/admin/tests/${testId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                await loadData();
            }
        } catch (error) {
            console.error('Failed to delete test:', error);
            alert('Failed to delete test. Please try again.');
        }
    };

    const handleAssignToCourse = async (testId: number, courseId: number) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/tests/admin/tests/${testId}/assign_to_course/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    course_id: courseId,
                    due_hours: 72 // 3 days
                })
            });

            if (response.ok) {
                alert('Test assigned successfully!');
            }
        } catch (error) {
            console.error('Failed to assign test:', error);
            alert('Failed to assign test. Please try again.');
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading tests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Management</h1>
                        <p className="text-gray-600">Create and manage tests for students</p>
                    </div>
                    <Link href="/admin/tests/new">
                        <Button variant="primary">
                            <Plus className="w-4 h-4 mr-2" />
                            New Test
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <div className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        placeholder="Search tests..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={filterStatus === 'all' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('all')}
                                >
                                    All ({tests.length})
                                </Button>
                                <Button
                                    variant={filterStatus === 'published' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('published')}
                                >
                                    Published ({tests.filter(t => t.is_published).length})
                                </Button>
                                <Button
                                    variant={filterStatus === 'draft' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('draft')}
                                >
                                    Draft ({tests.filter(t => !t.is_published).length})
                                </Button>
                            </div>
                            <select
                                value={selectedCourse || ''}
                                onChange={(e) => setSelectedCourse(e.target.value ? parseInt(e.target.value) : null)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Courses</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Tests List */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-gray-600">Test</th>
                                    <th className="text-left py-3 px-4 text-gray-600">Course</th>
                                    <th className="text-left py-3 px-4 text-gray-600">Duration</th>
                                    <th className="text-left py-3 px-4 text-gray-600">Status</th>
                                    <th className="text-left py-3 px-4 text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTests.length > 0 ? (
                                    filteredTests.map((test) => (
                                        <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{test.title}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {test.total_marks} marks • {test.questions?.length || 0} questions
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-600">{test.course_title || `Course ${test.course}`}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-600">
                                                        {test.duration_minutes ? `${test.duration_minutes} min` : 'No limit'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    test.is_published 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {test.is_published ? (
                                                        <>
                                                            <CheckCircle className="w-3 h-3" />
                                                            Published
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-3 h-3" />
                                                            Draft
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/admin/tests/${test.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    {test.is_published ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleUnpublishTest(test.id)}
                                                            className="text-orange-600"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handlePublishTest(test.id)}
                                                            className="text-green-600"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <select
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                handleAssignToCourse(test.id, parseInt(e.target.value));
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                        className="text-sm border border-gray-300 rounded px-2 py-1"
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Assign</option>
                                                        {courses.map(course => (
                                                            <option key={course.id} value={course.id}>
                                                                {course.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteTest(test.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <div className="space-y-4">
                                                <FileText className="w-16 h-16 text-gray-400 mx-auto" />
                                                <div>
                                                    <p className="text-gray-600 mb-4">
                                                        {searchTerm || filterStatus !== 'all' || selectedCourse
                                                            ? 'No tests found matching your criteria' 
                                                            : 'No tests yet'
                                                        }
                                                    </p>
                                                    {!searchTerm && filterStatus === 'all' && !selectedCourse && (
                                                        <Link href="/admin/tests/new">
                                                            <Button variant="primary">
                                                                Create First Test
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Tests</p>
                                <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Published</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {tests.filter(t => t.is_published).length}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Drafts</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {tests.filter(t => !t.is_published).length}
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-orange-600" />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Questions</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {tests.reduce((sum, test) => sum + (test.questions?.length || 0), 0)}
                                </p>
                            </div>
                            <Users className="w-8 h-8 text-purple-600" />
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
