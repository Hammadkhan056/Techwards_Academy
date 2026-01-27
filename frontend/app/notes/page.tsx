'use client';

// ============================================================================
// TECHWARDS ACADEMY - STUDENT NOTES PAGE
// Page for viewing and managing student notes
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { studentNotesApi } from '@/lib/api';
import type { StudentNote } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, Plus, Edit2, Trash2, BookOpen, Video, Save, X, Eye } from 'lucide-react';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function NotesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [notes, setNotes] = useState<StudentNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [viewingNoteId, setViewingNoteId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ title: '', content: '' });
    const [isCreatingNote, setIsCreatingNote] = useState(false);
    const [createNoteForm, setCreateNoteForm] = useState({ title: '', content: '', chapter: '', video: '' });
    const [availableCourses, setAvailableCourses] = useState<any[]>([]);
    const [availableChapters, setAvailableChapters] = useState<any[]>([]);
    const [availableVideos, setAvailableVideos] = useState<any[]>([]);

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
            loadNotes();
            loadAvailableCourses();
        }
    }, [user, authLoading, router]);

    const loadAvailableCourses = async () => {
        try {
            const response = await fetch('/api/enrollments/my-courses/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const coursesData = await response.json();
                setAvailableCourses(coursesData);
                console.log('Available courses loaded:', coursesData);
            }
        } catch (error) {
            console.error('Failed to load courses:', error);
        }
    };

    const loadChaptersForCourse = async (courseId: number) => {
        try {
            const response = await fetch(`/api/courses/${courseId}/chapters/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const chaptersData = await response.json();
                setAvailableChapters(chaptersData);
                console.log('Available chapters loaded:', chaptersData);
            }
        } catch (error) {
            console.error('Failed to load chapters:', error);
        }
    };

    const loadVideosForChapter = async (chapterId: number) => {
        try {
            const response = await fetch(`/api/courses/chapters/${chapterId}/videos/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const videosData = await response.json();
                setAvailableVideos(videosData);
                console.log('Available videos loaded:', videosData);
            }
        } catch (error) {
            console.error('Failed to load videos:', error);
        }
    };

    const handleCreateNote = async () => {
        if (!createNoteForm.title || !createNoteForm.content || !createNoteForm.chapter) {
            alert('Please fill in title, content, and select a chapter');
            return;
        }

        try {
            const noteData = {
                chapter: parseInt(createNoteForm.chapter),
                video: createNoteForm.video ? parseInt(createNoteForm.video) : undefined,
                title: createNoteForm.title,
                content: createNoteForm.content,
            };

            console.log('Creating note with data:', noteData);
            console.log('Content being sent:', noteData.content);
            console.log('Content length:', noteData.content.length);
            
            const response = await studentNotesApi.create(noteData);
            console.log('Note created response:', response);
            console.log('Response content:', response.content);
            console.log('Response content length:', response.content?.length || 0);
            
            // Reset form and reload notes
            setCreateNoteForm({ title: '', content: '', chapter: '', video: '' });
            setIsCreatingNote(false);
            await loadNotes();
            
            alert('Note created successfully!');
        } catch (error: any) {
            console.error('Failed to create note:', error);
            if (error.response?.data) {
                console.error('Error response data:', error.response.data);
                alert('Failed to create note: ' + JSON.stringify(error.response.data));
            } else {
                alert('Failed to create note: ' + error.message);
            }
        }
    };

    const loadNotes = async () => {
        try {
            const response = await studentNotesApi.getAll();
            console.log('=== LOADING NOTES DEBUG ===');
            console.log('Raw API response:', response);
            console.log('Response results:', response.results);
            console.log('Number of notes:', response.results?.length || 0);
            
            if (response.results) {
                response.results.forEach((note, index) => {
                    console.log(`\n=== NOTE ${index + 1} ===`);
                    console.log('ID:', note.id);
                    console.log('Title:', note.title);
                    console.log('Content:', note.content);
                    console.log('Content type:', typeof note.content);
                    console.log('Content length:', note.content?.length || 0);
                    console.log('Content is null:', note.content === null);
                    console.log('Content is undefined:', note.content === undefined);
                    console.log('Content is empty string:', note.content === '');
                    console.log('Full note object:', note);
                    console.log('========================');
                });
            }
            
            setNotes(response.results || []);
        } catch (error) {
            console.error('Failed to load notes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await studentNotesApi.delete(noteId);
            setNotes(notes.filter(note => note.id !== noteId));
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    };

    const handleUpdateNote = async (noteId: number) => {
        try {
            await studentNotesApi.update(noteId, {
                title: editForm.title,
                content: editForm.content,
            });
            setNotes(notes.map(note =>
                note.id === noteId
                    ? { ...note, title: editForm.title, content: editForm.content, updated_at: new Date().toISOString() }
                    : note
            ));
            setEditingNoteId(null);
            setEditForm({ title: '', content: '' });
        } catch (error) {
            console.error('Failed to update note:', error);
        }
    };

    const startEditNote = (note: StudentNote) => {
        setEditingNoteId(note.id);
        setViewingNoteId(null);
        setEditForm({ title: note.title, content: note.content });
    };

    const cancelEdit = () => {
        setEditingNoteId(null);
        setEditForm({ title: '', content: '' });
    };

    const startViewNote = (note: StudentNote) => {
        console.log('Starting view note:', {
            id: note.id,
            title: note.title,
            content: note.content,
            contentLength: note.content?.length || 0,
            isOwner: note.is_owner
        });
        setViewingNoteId(note.id);
        setEditingNoteId(null);
    };

    const closeViewNote = () => {
        setViewingNoteId(null);
    };

    const startCreateNote = () => {
        setIsCreatingNote(true);
        setViewingNoteId(null);
        setEditingNoteId(null);
    };

    const cancelCreateNote = () => {
        setIsCreatingNote(false);
        setCreateNoteForm({ title: '', content: '', chapter: '', video: '' });
        setAvailableChapters([]);
        setAvailableVideos([]);
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
                        <p className="text-gray-600 mt-2">View and manage your personal notes</p>
                    </div>
                    <Button
                        variant="primary"
                        className="flex items-center gap-2"
                        onClick={startCreateNote}
                    >
                        <Plus className="w-4 h-4" />
                        Create Note
                    </Button>
                </div>

                {/* Note Creation Form */}
                {isCreatingNote && (
                    <Card className="mb-8">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Create New Note</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelCreateNote}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Select Course
                                        </label>
                                        <select
                                            value={createNoteForm.chapter ? availableChapters.find(c => c.id === parseInt(createNoteForm.chapter))?.course_id : ''}
                                            onChange={(e) => {
                                                const courseId = e.target.value;
                                                if (courseId) {
                                                    loadChaptersForCourse(parseInt(courseId));
                                                    setCreateNoteForm({ ...createNoteForm, chapter: '', video: '' });
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select a course</option>
                                            {availableCourses.map(course => (
                                                <option key={course.id} value={course.id}>
                                                    {course.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Select Chapter
                                        </label>
                                        <select
                                            value={createNoteForm.chapter}
                                            onChange={(e) => {
                                                const chapterId = e.target.value;
                                                setCreateNoteForm({ ...createNoteForm, chapter: chapterId, video: '' });
                                                if (chapterId) {
                                                    loadVideosForChapter(parseInt(chapterId));
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={!availableChapters.length}
                                        >
                                            <option value="">Select a chapter</option>
                                            {availableChapters.map(chapter => (
                                                <option key={chapter.id} value={chapter.id}>
                                                    {chapter.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {availableVideos.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Select Video (Optional)
                                        </label>
                                        <select
                                            value={createNoteForm.video}
                                            onChange={(e) => setCreateNoteForm({ ...createNoteForm, video: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select a video (optional)</option>
                                            {availableVideos.map(video => (
                                                <option key={video.id} value={video.id}>
                                                    {video.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Note Title
                                    </label>
                                    <Input
                                        value={createNoteForm.title}
                                        onChange={(e) => setCreateNoteForm({ ...createNoteForm, title: e.target.value })}
                                        placeholder="Enter note title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Note Content
                                    </label>
                                    <textarea
                                        value={createNoteForm.content}
                                        onChange={(e) => setCreateNoteForm({ ...createNoteForm, content: e.target.value })}
                                        placeholder="Write your notes here..."
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="primary"
                                        onClick={handleCreateNote}
                                        disabled={!createNoteForm.title || !createNoteForm.content || !createNoteForm.chapter}
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Note
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={cancelCreateNote}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Notes Grid */}
                {notes.length === 0 ? (
                    <Card className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes yet</h3>
                        <p className="text-gray-600 mb-6">
                            Start taking notes while watching videos or studying chapters.
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
                        {notes.map((note) => (
                            <Card key={note.id} className="hover:shadow-lg transition-shadow">
                                {editingNoteId === note.id ? (
                                    // Edit Form
                                    <div className="space-y-4">
                                        <Input
                                            label="Title"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            placeholder="Note title"
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Content
                                            </label>
                                            <textarea
                                                value={editForm.content}
                                                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                                placeholder="Write your notes here..."
                                                rows={4}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleUpdateNote(note.id)}
                                            >
                                                <Save className="w-4 h-4" />
                                                Save
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={cancelEdit}
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : viewingNoteId === note.id ? (
                                    // View Mode - Full detailed view
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-gray-900">{note.title}</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={closeViewNote}
                                                className="text-gray-500 hover:text-gray-700"
                                                title="Close view"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-sm text-gray-600 pb-3 border-b">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="w-4 h-4" />
                                                {note.course_title} - {note.chapter_title}
                                            </div>
                                            {note.video_title && (
                                                <div className="flex items-center gap-1">
                                                    <Video className="w-4 h-4" />
                                                    {note.video_title}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-gray-900 mb-2">Note Content:</h4>
                                            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                {note.content || (
                                                    <span className="text-gray-400 italic">
                                                        No content available. This note might be empty.
                                                    </span>
                                                )}
                                            </div>
                                            {!note.content && (
                                                <div className="text-xs text-gray-500 mt-2">
                                                    Debug: Content length = {note.content?.length || 0}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
                                            <div>
                                                <span>Created: {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'N/A'}</span>
                                                <span className="mx-2">•</span>
                                                <span>Updated: {new Date(note.updated_at).toLocaleDateString()}</span>
                                            </div>
                                            <Link
                                                href={`/courses/${note.course}/chapters/${note.chapter}`}
                                                className="text-green-600 hover:text-green-700 font-medium"
                                            >
                                                View Chapter →
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    // Display Mode - Card view
                                    <>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    {note.title}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                                    <div className="flex items-center gap-1">
                                                        <BookOpen className="w-4 h-4" />
                                                        {note.course_title} - {note.chapter_title}
                                                    </div>
                                                    {note.video_title && (
                                                        <div className="flex items-center gap-1">
                                                            <Video className="w-4 h-4" />
                                                            {note.video_title}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {note.is_owner && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => startViewNote(note)}
                                                        className="text-green-600 hover:text-green-700"
                                                        title="View note details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => startEditNote(note)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                        title="Edit note"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                        title="Delete note"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-gray-700 mb-4">
                                            <p style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {note.content}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>Updated {new Date(note.updated_at).toLocaleDateString()}</span>
                                            <Link
                                                href={`/courses/${note.course}/chapters/${note.chapter}`}
                                                className="text-green-600 hover:text-green-700 font-medium"
                                            >
                                                View Chapter →
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
