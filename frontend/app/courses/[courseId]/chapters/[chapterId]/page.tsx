'use client';

// ============================================================================
// TECHWARDS ACADEMY - VIDEO PLAYER PAGE
// Watch videos and take notes
// ============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { chaptersApi, videosApi, adminNotesApi, studentNotesApi } from '@/lib/api';
import type { ChapterWithContent, VideoLecture, AdminNote, StudentNote, CreateStudentNote } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Video, FileText, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export default function VideoPlayerPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const chapterId = parseInt(params.chapterId as string);

    const [chapter, setChapter] = useState<ChapterWithContent | null>(null);
    const [currentVideo, setCurrentVideo] = useState<VideoLecture | null>(null);
    const [activeTab, setActiveTab] = useState<'admin' | 'student'>('admin');
    const [isLoading, setIsLoading] = useState(true);

    // Note form state
    const [isCreatingNote, setIsCreatingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [noteForm, setNoteForm] = useState({ title: '', content: '' });

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        loadChapterContent();
    }, [user, chapterId]);

    const loadChapterContent = async () => {
        try {
            const data = await chaptersApi.getWithContent(chapterId);
            setChapter(data);

            // Set first video as current
            if (data.videos && data.videos.length > 0) {
                setCurrentVideo(data.videos[0]);
            }
        } catch (error) {
            console.error('Failed to load chapter:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNote = async () => {
        if (!noteForm.title || !noteForm.content) return;

        try {
            const newNote: CreateStudentNote = {
                chapter: chapterId,
                video: currentVideo?.id,
                title: noteForm.title,
                content: noteForm.content,
            };

            await studentNotesApi.create(newNote);
            setNoteForm({ title: '', content: '' });
            setIsCreatingNote(false);
            await loadChapterContent();
        } catch (error) {
            console.error('Failed to create note:', error);
        }
    };

    const handleUpdateNote = async (noteId: number) => {
        try {
            await studentNotesApi.update(noteId, {
                title: noteForm.title,
                content: noteForm.content,
            });
            setNoteForm({ title: '', content: '' });
            setEditingNoteId(null);
            await loadChapterContent();
        } catch (error) {
            console.error('Failed to update note:', error);
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        if (!confirm('Delete this note?')) return;

        try {
            await studentNotesApi.delete(noteId);
            await loadChapterContent();
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    };

    const startEditNote = (note: StudentNote) => {
        setEditingNoteId(note.id);
        setNoteForm({ title: note.title, content: note.content });
        setIsCreatingNote(false);
    };

    if (isLoading) {
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
                {/* Chapter Title */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">{chapter?.title}</h1>
                    {chapter?.description && (
                        <p className="text-gray-600 mt-2">{chapter.description}</p>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Video Player */}
                    <div className="lg:col-span-2">
                        <Card className="p-0 overflow-hidden mb-6">
                            {currentVideo ? (
                                <div className="aspect-video bg-black">
                                    <iframe
                                        src={currentVideo.embed_url}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                                    <div className="text-center">
                                        <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No video available</p>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {currentVideo && (
                            <Card>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {currentVideo.title}
                                </h2>
                                {currentVideo.description && (
                                    <p className="text-gray-600">{currentVideo.description}</p>
                                )}
                            </Card>
                        )}
                    </div>

                    {/* Notes Panel */}
                    <div className="lg:col-span-1">
                        <Card>
                            {/* Tabs */}
                            <div className="flex gap-2 mb-6 border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('admin')}
                                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'admin'
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Admin Notes
                                </button>
                                <button
                                    onClick={() => setActiveTab('student')}
                                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'student'
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    My Notes
                                </button>
                            </div>

                            {/* Admin Notes Tab */}
                            {activeTab === 'admin' && (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                                    {chapter?.admin_notes && chapter.admin_notes.length > 0 ? (
                                        chapter.admin_notes.map((note) => (
                                            <div key={note.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                                <h4 className="font-bold text-gray-900 mb-2">{note.title}</h4>
                                                {note.note_type === 'text' && note.content && (
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                                                )}
                                                {note.note_type === 'file' && note.file && (
                                                    <a
                                                        href={note.file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:underline"
                                                    >
                                                        Download: {note.file_name}
                                                    </a>
                                                )}
                                                <p className="text-xs text-gray-500 mt-2">
                                                    By {note.created_by_name}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">No admin notes yet</p>
                                    )}
                                </div>
                            )}

                            {/* Student Notes Tab */}
                            {activeTab === 'student' && (
                                <div>
                                    {/* Create Note Button */}
                                    {!isCreatingNote && !editingNoteId && (
                                        <Button
                                            variant="primary"
                                            className="w-full mb-4"
                                            onClick={() => setIsCreatingNote(true)}
                                        >
                                            <Plus className="w-4 h-4" />
                                            New Note
                                        </Button>
                                    )}

                                    {/* Note Form */}
                                    {(isCreatingNote || editingNoteId) && (
                                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <Input
                                                label="Title"
                                                value={noteForm.title}
                                                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                                                placeholder="Note title"
                                                className="mb-3"
                                            />
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Content
                                                </label>
                                                <textarea
                                                    value={noteForm.content}
                                                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                                                    placeholder="Write your notes here..."
                                                    rows={4}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => editingNoteId ? handleUpdateNote(editingNoteId) : handleCreateNote()}
                                                >
                                                    <Save className="w-4 h-4" />
                                                    Save
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setIsCreatingNote(false);
                                                        setEditingNoteId(null);
                                                        setNoteForm({ title: '', content: '' });
                                                    }}
                                                >
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes List */}
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                                        {chapter?.student_notes && chapter.student_notes.length > 0 ? (
                                            chapter.student_notes.map((note) => (
                                                <div key={note.id} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-bold text-gray-900">{note.title}</h4>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => startEditNote(note)}
                                                                className="p-1 text-gray-600 hover:text-blue-600"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteNote(note.id)}
                                                                className="p-1 text-gray-600 hover:text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                                                    {note.video_title && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Video: {note.video_title}
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-center py-8">No notes yet. Create your first note!</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Video List */}
                {chapter?.videos && chapter.videos.length > 1 && (
                    <Card className="mt-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Chapter Videos</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {chapter.videos.map((video) => (
                                <button
                                    key={video.id}
                                    onClick={() => setCurrentVideo(video)}
                                    className={`p-4 rounded-lg border-2 transition-all text-left ${currentVideo?.id === video.id
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Video className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate">{video.title}</h4>
                                            <p className="text-sm text-gray-500">Video {video.order}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
}
