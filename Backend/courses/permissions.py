from rest_framework.permissions import BasePermission, IsAuthenticated
from .models import StudentNote

class IsTeacherOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ['TEACHER', 'ADMIN']
        )


# ============================================================================
# VIDEO AND NOTES PERMISSIONS
# ============================================================================

class IsAdminUser(BasePermission):
    """
    Only admin users can perform this action.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class IsAdminOrReadOnly(BasePermission):
    """
    Admin users can create, update, delete.
    Authenticated users can read if enrolled.
    """
    def has_permission(self, request, view):
        # Allow read access to authenticated users
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user.is_authenticated
        # Admin only for write
        return request.user.is_authenticated and request.user.role == 'ADMIN'
    
    def has_object_permission(self, request, view, obj):
        # Allow read if enrolled
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            if hasattr(obj, 'chapter'):
                return obj.chapter.course.students.filter(id=request.user.id).exists() or request.user.role == 'ADMIN'
            elif hasattr(obj, 'course'):
                return obj.course.students.filter(id=request.user.id).exists() or request.user.role == 'ADMIN'
        # Admin only for write
        return request.user.role == 'ADMIN'


class IsEnrolledStudentOrAdmin(BasePermission):
    """
    Student must be enrolled in the course to access chapter content.
    Admin can access everything.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin can access everything
        if request.user.role == 'ADMIN':
            return True
        
        # Get chapter from kwargs
        chapter_id = view.kwargs.get('chapter_id')
        if chapter_id:
            from .models import Chapter
            try:
                chapter = Chapter.objects.get(id=chapter_id)
                # Check if user is enrolled in the course
                return chapter.course.students.filter(id=request.user.id).exists()
            except Chapter.DoesNotExist:
                return False
        
        return True


class IsAdminNoteOwnerOrReadOnly(BasePermission):
    """
    Admin notes can be:
    - Read by enrolled students and admin
    - Created/Updated/Deleted by admin only
    """
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == 'ADMIN'
    
    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            # Check if student is enrolled in the course or is admin
            if request.user.role == 'ADMIN':
                return True
            return obj.chapter.course.students.filter(id=request.user.id).exists()
        
        # Only admin can modify
        return request.user.role == 'ADMIN'


class IsStudentNoteOwner(BasePermission):
    """
    Students can only create/edit/delete their own notes.
    Only view if enrolled in the course.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Allow all authenticated users (student/admin)
        return True
    
    def has_object_permission(self, request, view, obj):
        """Check if user is the note owner or is admin"""
        if request.user.role == 'ADMIN':
            return True
        # Student can only edit/delete their own notes
        return obj.student == request.user
