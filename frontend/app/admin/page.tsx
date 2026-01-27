'use client';

// ============================================================================
// TECHWARDS ACADEMY - ADMIN DASHBOARD
// Admin interface for managing courses, tests, and users
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { coursesApi, testsApi } from '@/lib/api';
import type { Course, TestAssignment } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  BookOpen, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus,
  Play,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalStudents: 0,
        totalTests: 0,
        activeAssignments: 0
    });
    const [recentCourses, setRecentCourses] = useState<Course[]>([]);
    const [recentTests, setRecentTests] = useState<TestAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'ADMIN')) {
            router.push('/dashboard');
            return;
        }

        if (user?.role === 'ADMIN') {
            loadDashboardData();
        }
    }, [user, authLoading, router]);

    const loadDashboardData = async () => {
        try {
            // Load courses for stats
            const coursesData = await coursesApi.getAll();
            const courses = coursesData.results || [];
            
            // Load recent courses
            setRecentCourses(courses.slice(0, 5));
            
            // Calculate stats (simplified - in real app would use proper endpoints)
            setStats({
                totalCourses: courses.length,
                totalStudents: 0, // Would need separate endpoint
                totalTests: 0, // Would need separate endpoint
                activeAssignments: 0 // Would need separate endpoint
            });
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading admin dashboard...</p>
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                    <p className="text-gray-600">Manage courses, tests, and students</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <BookOpen className="w-8 h-8 text-blue-600" />
                            <span className="text-2xl font-bold text-gray-900">{stats.totalCourses}</span>
                        </div>
                        <h3 className="text-gray-600 font-medium">Total Courses</h3>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-green-600" />
                            <span className="text-2xl font-bold text-gray-900">{stats.totalStudents}</span>
                        </div>
                        <h3 className="text-gray-600 font-medium">Total Students</h3>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="w-8 h-8 text-purple-600" />
                            <span className="text-2xl font-bold text-gray-900">{stats.totalTests}</span>
                        </div>
                        <h3 className="text-gray-600 font-medium">Total Tests</h3>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Play className="w-8 h-8 text-orange-600" />
                            <span className="text-2xl font-bold text-gray-900">{stats.activeAssignments}</span>
                        </div>
                        <h3 className="text-gray-600 font-medium">Active Tests</h3>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <Card>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Link href="/admin/courses/new">
                                    <Button variant="primary" className="w-full">
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Course
                                    </Button>
                                </Link>
                                <Link href="/admin/tests/new">
                                    <Button variant="primary" className="w-full">
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Test
                                    </Button>
                                </Link>
                                <Link href="/admin/courses">
                                    <Button variant="outline" className="w-full">
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Manage Courses
                                    </Button>
                                </Link>
                                <Link href="/admin/tests">
                                    <Button variant="outline" className="w-full">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Manage Tests
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Database</span>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">API Server</span>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Media Storage</span>
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recent Courses */}
                <Card className="mb-8">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Recent Courses</h2>
                            <Link href="/admin/courses">
                                <Button variant="ghost" size="sm">View All</Button>
                            </Link>
                        </div>
                        
                        {recentCourses.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 px-4 text-gray-600">Course</th>
                                            <th className="text-left py-2 px-4 text-gray-600">Students</th>
                                            <th className="text-left py-2 px-4 text-gray-600">Status</th>
                                            <th className="text-left py-2 px-4 text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentCourses.map((course) => (
                                            <tr key={course.id} className="border-b border-gray-100">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{course.title}</div>
                                                        <div className="text-sm text-gray-500">ID: {course.id}</div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-600">{course.students_count || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        course.is_active 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {course.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Link href={`/admin/courses/${course.id}`}>
                                                        <Button variant="ghost" size="sm">Manage</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No courses yet</p>
                                <Link href="/admin/courses/new">
                                    <Button variant="primary" className="mt-4">
                                        Create First Course
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Admin Tools */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Tools</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link href="/admin/users">
                                <Button variant="outline" className="w-full">
                                    <Users className="w-4 h-4 mr-2" />
                                    Manage Users
                                </Button>
                            </Link>
                            <Link href="/admin/reports">
                                <Button variant="outline" className="w-full">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Reports
                                </Button>
                            </Link>
                            <Link href="/admin/settings">
                                <Button variant="outline" className="w-full">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
}
