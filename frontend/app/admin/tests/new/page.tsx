'use client';

// ============================================================================
// TECHWARDS ACADEMY - ADMIN TEST CREATION
// Create new tests with questions and answers
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
  FileText, 
  Plus, 
  Trash2, 
  Save,
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  marks: number;
  options: Option[];
}

interface Option {
  id: string;
  text: string;
  is_correct: boolean;
}

export default function AdminCreateTestPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Test form data
    const [testData, setTestData] = useState({
        title: '',
        description: '',
        course: '',
        duration_minutes: '',
        is_active: true,
        is_published: false
    });
    
    const [questions, setQuestions] = useState<Question[]>([]);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'ADMIN')) {
            router.push('/dashboard');
            return;
        }

        if (user?.role === 'ADMIN') {
            loadCourses();
        }
    }, [user, authLoading, router]);

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

    const addQuestion = () => {
        const newQuestion: Question = {
            id: Date.now().toString(),
            text: '',
            marks: 1,
            options: [
                { id: '1', text: '', is_correct: false },
                { id: '2', text: '', is_correct: false },
                { id: '3', text: '', is_correct: false },
                { id: '4', text: '', is_correct: false }
            ]
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (questionId: string, field: keyof Question, value: any) => {
        setQuestions(questions.map(q => 
            q.id === questionId ? { ...q, [field]: value } : q
        ));
    };

    const updateOption = (questionId: string, optionId: string, field: keyof Option, value: any) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.map(o => 
                        o.id === optionId ? { ...o, [field]: value } : o
                    )
                };
            }
            return q;
        }));
    };

    const setCorrectOption = (questionId: string, optionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.map(o => ({
                        ...o,
                        is_correct: o.id === optionId
                    }))
                };
            }
            return q;
        }));
    };

    const removeQuestion = (questionId: string) => {
        setQuestions(questions.filter(q => q.id !== questionId));
    };

    const addOption = (questionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                const newOption: Option = {
                    id: Date.now().toString(),
                    text: '',
                    is_correct: false
                };
                return { ...q, options: [...q.options, newOption] };
            }
            return q;
        }));
    };

    const removeOption = (questionId: string, optionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return { ...q, options: q.options.filter(o => o.id !== optionId) };
            }
            return q;
        }));
    };

    const validateForm = () => {
        if (!testData.title.trim()) {
            alert('Please enter a test title');
            return false;
        }
        if (!testData.course) {
            alert('Please select a course');
            return false;
        }
        if (questions.length === 0) {
            alert('Please add at least one question');
            return false;
        }
        
        for (const question of questions) {
            if (!question.text.trim()) {
                alert('Please fill in all question texts');
                return false;
            }
            if (question.options.length < 2) {
                alert('Each question must have at least 2 options');
                return false;
            }
            
            const hasCorrectOption = question.options.some(o => o.is_correct);
            if (!hasCorrectOption) {
                alert('Each question must have one correct answer');
                return false;
            }
            
            const allOptionsFilled = question.options.every(o => o.text.trim());
            if (!allOptionsFilled) {
                alert('Please fill in all option texts');
                return false;
            }
        }
        
        return true;
    };

    const handleSave = async (publish: boolean = false) => {
        if (!validateForm()) return;

        setIsSaving(true);
        
        try {
            // Create test
            const testResponse = await fetch('http://127.0.0.1:8000/api/tests/admin/tests/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: testData.title,
                    description: testData.description,
                    course: parseInt(testData.course),
                    duration_minutes: testData.duration_minutes ? parseInt(testData.duration_minutes) : null,
                    is_active: testData.is_active,
                    is_published: publish
                })
            });

            if (!testResponse.ok) {
                throw new Error('Failed to create test');
            }

            const test = await testResponse.json();

            // Create questions and options
            for (const question of questions) {
                // Create question
                const questionResponse = await fetch('http://127.0.0.1:8000/api/tests/admin/questions/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: question.text,
                        marks: question.marks,
                        test: test.id,
                        order: questions.indexOf(question) + 1
                    })
                });

                if (!questionResponse.ok) {
                    throw new Error('Failed to create question');
                }

                const createdQuestion = await questionResponse.json();

                // Create options
                for (const option of question.options) {
                    const optionResponse = await fetch('http://127.0.0.1:8000/api/tests/admin/options/', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: option.text,
                            is_correct: option.is_correct,
                            question: createdQuestion.id
                        })
                    });

                    if (!optionResponse.ok) {
                        throw new Error('Failed to create option');
                    }
                }
            }

            // Publish if requested
            if (publish) {
                await fetch(`http://127.0.0.1:8000/api/tests/admin/tests/${test.id}/publish/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            alert(`Test ${publish ? 'published' : 'saved'} successfully!`);
            router.push('/admin/tests');
        } catch (error) {
            console.error('Failed to save test:', error);
            alert('Failed to save test. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
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
                    <div className="flex items-center gap-4">
                        <Link href="/admin/tests">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Tests
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Create New Test</h1>
                            <p className="text-gray-600">Create a test with multiple choice questions</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Test Details */}
                    <div className="lg:col-span-1">
                        <Card className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Test Details</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Test Title *
                                    </label>
                                    <Input
                                        value={testData.title}
                                        onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                        placeholder="Enter test title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Description
                                    </label>
                                    <textarea
                                        value={testData.description}
                                        onChange={(e) => setTestData({ ...testData, description: e.target.value })}
                                        placeholder="Test description (optional)"
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Course *
                                    </label>
                                    <select
                                        value={testData.course}
                                        onChange={(e) => setTestData({ ...testData, course: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select a course</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Duration (minutes)
                                    </label>
                                    <Input
                                        type="number"
                                        value={testData.duration_minutes}
                                        onChange={(e) => setTestData({ ...testData, duration_minutes: e.target.value })}
                                        placeholder="Leave empty for no time limit"
                                        min="1"
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={testData.is_active}
                                            onChange={(e) => setTestData({ ...testData, is_active: e.target.checked })}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="space-y-2">
                                    <Button
                                        variant="primary"
                                        className="w-full"
                                        onClick={() => handleSave(false)}
                                        isLoading={isSaving}
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save as Draft
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="w-full"
                                        onClick={() => handleSave(true)}
                                        isLoading={isSaving}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Save & Publish
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Questions */}
                    <div className="lg:col-span-2">
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Questions</h2>
                                <Button variant="primary" onClick={addQuestion}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Question
                                </Button>
                            </div>

                            {questions.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 mb-4">No questions yet</p>
                                    <Button variant="primary" onClick={addQuestion}>
                                        Add First Question
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {questions.map((question, qIndex) => (
                                        <Card key={question.id} className="p-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    Question {qIndex + 1}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={question.marks}
                                                        onChange={(e) => updateQuestion(question.id, 'marks', parseInt(e.target.value) || 1)}
                                                        placeholder="Marks"
                                                        min="1"
                                                        className="w-20"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeQuestion(question.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <textarea
                                                    value={question.text}
                                                    onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                                    placeholder="Enter your question here..."
                                                    rows={2}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-medium text-gray-700">Answer Options</h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => addOption(question.id)}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {question.options.map((option, oIndex) => (
                                                    <div key={option.id} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`correct-${question.id}`}
                                                            checked={option.is_correct}
                                                            onChange={() => setCorrectOption(question.id, option.id)}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <Input
                                                            value={option.text}
                                                            onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                                                            placeholder={`Option ${oIndex + 1}`}
                                                            className="flex-1"
                                                        />
                                                        {question.options.length > 2 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeOption(question.id, option.id)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
