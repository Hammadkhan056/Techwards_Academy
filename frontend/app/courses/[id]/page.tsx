'use client';

// ============================================================================
// TECHWARDS ACADEMY - COURSE DETAIL PAGE
// View course details, chapters, and enroll/unenroll
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { coursesApi, chaptersApi } from '@/lib/api';
import type { CourseDetail, Chapter } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BookOpen, Users, ChevronRight, Video, FileText, CheckCircle, Play } from 'lucide-react';
import Link from 'next/link';

export default function CourseDetailPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const courseId = parseInt(params.id as string);

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            loadCourseData();
        }
    }, [user, authLoading, router, courseId]);

    const loadCourseData = async () => {
        try {
            const [courseData, chaptersData] = await Promise.all([
                coursesApi.getById(courseId),
                chaptersApi.getByCourse(courseId)
            ]);
            setCourse(courseData);
            setChapters(chaptersData);
        } catch (error) {
            console.error('Failed to load course:', error);
            setError('Failed to load course details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async () => {
        setIsEnrolling(true);
        setError('');

        try {
            await coursesApi.enroll(courseId);
            // Reload course data to update enrollment status
            await loadCourseData();
        } catch (err: any) {
            setError(err.message || 'Failed to enroll in course');
        } finally {
            setIsEnrolling(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course...</p>
                </div>
            </div>
        );
    }

    if (error && !course) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card className="text-center py-12">
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={() => router.push('/courses')}>
                            Back to Courses
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
                {/* Course Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                {course?.title}
                            </h1>
                            <p className="text-lg text-gray-600 mb-6">
                                {course?.description}
                            </p>

                            <div className="flex items-center gap-6 text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    <span>{course?.students_count} students enrolled</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    <span>{chapters.length} chapters</span>
                                </div>
                            </div>
                        </div>

                        {/* Enrollment Status */}
                        <div className="ml-6">
                            {course?.is_enrolled ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Enrolled</span>
                                </div>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleEnroll}
                                    isLoading={isEnrolling}
                                >
                                    Enroll Now
                                </Button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>

                {/* Course Content */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content - Chapters */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>

                        {chapters.length === 0 ? (
                            <Card className="text-center py-12">
                                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No chapters available yet</p>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {chapters.map((chapter, index) => (
                                    <Card key={chapter.id} className="hover:shadow-lg transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        {chapter.title}
                                                    </h3>
                                                </div>

                                                {chapter.description && (
                                                    <p className="text-gray-600 text-sm mb-3 ml-11">
                                                        {chapter.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-4 ml-11 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Video className="w-4 h-4" />
                                                        <span>Videos</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="w-4 h-4" />
                                                        <span>Notes</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {course?.is_enrolled && (
                                                <Link href={`/courses/${courseId}/chapters/${chapter.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Play className="w-4 h-4" />
                                                        Start
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Course Info */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                What you'll learn
                            </h3>

                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Access to all course materials</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Video lectures from experts</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Official course notes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Personal note-taking</span>
                                </li>
                            </ul>

                            {!course?.is_enrolled && (
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={handleEnroll}
                                    isLoading={isEnrolling}
                                >
                                    Enroll in Course
                                </Button>
                            )}
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
