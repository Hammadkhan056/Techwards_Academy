'use client';

// ============================================================================
// TECHWARDS ACADEMY - ADMIN COURSE MANAGEMENT
// Admin interface for managing courses
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { coursesApi } from '@/lib/api';
import type { Course } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  BookOpen, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  Search,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminCoursesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'ADMIN')) {
            router.push('/dashboard');
            return;
        }

        if (user?.role === 'ADMIN') {
            loadCourses();
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        filterCourses();
    }, [courses, searchTerm, filterStatus]);

    const loadCourses = async () => {
        try {
            const data = await coursesApi.getAll();
            setCourses(data.results || []);
        } catch (error) {
            console.error('Failed to load courses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterCourses = () => {
        let filtered = courses;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(course =>
                course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (filterStatus === 'active') {
            filtered = filtered.filter(course => course.is_active);
        } else if (filterStatus === 'inactive') {
            filtered = filtered.filter(course => !course.is_active);
        }

        setFilteredCourses(filtered);
    };

    const handleDeleteCourse = async (courseId: number) => {
        if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }

        try {
            await coursesApi.delete(courseId);
            await loadCourses();
        } catch (error) {
            console.error('Failed to delete course:', error);
            alert('Failed to delete course. Please try again.');
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading courses...</p>
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
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Management</h1>
                        <p className="text-gray-600">Manage all courses in the system</p>
                    </div>
                    <Link href="/admin/courses/new">
                        <Button variant="primary">
                            <Plus className="w-4 h-4 mr-2" />
                            New Course
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
                                        placeholder="Search courses..."
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
                                    All ({courses.length})
                                </Button>
                                <Button
                                    variant={filterStatus === 'active' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('active')}
                                >
                                    Active ({courses.filter(c => c.is_active).length})
                                </Button>
                                <Button
                                    variant={filterStatus === 'inactive' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('inactive')}
                                >
                                    Inactive ({courses.filter(c => !c.is_active).length})
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Courses List */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-gray-600">Course</th>
                                    <th className="text-left py-3 px-4 text-gray-600">Students</th>
                                    <th className="text-left py-3 px-4 text-gray-600">Status</th>
                                    <th className="text-left py-3 px-4 text-gray-600">Created</th>
                                    <th className="text-left py-3 px-4 text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCourses.length > 0 ? (
                                    filteredCourses.map((course) => (
                                        <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    {course.thumbnail ? (
                                                        <img
                                                            src={course.thumbnail.startsWith('http') ? course.thumbnail : `http://127.0.0.1:8000${course.thumbnail}`}
                                                            alt={course.title}
                                                            className="w-12 h-12 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <BookOpen className="w-6 h-6 text-blue-600" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-gray-900">{course.title}</div>
                                                        <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                                                            {course.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-600">{course.students_count || 0}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    course.is_active 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {course.is_active ? (
                                                        <>
                                                            <CheckCircle className="w-3 h-3" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-3 h-3" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="text-sm text-gray-600">
                                                    {new Date(course.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/courses/${course.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/courses/${course.id}/edit`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteCourse(course.id)}
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
                                                <BookOpen className="w-16 h-16 text-gray-400 mx-auto" />
                                                <div>
                                                    <p className="text-gray-600 mb-4">
                                                        {searchTerm || filterStatus !== 'all' 
                                                            ? 'No courses found matching your criteria' 
                                                            : 'No courses yet'
                                                        }
                                                    </p>
                                                    {!searchTerm && filterStatus === 'all' && (
                                                        <Link href="/admin/courses/new">
                                                            <Button variant="primary">
                                                                Create First Course
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Courses</p>
                                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                            </div>
                            <BookOpen className="w-8 h-8 text-blue-600" />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Active Courses</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {courses.filter(c => c.is_active).length}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Students</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {courses.reduce((sum, course) => sum + (course.students_count || 0), 0)}
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
