import stat
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action

from .models import Course, Chapter, VideoLecture, AdminNote, StudentNote
from .serializers import (
    CourseSerializer, ChapterSerializer, CourseDetailSerializer,
    VideoLectureSerializer, VideoListSerializer,
    AdminNoteSerializer, AdminNoteListSerializer,
    StudentNoteSerializer, StudentNoteListSerializer,
    ChapterWithContentSerializer
)
from .permissions import (
    IsTeacherOrAdmin, IsAdminUser, IsAdminOrReadOnly, 
    IsEnrolledStudentOrAdmin, IsAdminNoteOwnerOrReadOnly, IsStudentNoteOwner
)
from accounts.models import User

# Create your views here.


class CourseViewSet(viewsets.ModelViewSet):
    """
    Course endpoints with enrollment management
    """
    queryset = Course.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Use detail serializer for retrieve"""
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    
    def list(self, request, *args, **kwargs):
        """GET /api/courses/ - List all active courses"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })
    
    def retrieve(self, request, *args, **kwargs):
        """GET /api/courses/{id}/ - Course detail with chapters and students"""
        return super().retrieve(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """POST /api/courses/ - Create course (admin only)"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can create courses'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    # ✅ NEW ENDPOINT: Enroll in course
    @action(detail=True, methods=['POST'], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        """
        POST /api/courses/{id}/enroll/
        Enroll current student in course
        """
        course = self.get_object()
        student = request.user
        
        # Check if student is already enrolled
        if course.students.filter(id=student.id).exists():
            return Response(
                {
                    'status': 'already_enrolled',
                    'message': f'Already enrolled in {course.title}'
                },
                status=status.HTTP_200_OK
            )
        
        # Add student to course
        course.students.add(student)
        
        return Response(
            {
                'status': 'enrolled',
                'message': f'Successfully enrolled in {course.title}',
                'course_id': course.id,
                'course_title': course.title
            },
            status=status.HTTP_201_CREATED
        )
    
    # ✅ NEW ENDPOINT: My enrolled courses
    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def my_courses(self, request):
        """
        GET /api/courses/my_courses/
        List all courses student is enrolled in
        """
        student = request.user
        courses = student.enrolled_courses.filter(is_active=True)
        
        serializer = self.get_serializer(courses, many=True, context={'request': request})
        return Response({
            'count': courses.count(),
            'results': serializer.data
        })
    
    # ✅ NEW ENDPOINT: List course students (admin)
    @action(detail=True, methods=['GET'], permission_classes=[IsAuthenticated])
    def students(self, request, pk=None):
        """
        GET /api/courses/{id}/students/
        List all students enrolled in course
        """
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can view students list'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        course = self.get_object()
        students = course.students.all()
        
        student_data = [
            {
                'id': s.id,
                'name': s.name,
                'email': s.email,
                'age': s.age,
                'phone_number': s.phone_number
            }
            for s in students
        ]
        
        return Response({
            'course_id': course.id,
            'course_title': course.title,
            'total_students': students.count(),
            'students': student_data
        })
    
    # ✅ NEW ENDPOINT: Remove student from course (admin)
    @action(
        detail=True,
        methods=['POST'],
        permission_classes=[IsAuthenticated],
        url_path='remove-student/(?P<student_id>[0-9a-f-]+)'
    )
    def remove_student(self, request, pk=None, student_id=None):
        """
        POST /api/courses/{id}/remove-student/{student_id}/
        Remove student from course (admin only)
        """
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can remove students'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        course = self.get_object()
        
        try:
            student = User.objects.get(id=student_id)
            
            # Check if student is enrolled
            if not course.students.filter(id=student.id).exists():
                return Response(
                    {'error': 'Student not enrolled in this course'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Remove student
            course.students.remove(student)
            
            return Response({
                'status': 'removed',
                'message': f'{student.name} removed from {course.title}'
            })
        
        except User.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class CourseListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if user.role == 'STUDENT':
            # NEW: Get courses where student is in students list
            enrolled_courses = user.enrolled_courses.filter(is_active=True)
            
            serializer = CourseSerializer(enrolled_courses, many=True, context={'request': request})
            return Response(serializer.data)
        
        
        courses = Course.objects.filter(is_active=True)
        serializer = CourseSerializer(courses, many=True, context={'request': request})
        return Response(serializer.data)
    
    
class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            course = Course.objects.get(id=pk, is_active=True)
        except Course.DoesNotExist:
            return Response({"error": "Course not found."}, status=status.HTTP_404_NOT_FOUND)
        
        
        if request.user.role == 'STUDENT':
            # NEW: Check if student is in course.students
            if not course.students.filter(id=request.user.id).exists():
                return Response(
                    {"error": "Not enrolled in this course"},
                    status = status.HTTP_403_FORBIDDEN
                )
                
        serializer = CourseDetailSerializer(course, context={'request': request})
        return Response(serializer.data)
    
    
    
    
class ChapterListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"error": "Course not found"},status=status.HTTP_404_NOT_FOUND)
        
        if request.user.role == 'STUDENT':
            # NEW: Check if student is in course.students
            if not course.students.filter(id=request.user.id).exists():
                return Response(
                    {"error":"Enroll in course to view chapters"},
                    status = status.HTTP_403_FORBIDDEN
                )
                
        chapters = Chapter.objects.filter(course=course)
        serializer = ChapterSerializer(chapters,many=True)
        return Response(serializer.data)


# ============================================================================
# VIDEO LECTURE VIEWSET
# ============================================================================

class VideoLectureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for video lectures.
    
    Endpoints:
    - GET /api/chapters/{chapter_id}/videos/ - List videos in chapter
    - POST /api/chapters/{chapter_id}/videos/ - Create video (admin only)
    - GET /api/chapters/{chapter_id}/videos/{id}/ - Video detail with embed URL
    - PUT/PATCH /api/chapters/{chapter_id}/videos/{id}/ - Update video (admin only)
    - DELETE /api/chapters/{chapter_id}/videos/{id}/ - Delete video (admin only)
    """
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly, IsEnrolledStudentOrAdmin]
    
    def get_queryset(self):
        """Filter videos by chapter"""
        chapter_id = self.kwargs.get('chapter_id')
        if chapter_id:
            return VideoLecture.objects.filter(chapter_id=chapter_id, is_published=True).order_by('order')
        return VideoLecture.objects.none()
    
    def get_serializer_class(self):
        """Use list serializer for list view"""
        if self.action == 'list':
            return VideoListSerializer
        return VideoLectureSerializer
    
    def list(self, request, *args, **kwargs):
        """List all videos in a chapter"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })
    
    def perform_create(self, serializer):
        """Save created_by when creating videos (for future use)"""
        serializer.save()
    
    def retrieve(self, request, *args, **kwargs):
        """Get video detail with embed URL"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# ============================================================================
