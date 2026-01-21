from django.urls import path
from .views_student import (
    StudentAssignedTestView,
    StudentStartTestView,
    StudentSubmitTestView,
    StudentTestResultView
)

urlpatterns = [
    path('student/my-tests/', StudentAssignedTestView.as_view()),
    path('student/start/<int:test_id>/', StudentStartTestView.as_view()),
    path('student/submit/<int:test_id>/', StudentSubmitTestView.as_view()),
    path('student/result/<int:test_id>/', StudentTestResultView.as_view()),
]
