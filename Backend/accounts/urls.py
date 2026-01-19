from django.urls import path
from .views import StudentRegistrationView, StudentLoginView, StudentProfileView

urlpatterns = [
    path('student/register/', StudentRegistrationView.as_view(), name='student-register'),
    path('student/login/', StudentLoginView.as_view(), name='student-login'),
    path('student/profile/', StudentProfileView.as_view()),
]
