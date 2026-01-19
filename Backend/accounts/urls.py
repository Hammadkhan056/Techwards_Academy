from django.urls import path
from .views import StudentRegistrationView, StudentLoginView

urlpatterns = [
    path('student/register/', StudentRegistrationView.as_view(), name='student-register'),
    path('student/login/', StudentLoginView.as_view(), name='student-login'),
]
