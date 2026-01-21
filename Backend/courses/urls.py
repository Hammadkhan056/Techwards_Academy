from django.urls import path

from .views import CourseDetailView,CourseListView,ChapterListView



urlpatterns = [
    path('subjects/',CourseListView.as_view()),
    path('subjects/<int:pk>/',CourseDetailView.as_view()),
    path('subjects/<int:course_id>/chapters/',ChapterListView.as_view()),
]