from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_student import (
    StudentAssignedTestView,
    StudentStartTestView,
    StudentSubmitTestView,
    StudentTestResultView,
    StudentTestHistoryView,
    StudentRetakeTestView,
    StudentTestAttemptDetailView
)
from .views_admin import (
    TestViewSet,
    QuestionViewSet,
    AnswerOptionViewSet,
    TestAssignmentViewSet
)

# Admin router for test management
admin_router = DefaultRouter()
admin_router.register(r'tests', TestViewSet, basename='admin-test')
admin_router.register(r'questions', QuestionViewSet, basename='admin-question')
admin_router.register(r'options', AnswerOptionViewSet, basename='admin-option')
admin_router.register(r'assignments', TestAssignmentViewSet, basename='admin-assignment')

urlpatterns = [
    # Admin endpoints
    path('admin/', include(admin_router.urls)),
    
    # Student endpoints
    path('student/my-tests/', StudentAssignedTestView.as_view(), name='my-tests'),
    path('student/test/<int:test_id>/history/', StudentTestHistoryView.as_view(), name='test-history'),
    path('student/start/<int:test_id>/', StudentStartTestView.as_view(), name='start-test'),
    path('student/submit/<int:test_id>/', StudentSubmitTestView.as_view(), name='submit-test'),
    path('student/result/<int:test_id>/', StudentTestResultView.as_view(), name='test-result'),
    path('student/retake/<int:test_id>/', StudentRetakeTestView.as_view(), name='retake-test'),
    path('student/test/<int:test_id>/attempt/<int:attempt_number>/', 
         StudentTestAttemptDetailView.as_view(), name='attempt-detail'),
]
