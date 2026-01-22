from django.urls import path
from .views_student import (
    StudentAssignedTestView,
    StudentStartTestView,
    StudentSubmitTestView,
    StudentTestResultView,
    StudentTestHistoryView,
    StudentRetakeTestView,
    StudentTestAttemptDetailView
)

urlpatterns = [
   
    path('student/my-tests/', StudentAssignedTestView.as_view(), name='my-tests'),
    
    path('student/test/<int:test_id>/history/', StudentTestHistoryView.as_view(), name='test-history'),
    
    path('student/start/<int:test_id>/', StudentStartTestView.as_view(), name='start-test'),
    
    path('student/submit/<int:test_id>/', StudentSubmitTestView.as_view(), name='submit-test'),
    
    path('student/result/<int:test_id>/', StudentTestResultView.as_view(), name='test-result'),
    
    path('student/retake/<int:test_id>/', StudentRetakeTestView.as_view(), name='retake-test'),
    
    path('student/test/<int:test_id>/attempt/<int:attempt_number>/', 
         StudentTestAttemptDetailView.as_view(), name='attempt-detail'),
]
