from django.urls import URLPattern, path
from .views import EnrollCourseView, MyCourseView, DropCourseView

urlpatterns = [
    path('enroll/',EnrollCourseView.as_view()),
    path('my-courses/',MyCourseView.as_view()),
    path('drop/',DropCourseView.as_view()),
]