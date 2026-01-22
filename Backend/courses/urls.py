from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CourseDetailView, CourseListView, ChapterListView, CourseViewSet,
    VideoLectureViewSet, AdminNoteViewSet, StudentNoteViewSet,
    ChapterContentView
)

# Create routers
course_router = DefaultRouter()
course_router.register(r'', CourseViewSet, basename='course')

# Separate router for student notes (will be included at 'student-notes/')
student_router = DefaultRouter()
student_router.register(r'', StudentNoteViewSet, basename='student-note')

urlpatterns = [
    # Course endpoints from router
    re_path(r'', include(course_router.urls)),
    
    # Student notes router at student-notes/ prefix
    re_path(r'student-notes/', include(student_router.urls)),
    
    # Chapter-specific endpoints (videos and admin notes)
    path('chapters/<int:chapter_id>/videos/', VideoLectureViewSet.as_view({'get': 'list', 'post': 'create'}), name='video-list'),
    path('chapters/<int:chapter_id>/videos/<int:pk>/', VideoLectureViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='video-detail'),
    
    path('chapters/<int:chapter_id>/admin-notes/', AdminNoteViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-note-list'),
    path('chapters/<int:chapter_id>/admin-notes/<int:pk>/', AdminNoteViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin-note-detail'),
    
    # Chapter content endpoint
    path('chapters/<int:chapter_id>/content/', ChapterContentView.as_view(), name='chapter-content'),
    
    # Legacy URLs
    path('subjects/', CourseListView.as_view()),
    path('subjects/<int:pk>/', CourseDetailView.as_view()),
    path('subjects/<int:course_id>/chapters/', ChapterListView.as_view()),
]

