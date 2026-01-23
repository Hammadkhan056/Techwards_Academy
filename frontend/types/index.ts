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
    thumbnail?: string;
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
    course: number;
    course_title: string;
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

// Test Types
export interface Test {
    id: number;
    title: string;
    course: number;
    course_title: string;
    chapter?: number;
    chapter_title?: string;
    total_marks: number;
    is_active: boolean;
    questions: Question[];
    created_at: string;
    updated_at: string;
}

export interface Question {
    id: number;
    text: string;
    marks: number;
    test: number;
    options: AnswerOption[];
    created_at: string;
}

export interface AnswerOption {
    id: number;
    text: string;
    is_correct: boolean;
    created_at: string;
}

export interface TestAssignment {
    id: number;
    student: string;
    student_name: string;
    student_email: string;
    test: number;
    test_title: string;
    test_total_marks: number;
    attempt_number: number;
    test_version: number;
    status: 'assigned' | 'started' | 'submitted' | 'evaluated' | 'cancelled';
    obtained_marks?: number;
    total_marks?: number;
    assigned_at: string;
    started_at?: string;
    submitted_at?: string;
    evaluated_at?: string;
    due_at?: string;
    created_at: string;
    updated_at: string;
}

export interface TestAttempt {
    assignment_id: number;
    attempt_number: number;
    test: Test;
    questions: Question[];
    due_at?: string;
}

export interface TestSubmission {
    question_id: number;
    selected_option_id: number;
}

export interface TestResult {
    assignment_id: number;
    attempt_number: number;
    status: string;
    test: {
        id: number;
        title: string;
        total_marks: number;
    };
    results: {
        obtained_marks: number;
        total_marks: number;
        percentage: number;
        submitted_at?: string;
        evaluated_at?: string;
    };
    answers: StudentAnswer[];
}

export interface StudentAnswer {
    id: number;
    question: Question;
    selected_option_text: string;
    correct_option_text?: string;
    is_correct: boolean;
    marks_obtained: number;
    question_marks: number;
    evaluated_at?: string;
}