# ADMIN NOTE VIEWSET
# ============================================================================

class AdminNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for official admin notes.
    
    Endpoints:
    - GET /api/chapters/{chapter_id}/admin-notes/ - List notes (all enrolled students)
    - POST /api/chapters/{chapter_id}/admin-notes/ - Create note (admin only)
    - GET /api/chapters/{chapter_id}/admin-notes/{id}/ - Note detail
    - PUT/PATCH /api/chapters/{chapter_id}/admin-notes/{id}/ - Update (admin only)
    - DELETE /api/chapters/{chapter_id}/admin-notes/{id}/ - Delete (admin only)
    """
    permission_classes = [IsAuthenticated, IsAdminNoteOwnerOrReadOnly, IsEnrolledStudentOrAdmin]
    
    def get_queryset(self):
        """Filter notes by chapter"""
        chapter_id = self.kwargs.get('chapter_id')
        if chapter_id:
            return AdminNote.objects.filter(chapter_id=chapter_id).order_by('-created_at')
        return AdminNote.objects.none()
    
    def get_serializer_class(self):
        """Use list serializer for list view"""
        if self.action == 'list':
            return AdminNoteListSerializer
        return AdminNoteSerializer
    
    def list(self, request, *args, **kwargs):
        """List all admin notes for a chapter"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)


# ============================================================================
# STUDENT NOTE VIEWSET
# ============================================================================

class StudentNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for student personal notes.
    
    Endpoints:
    - GET /api/student-notes/ - List own notes
    - POST /api/student-notes/ - Create note
    - GET /api/student-notes/{id}/ - Note detail
    - PUT/PATCH /api/student-notes/{id}/ - Update own note
    - DELETE /api/student-notes/{id}/ - Delete own note
    
    Filtering:
    - ?chapter_id=1 - Filter by chapter
    - ?video_id=1 - Filter by video
    """
    queryset = StudentNote.objects.all()
    serializer_class = StudentNoteSerializer
    permission_classes = [IsAuthenticated]  # Temporarily simplified
    
    def get_queryset(self):
        """Get only current user's notes"""
        queryset = StudentNote.objects.filter(student=self.request.user).order_by('-updated_at')
        
        # Optional filtering
        chapter_id = self.request.query_params.get('chapter_id')
        if chapter_id:
            queryset = queryset.filter(chapter_id=chapter_id)
        
        video_id = self.request.query_params.get('video_id')
        if video_id:
            queryset = queryset.filter(video_id=video_id)
        
        return queryset
    
    def get_serializer_class(self):
        """Use list serializer for list view"""
        if self.action == 'list':
            return StudentNoteListSerializer
        return StudentNoteSerializer
    
    def list(self, request, *args, **kwargs):
        """List all personal notes for current student"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })
    
    def perform_create(self, serializer):
        """Set student to current user"""
        serializer.save(student=self.request.user)
    
    def perform_update(self, serializer):
        """Only allow updating own notes"""
        if serializer.instance.student_id != self.request.user.id:
            raise PermissionError("You can only edit your own notes")
        serializer.save()


# ============================================================================
# CHAPTER WITH CONTENT VIEW
# ============================================================================

class ChapterContentView(APIView):
    """
    GET /api/chapters/{chapter_id}/content/
    
    Retrieve a chapter with all its learning content:
    - Videos
    - Admin notes
    - Student personal notes (for current student)
    
    Only accessible to enrolled students.
    """
    permission_classes = [IsAuthenticated, IsEnrolledStudentOrAdmin]
    
    def get(self, request, chapter_id):
        try:
            chapter = Chapter.objects.get(id=chapter_id)
        except Chapter.DoesNotExist:
            return Response(
                {'error': 'Chapter not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check enrollment
        if not chapter.course.students.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You must be enrolled in this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ChapterWithContentSerializer(chapter, context={'request': request})
        return Response(serializer.data)

