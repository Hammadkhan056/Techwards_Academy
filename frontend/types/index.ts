// ============================================================================
// TECHWARDS ACADEMY - TYPE DEFINITIONS
// TypeScript interfaces for backend API models
// ============================================================================

// User & Authentication Types
export interface User {
    id: string;
    name: string;
    father_name?: string;
    email: string;
    role: 'STUDENT' | 'ADMIN';
    phone_number?: string;
    phone_verified: boolean;
    city?: string;
    address?: string;
    age?: number;
    is_profile_completed: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role?: 'STUDENT' | 'ADMIN';
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
}

// Course Types
export interface Course {
    id: number;
    title: string;
    description: string;
    is_active: boolean;
    students_count: number;
    is_enrolled: boolean;
    created_at: string;
    updated_at: string;
    archived_at?: string;
    archived_by?: string;
    archived_by_name?: string;
    archived_by_email?: string;
}

export interface CourseDetail extends Course {
    chapters: Chapter[];
    students: StudentInfo[];
}

export interface StudentInfo {
    id: string;
    name: string;
    email: string;
}

// Chapter Types
export interface Chapter {
    id: number;
    title: string;
    description?: string;
    order: number;
    course: number;
    course_title: string;
    created_at: string;
}

export interface ChapterWithContent extends Chapter {
    videos: VideoLecture[];
    admin_notes: AdminNote[];
    student_notes: StudentNote[];
}

// Video Lecture Types
export interface VideoLecture {
    id: number;
    chapter: number;
    chapter_title: string;
    title: string;
    description?: string;
    youtube_url: string;
    embed_url: string;
    duration_seconds?: number;
    order: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface VideoListItem {
    id: number;
    title: string;
    order: number;
    duration_seconds?: number;
    is_published: boolean;
    embed_url: string;
}

// Note Types
export interface AdminNote {
    id: number;
    chapter: number;
    chapter_title: string;
    title: string;
    note_type: 'text' | 'file';
    content?: string;
    file?: string;
    file_name?: string;
    file_size?: number;
    created_by: string;
    created_by_name: string;
    created_at: string;
    updated_at: string;
}

export interface StudentNote {
    id: number;
    chapter: number;
    chapter_title: string;
    video?: number;
    video_title?: string;
    title: string;
    content: string;
    student_name: string;
    is_owner: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateStudentNote {
    chapter: number;
    video?: number;
    title: string;
    content: string;
}

export interface UpdateStudentNote {
    title?: string;
    content?: string;
}

// API Response Types
export interface PaginatedResponse<T> {
    count: number;
    results: T[];
    next?: string;
    previous?: string;
}

export interface ApiError {
    detail?: string;
    error?: string;
    [key: string]: any;
}

// Enrollment Types
export interface EnrollmentResponse {
    status: 'enrolled' | 'already_enrolled';
    message: string;
    course_id: number;
    course_title: string;
}

// Form Types
export interface LoginFormData {
    email: string;
    password: string;
    remember?: boolean;
}

export interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'STUDENT' | 'ADMIN';
    agreeToTerms: boolean;
}

export interface NoteFormData {
    title: string;
    content: string;
}

// UI State Types
export interface LoadingState {
    isLoading: boolean;
    error: string | null;
}

export interface CourseFilters {
    search?: string;
    enrolled?: boolean;
}

export interface NoteFilters {
    chapter_id?: number;
    video_id?: number;
    search?: string;
}
