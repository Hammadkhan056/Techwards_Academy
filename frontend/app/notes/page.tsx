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
import { FileText, Plus, Edit2, Trash2, BookOpen, Video, Save, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function NotesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [notes, setNotes] = useState<StudentNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ title: '', content: '' });

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
        }
    }, [user, authLoading, router]);

    const loadNotes = async () => {
        try {
            const response = await studentNotesApi.getAll();
            setNotes(response.results);
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
        setEditForm({ title: note.title, content: note.content });
    };

    const cancelEdit = () => {
        setEditingNoteId(null);
        setEditForm({ title: '', content: '' });
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
                        onClick={() => router.push('/courses')}
                    >
                        <Plus className="w-4 h-4" />
                        Create New Note
                    </Button>
                </div>

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
                                ) : (
                                    // Display Mode
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
                                                        onClick={() => startEditNote(note)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-gray-700 mb-4">
                                            <p className="whitespace-pre-wrap">
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