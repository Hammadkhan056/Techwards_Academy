from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action
from django.utils import timezone
from django.db import transaction
from django.db.models import Q

from .models import Test, Question, AnswerOption, TestAssignment, StudentAnswer
from .serializers import (
    TestSerializer, TestDetailSerializer, QuestionSerializer,
    AnswerOptionSerializer, TestAssignmentSerializer,
    StudentTestListSerializer
)
from courses.models import Course, Chapter

# Admin Test Management Views

class TestViewSet(viewsets.ModelViewSet):
    """
    Admin endpoints for test management
    """
    queryset = Test.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TestDetailSerializer
        return TestSerializer
    
    def list(self, request, *args, **kwargs):
        """Only admins can list tests"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can view tests'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Only admins can create tests"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can create tests'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Only admins can update tests"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can update tests'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only admins can delete tests"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can delete tests'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['POST'])
    def publish(self, request, pk=None):
        """Publish a test"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can publish tests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        test = self.get_object()
        test.is_published = True
        test.save()
        
        return Response({
            'message': f'Test "{test.title}" has been published',
            'is_published': test.is_published
        })
    
    @action(detail=True, methods=['POST'])
    def unpublish(self, request, pk=None):
        """Unpublish a test"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can unpublish tests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        test = self.get_object()
        test.is_published = False
        test.save()
        
        return Response({
            'message': f'Test "{test.title}" has been unpublished',
            'is_published': test.is_published
        })
    
    @action(detail=True, methods=['POST'])
    def assign_to_students(self, request, pk=None):
        """Assign test to students"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can assign tests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        test = self.get_object()
        student_ids = request.data.get('student_ids', [])
        due_at = request.data.get('due_at')
        
        if not student_ids:
            return Response(
                {'error': 'student_ids are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not test.is_published:
            return Response(
                {'error': 'Cannot assign unpublished test'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        assignments_created = []
        with transaction.atomic():
            for student_id in student_ids:
                # Check if already assigned
                existing = TestAssignment.objects.filter(
                    student_id=student_id,
                    test=test,
                    status='assigned'
                ).first()
                
                if not existing:
                    assignment = TestAssignment.objects.create(
                        student_id=student_id,
                        test=test,
                        due_at=due_at
                    )
                    assignments_created.append(assignment.id)
        
        return Response({
            'message': f'Test assigned to {len(assignments_created)} students',
            'assignments_created': len(assignments_created)
        })
    
    @action(detail=True, methods=['POST'])
    def assign_to_course(self, request, pk=None):
        """Assign test to all students in a course"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can assign tests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        test = self.get_object()
        course_id = request.data.get('course_id')
        due_at = request.data.get('due_at')
        
        if not course_id:
            return Response(
                {'error': 'course_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not test.is_published:
            return Response(
                {'error': 'Cannot assign unpublished test'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all enrolled students
        students = course.students.all()
        assignments_created = []
        
        with transaction.atomic():
            for student in students:
                # Check if already assigned
                existing = TestAssignment.objects.filter(
                    student=student,
                    test=test,
                    status='assigned'
                ).first()
                
                if not existing:
                    assignment = TestAssignment.objects.create(
                        student=student,
                        test=test,
                        due_at=due_at
                    )
                    assignments_created.append(assignment.id)
        
        return Response({
            'message': f'Test assigned to {len(assignments_created)} students in {course.title}',
            'assignments_created': len(assignments_created),
            'course': course.title
        })


class QuestionViewSet(viewsets.ModelViewSet):
    """
    Admin endpoints for question management
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Only admins can create questions"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can create questions'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Only admins can update questions"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can update questions'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only admins can delete questions"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can delete questions'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class AnswerOptionViewSet(viewsets.ModelViewSet):
    """
    Admin endpoints for answer option management
    """
    queryset = AnswerOption.objects.all()
    serializer_class = AnswerOptionSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Only admins can create answer options"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can create answer options'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Only admins can update answer options"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can update answer options'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only admins can delete answer options"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can delete answer options'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class TestAssignmentViewSet(viewsets.ModelViewSet):
    """
    Admin endpoints for test assignment management
    """
    queryset = TestAssignment.objects.all()
    serializer_class = TestAssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Only admins can manage assignments"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    def create(self, request, *args, **kwargs):
        """Only admins can create assignments"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can create test assignments'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Only admins can update assignments"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can update test assignments'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only admins can delete assignments"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': 'Only admins can delete test assignments'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
