from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CourseDetailView, CourseListView, ChapterListView, CourseViewSet,
    VideoLectureViewSet, AdminNoteViewSet, StudentNoteViewSet,
    ChapterContentView
)


course_router = DefaultRouter()
course_router.register(r'', CourseViewSet, basename='course')

urlpatterns = [
    # Specific endpoints before router
    path('student-notes/', StudentNoteViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='student-note-list'),
    path('student-notes/<int:pk>/', StudentNoteViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='student-note-detail'),

    # Legacy URLs (must be before router to avoid conflicts)
    path('subjects/', CourseListView.as_view()),
    path('subjects/<int:pk>/', CourseDetailView.as_view()),
    path('subjects/<int:course_id>/chapters/', ChapterListView.as_view()),

    # Course endpoints from router
    re_path(r'', include(course_router.urls)),

    # Other specific endpoints
    path('chapters/<int:chapter_id>/videos/', VideoLectureViewSet.as_view({'get': 'list', 'post': 'create'}), name='video-list'),
    path('chapters/<int:chapter_id>/videos/<int:pk>/', VideoLectureViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='video-detail'),

    path('chapters/<int:chapter_id>/admin-notes/', AdminNoteViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-note-list'),
    path('chapters/<int:chapter_id>/admin-notes/<int:pk>/', AdminNoteViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin-note-detail'),

    # Chapter content endpoint
    path('chapters/<int:chapter_id>/content/', ChapterContentView.as_view(), name='chapter-content'),
]

