from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Max, Q

from .models import TestAssignment, Question, Test, StudentAnswer, AnswerOption
from .serializers import (
    StudentTestListSerializer,
    QuestionSerializer,
    TestDetailSerializer,
    StudentAnswerSubmitSerializer,
    StudentAnswerReviewSerializer,
    TestAssignmentSerializer,
    TestAssignmentListSerializer,
    StudentAnswerDetailSerializer
)


class StudentAssignedTestView(APIView):
   
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != 'STUDENT':
            return Response(
                {"error": "Only Students allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get latest attempt of each test
        assignments = TestAssignment.objects.filter(
            student=user
        ).order_by('test', '-attempt_number').distinct('test')

        serializer = TestAssignmentListSerializer(assignments, many=True)
        return Response({
            "total": len(serializer.data),
            "assignments": serializer.data
        })


class StudentTestHistoryView(APIView):
 
   
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id):
        user = request.user

        if user.role != 'STUDENT':
            return Response(
                {"error": "Only Students allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            test = Test.objects.get(id=test_id)
        except Test.DoesNotExist:
            return Response(
                {"error": "Test not found"},
                status=status.HTTP_404_NOT_FOUND
            )

      
        assignments = TestAssignment.objects.filter(
            student=user,
            test=test
        ).order_by('-attempt_number')

        if not assignments.exists():
            return Response(
                {"error": "No attempts found for this test"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = TestAssignmentListSerializer(assignments, many=True)
        return Response({
            "test": {
                "id": test.id,
                "title": test.title,
                "total_marks": test.total_marks
            },
            "total_attempts": assignments.count(),
            "attempts": serializer.data
        })


class StudentStartTestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id):
        user = request.user

        if user.role != 'STUDENT':
            return Response(
                {"error": "Only Students allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_profile_completed:
            return Response(
                {"error": "Complete profile before starting test"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            test = Test.objects.get(id=test_id, is_active=True)
        except Test.DoesNotExist:
            return Response(
                {"error": "Test not found or inactive"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # ✅ NEW: Check if student is enrolled in course
        if not test.course.students.filter(id=user.id).exists():
            return Response(
                {"error": "You are not enrolled in the course for this test"},
                status=status.HTTP_403_FORBIDDEN
            )

        
        assignment = TestAssignment.objects.filter(
            student=user,
            test=test,
            status__in=['assigned', 'started']
        ).order_by('-attempt_number').first()

        if not assignment:
            return Response(
                {"error": "Test not assigned to you"},
                status=status.HTTP_403_FORBIDDEN
            )

    
        assignment.status = 'started'
        assignment.started_at = timezone.now()
        assignment.save(update_fields=['status', 'started_at', 'updated_at'])

        questions = Question.objects.filter(
            test=test
        ).prefetch_related('options')

        test_serializer = TestDetailSerializer(test)
        questions_serializer = QuestionSerializer(questions, many=True)

        return Response({
            "assignment_id": assignment.id,
            "attempt_number": assignment.attempt_number,
            "test": test_serializer.data,
            "questions": questions_serializer.data,
            "due_at": assignment.due_at
        })


class StudentSubmitTestView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, test_id):
        user = request.user

        if user.role != 'STUDENT':
            return Response(
                {"error": "Only Students allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            test = Test.objects.get(id=test_id)
        except Test.DoesNotExist:
            return Response(
                {"error": "Test not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get the assignment (latest active)
        try:
            assignment = TestAssignment.objects.get(
                student=user,
                test=test,
                status__in=['started']
            )
        except TestAssignment.DoesNotExist:
            return Response(
                {"error": "Test not started or already submitted"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if assignment.due_at and timezone.now() > assignment.due_at:
            return Response(
                {"error": "Test submission deadline has passed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        answers_data = request.data

        if not isinstance(answers_data, list):
            answers_data = [answers_data]

        total_marks = 0
        correct_answers = 0
        total_questions = 0

        for answer_item in answers_data:
            serializer = StudentAnswerSubmitSerializer(data=answer_item)

            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

            question = serializer.validated_data['question']
            selected_option = serializer.validated_data['option']

           
            if question.test_id != test_id:
                return Response(
                    {"error": "Question does not belong to this test"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            
            existing = StudentAnswer.objects.filter(
                assignment=assignment,
                question=question
            ).first()

            if existing:
                existing.selected_option = selected_option
                existing.is_correct = selected_option.is_correct
                existing.marks_obtained = question.marks if selected_option.is_correct else 0
                existing.question_marks = question.marks
                existing.answered_at = timezone.now()
                existing.save()
            else:
                StudentAnswer.objects.create(
                    assignment=assignment,
                    question=question,
                    selected_option=selected_option,
                    is_correct=selected_option.is_correct,
                    marks_obtained=question.marks if selected_option.is_correct else 0,
                    question_marks=question.marks,
                    answered_at=timezone.now()
                )

            
            if selected_option.is_correct:
                total_marks += question.marks
                correct_answers += 1
            total_questions += 1

        assignment.status = 'submitted'
        assignment.submitted_at = timezone.now()
        assignment.obtained_marks = total_marks
        assignment.total_marks = test.total_marks
        assignment.evaluated_at = timezone.now() 
        assignment.save(update_fields=[
            'status', 'submitted_at', 'obtained_marks',
            'total_marks', 'evaluated_at', 'updated_at'
        ])

        return Response({
            "message": "Test submitted successfully",
            "assignment_id": assignment.id,
            "attempt_number": assignment.attempt_number,
            "obtained_marks": total_marks,
            "total_marks": test.total_marks,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "percentage": round((total_marks / test.total_marks * 100), 2) if test.total_marks else 0,
            "evaluated_at": assignment.evaluated_at
        }, status=status.HTTP_200_OK)


class StudentTestResultView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, test_id):
        user = request.user

        if user.role != 'STUDENT':
            return Response(
                {"error": "Only Students allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            test = Test.objects.get(id=test_id)
        except Test.DoesNotExist:
            return Response(
                {"error": "Test not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        assignment = TestAssignment.objects.filter(
            student=user,
            test=test,
            status__in=['submitted', 'evaluated']
        ).order_by('-attempt_number').first()

        if not assignment:
            return Response(
                {"error": "No submitted attempt found"},
                status=status.HTTP_404_NOT_FOUND
            )

        answers = StudentAnswer.objects.filter(
            assignment=assignment
        ).select_related('question', 'selected_option')

        answers_serializer = StudentAnswerReviewSerializer(answers, many=True)

        return Response({
            "assignment_id": assignment.id,
            "attempt_number": assignment.attempt_number,
            "status": assignment.status,
            "test": {
                "id": test.id,
                "title": test.title,
                "total_marks": test.total_marks
            },
            "results": {
                "obtained_marks": assignment.obtained_marks,
                "total_marks": assignment.total_marks,
                "percentage": round((assignment.obtained_marks / assignment.total_marks * 100), 2)
                if assignment.total_marks else 0,
                "submitted_at": assignment.submitted_at,
                "evaluated_at": assignment.evaluated_at
            },
            "answers": answers_serializer.data
        })


class StudentRetakeTestView(APIView):
   
    permission_classes = [IsAuthenticated]

    def post(self, request, test_id):
        user = request.user

        if user.role != 'STUDENT':
            return Response(
                {"error": "Only Students allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            test = Test.objects.get(id=test_id, is_active=True)
        except Test.DoesNotExist:
            return Response(
                {"error": "Test not found or inactive"},
                status=status.HTTP_404_NOT_FOUND
            )

       
        previous_attempt = TestAssignment.objects.filter(
            student=user,
            test=test
        ).order_by('-attempt_number').first()

        if not previous_attempt:
            return Response(
                {"error": "No previous attempt found. Test must be assigned first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Business rule: Only allow retake if previous attempt is completed
        if previous_attempt.status not in ['submitted', 'evaluated']:
            return Response(
                {"error": "Previous attempt must be completed before retaking"},
                status=status.HTTP_400_BAD_REQUEST
            )

   
        due_at = request.data.get('due_at')

    
        new_attempt = TestAssignment.objects.create(
            student=user,
            test=test,
            attempt_number=previous_attempt.attempt_number + 1,
            test_version=1,
            total_marks=test.total_marks,
            status='assigned',
            due_at=due_at
        )

        serializer = TestAssignmentSerializer(new_attempt)
        return Response({
            "message": "Retake created successfully",
            "assignment": serializer.data
        }, status=status.HTTP_201_CREATED)


class StudentTestAttemptDetailView(APIView):
   
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id, attempt_number):
        user = request.user

        if user.role != 'STUDENT':
            return Response(
                {"error": "Only Students allowed"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            assignment = TestAssignment.objects.get(
                student=user,
                test_id=test_id,
                attempt_number=attempt_number
            )
        except TestAssignment.DoesNotExist:
            return Response(
                {"error": "Attempt not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = TestAssignmentSerializer(assignment)
        return Response(serializer.data)
                
class StudentTestResultView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request,test_id):
        user = request.user
        
        if user.role != 'STUDENT':
            return Response({"error": "Only Student Allowed."},status=status.HTTP_403_FORBIDDEN)
        
        try:
            assignment = TestAssignment.objects.get(
                student=user,
                test_id=test_id
            )
            
        except TestAssignment.DoesNotExist:
            return Response({"error": "Test not assigned yet."},status=status.HTTP_403_FORBIDDEN)
        
        
        if not assignment.is_completed:
            return Response(
                {"error":"Test not completed yet."},status=status.HTTP_400_BAD_REQUEST
            )
            
        student_answers = StudentAnswer.objects.filter(
            assignment__student=user,
            assignment__test_id=test_id
        ).select_related('question','selected_option')
        
        
        serializer = StudentAnswerReviewSerializers(
            student_answers, many=True
        )
        return Response({
            "test_title": assignment.test.title,
            "total_marks": assignment.test.total_marks,
            "obtained_marks": assignment.obtained_marks,
            "result": serializer.data
        })

