'use client';

// ============================================================================
// TECHWARDS ACADEMY - COURSE CATALOG
// Browse and enroll in available courses
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { coursesApi } from '@/lib/api';
import type { Course } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BookOpen, Users, Search, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function CoursesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            loadCourses();
        }
    }, [user, authLoading, router]);

    const loadCourses = async () => {
        try {
            const response = await coursesApi.getAll();
            setCourses(response.results);
        } catch (error) {
            console.error('Failed to load courses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Explore Courses
                    </h1>
                    <p className="text-gray-600">
                        Discover and enroll in courses to expand your knowledge
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Courses Grid */}
                {filteredCourses.length === 0 ? (
                    <Card className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No courses found
                        </h3>
                        <p className="text-gray-600">
                            {searchQuery ? 'Try adjusting your search' : 'No courses available yet'}
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <Card key={course.id} hover className="flex flex-col">
                                {/* Course Image */}
                                <div className="w-full h-40 bg-gradient-primary rounded-lg mb-4 flex items-center justify-center">
                                    <BookOpen className="w-16 h-16 text-white" />
                                </div>

                                {/* Course Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 flex-1">
                                            {course.title}
                                        </h3>
                                        {course.is_enrolled && (
                                            <span className="badge badge-success ml-2">
                                                <CheckCircle className="w-3 h-3" />
                                                Enrolled
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                        {course.description}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{course.students_count} students</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="pt-4 border-t border-gray-200">
                                    <Link href={`/courses/${course.id}`} className="block">
                                        <Button
                                            variant={course.is_enrolled ? 'outline' : 'primary'}
                                            className="w-full"
                                        >
                                            {course.is_enrolled ? 'View Course' : 'Enroll Now'}
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
