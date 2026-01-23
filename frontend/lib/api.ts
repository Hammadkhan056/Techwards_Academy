// ============================================================================
// TECHWARDS ACADEMY - API CLIENT
// Axios-based API client with authentication and error handling
// ============================================================================

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  Course,
  CourseDetail,
  Chapter,
  ChapterWithContent,
  VideoLecture,
  AdminNote,
  StudentNote,
  CreateStudentNote,
  UpdateStudentNote,
  PaginatedResponse,
  EnrollmentResponse,
  User,
} from '@/types';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/accounts/student/login/', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/accounts/student/register/', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await apiClient.post('/accounts/logout/', { refresh: refreshToken });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/accounts/student/profile/');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await apiClient.post('/accounts/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },
};

// ============================================================================
// COURSES API
// ============================================================================

export const coursesApi = {
  // Get all courses
  getAll: async (): Promise<PaginatedResponse<Course>> => {
    const response = await apiClient.get<PaginatedResponse<Course>>('/courses/');
    return response.data;
  },

  // Get course by ID
  getById: async (id: number): Promise<CourseDetail> => {
    const response = await apiClient.get<CourseDetail>(`/courses/${id}/`);
    return response.data;
  },

  // Get enrolled courses
  getMyCourses: async (): Promise<PaginatedResponse<Course>> => {
    const response = await apiClient.get<PaginatedResponse<Course>>('/courses/my_courses/');
    return response.data;
  },

  // Enroll in course
  enroll: async (courseId: number): Promise<EnrollmentResponse> => {
    const response = await apiClient.post<EnrollmentResponse>(`/courses/${courseId}/enroll/`);
    return response.data;
  },

  // Create course (admin only)
  create: async (data: Partial<Course>): Promise<Course> => {
    const response = await apiClient.post<Course>('/courses/', data);
    return response.data;
  },

  // Update course (admin only)
  update: async (id: number, data: Partial<Course>): Promise<Course> => {
    const response = await apiClient.patch<Course>(`/courses/${id}/`, data);
    return response.data;
  },

  // Delete course (admin only)
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/courses/${id}/`);
  },
};

// ============================================================================
// CHAPTERS API
// ============================================================================

export const chaptersApi = {
  // Get chapters for a course
  getByCourse: async (courseId: number): Promise<Chapter[]> => {
    const response = await apiClient.get<Chapter[]>(`/courses/subjects/${courseId}/chapters/`);
    return response.data;
  },

  // Get chapter with all content
  getWithContent: async (chapterId: number): Promise<ChapterWithContent> => {
    const response = await apiClient.get<ChapterWithContent>(`/courses/chapters/${chapterId}/content/`);
    return response.data;
  },

  // Create chapter (admin only)
  create: async (courseId: number, data: Partial<Chapter>): Promise<Chapter> => {
    const response = await apiClient.post<Chapter>(`/courses/subjects/${courseId}/chapters/`, data);
    return response.data;
  },
};

// ============================================================================
// VIDEOS API
// ============================================================================

export const videosApi = {
  // Get videos for a chapter
  getByChapter: async (chapterId: number): Promise<PaginatedResponse<VideoLecture>> => {
    const response = await apiClient.get<PaginatedResponse<VideoLecture>>(
      `/courses/chapters/${chapterId}/videos/`
    );
    return response.data;
  },

  // Get video by ID
  getById: async (chapterId: number, videoId: number): Promise<VideoLecture> => {
    const response = await apiClient.get<VideoLecture>(
      `/courses/chapters/${chapterId}/videos/${videoId}/`
    );
    return response.data;
  },

  // Create video (admin only)
  create: async (chapterId: number, data: Partial<VideoLecture>): Promise<VideoLecture> => {
    const response = await apiClient.post<VideoLecture>(
      `/courses/chapters/${chapterId}/videos/`,
      data
    );
    return response.data;
  },

  // Update video (admin only)
  update: async (
    chapterId: number,
    videoId: number,
    data: Partial<VideoLecture>
  ): Promise<VideoLecture> => {
    const response = await apiClient.patch<VideoLecture>(
      `/courses/chapters/${chapterId}/videos/${videoId}/`,
      data
    );
    return response.data;
  },

  // Delete video (admin only)
  delete: async (chapterId: number, videoId: number): Promise<void> => {
    await apiClient.delete(`/courses/chapters/${chapterId}/videos/${videoId}/`);
  },
};

// ============================================================================
// ADMIN NOTES API
// ============================================================================

export const adminNotesApi = {
  // Get admin notes for a chapter
  getByChapter: async (chapterId: number): Promise<PaginatedResponse<AdminNote>> => {
    const response = await apiClient.get<PaginatedResponse<AdminNote>>(
      `/courses/chapters/${chapterId}/admin-notes/`
    );
    return response.data;
  },

  // Create admin note (admin only)
  create: async (chapterId: number, data: FormData | Partial<AdminNote>): Promise<AdminNote> => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await apiClient.post<AdminNote>(
      `/courses/chapters/${chapterId}/admin-notes/`,
      data,
      config
    );
    return response.data;
  },

  // Delete admin note (admin only)
  delete: async (chapterId: number, noteId: number): Promise<void> => {
    await apiClient.delete(`/courses/chapters/${chapterId}/admin-notes/${noteId}/`);
  },
};

// ============================================================================
// STUDENT NOTES API
// ============================================================================

export const studentNotesApi = {
  // Get all student notes
  getAll: async (filters?: { chapter_id?: number; video_id?: number }): Promise<PaginatedResponse<StudentNote>> => {
    const params = new URLSearchParams();
    if (filters?.chapter_id) params.append('chapter_id', filters.chapter_id.toString());
    if (filters?.video_id) params.append('video_id', filters.video_id.toString());

    const response = await apiClient.get<PaginatedResponse<StudentNote>>(
      `/courses/student-notes/?${params.toString()}`
    );
    return response.data;
  },

  // Get note by ID
  getById: async (noteId: number): Promise<StudentNote> => {
    const response = await apiClient.get<StudentNote>(`/courses/student-notes/${noteId}/`);
    return response.data;
  },

  // Create student note
  create: async (data: CreateStudentNote): Promise<StudentNote> => {
    const response = await apiClient.post<StudentNote>('/courses/student-notes/', data);
    return response.data;
  },

  // Update student note
  update: async (noteId: number, data: UpdateStudentNote): Promise<StudentNote> => {
    const response = await apiClient.patch<StudentNote>(`/courses/student-notes/${noteId}/`, data);
    return response.data;
  },

  // Delete student note
  delete: async (noteId: number): Promise<void> => {
    await apiClient.delete(`/courses/student-notes/${noteId}/`);
  },
};

// ============================================================================
// TESTS API
// ============================================================================

export const testsApi = {
  // Get assigned tests for student
  getAssignedTests: async (): Promise<{ total: number; assignments: TestAssignment[] }> => {
    const response = await apiClient.get<{ total: number; assignments: TestAssignment[] }>(
      '/tests/student/my-tests/'
    );
    return response.data;
  },

  // Get test history for specific test
  getTestHistory: async (testId: number): Promise<{
    test: { id: number; title: string; total_marks: number };
    total_attempts: number;
    attempts: TestAssignment[];
  }> => {
    const response = await apiClient.get<{
      test: { id: number; title: string; total_marks: number };
      total_attempts: number;
      attempts: TestAssignment[];
    }>(`/tests/student/test/${testId}/history/`);
    return response.data;
  },

  // Start a test attempt
  startTest: async (testId: number): Promise<TestAttempt> => {
    const response = await apiClient.get<TestAttempt>(`/tests/student/start/${testId}/`);
    return response.data;
  },

  // Submit test answers
  submitTest: async (testId: number, answers: TestSubmission[]): Promise<{
    message: string;
    assignment_id: number;
    attempt_number: number;
    obtained_marks: number;
    total_marks: number;
    correct_answers: number;
    total_questions: number;
    percentage: number;
    evaluated_at: string;
  }> => {
    const response = await apiClient.post<{
      message: string;
      assignment_id: number;
      attempt_number: number;
      obtained_marks: number;
      total_marks: number;
      correct_answers: number;
      total_questions: number;
      percentage: number;
      evaluated_at: string;
    }>(`/tests/student/submit/${testId}/`, answers);
    return response.data;
  },

  // Get test results
  getTestResults: async (testId: number): Promise<TestResult> => {
    const response = await apiClient.get<TestResult>(`/tests/student/result/${testId}/`);
    return response.data;
  },

  // Retake a test
  retakeTest: async (testId: number, dueAt?: string): Promise<{
    message: string;
    assignment: TestAssignment;
  }> => {
    const response = await apiClient.post<{
      message: string;
      assignment: TestAssignment;
    }>(`/tests/student/retake/${testId}/`, { due_at: dueAt });
    return response.data;
  },

  // Get specific test attempt details
  getTestAttempt: async (testId: number, attemptNumber: number): Promise<TestAssignment> => {
    const response = await apiClient.get<TestAssignment>(
      `/tests/student/test/${testId}/attempt/${attemptNumber}/`
    );
    return response.data;
  },
};

// Export the configured axios instance
export default apiClient;