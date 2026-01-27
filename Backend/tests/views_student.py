from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction
from django.db.models import Max, Q, Prefetch

from .models import TestAssignment, Question, Test, StudentAnswer, AnswerOption
from .serializers import (
    StudentTestListSerializer,
    QuestionSerializer,
    TestDetailSerializer,
    StudentAnswerSubmitSerializer,
    StudentAnswerReviewSerializer,
    TestAssignmentSerializer,
    TestAssignmentListSerializer,
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

        # Get latest attempt of each test using proper aggregation
        latest_attempts = TestAssignment.objects.filter(
            student=user
        ).values('test').annotate(
            latest_attempt=Max('attempt_number')
        ).values_list('test', 'latest_attempt')

        assignments = TestAssignment.objects.filter(
            student=user
        ).filter(
            Q(test__in=[item[0] for item in latest_attempts]) &
            Q(attempt_number__in=[item[1] for item in latest_attempts])
        ).select_related('test', 'student')

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
        
        # ✅ Check if student is enrolled in course
        try:
            is_enrolled = test.course.students.filter(id=user.id).exists()
            if not is_enrolled:
                return Response(
                    {"error": "You are not enrolled in the course for this test"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception as e:
            # If enrollment check fails, continue with test (for debugging)
            print(f"Enrollment check error: {e}")

        
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

        print(f"Found assignment: {assignment.id} for test {test.id}")
    
        assignment.status = 'started'
        assignment.started_at = timezone.now()
        assignment.save(update_fields=['status', 'started_at', 'updated_at'])

        # Optimize queries with Prefetch
        questions = Question.objects.filter(
            test=test
        ).prefetch_related(
            Prefetch('options', queryset=AnswerOption.objects.order_by('id'))
        ).order_by('order')

        print(f"Found {questions.count()} questions for test {test.id}")

        test_serializer = TestDetailSerializer(test)
        questions_serializer = QuestionSerializer(questions, many=True)

        response_data = {
            "assignment_id": assignment.id,
            "attempt_number": assignment.attempt_number,
            "test": test_serializer.data,
            "questions": questions_serializer.data,
            "due_at": assignment.due_at
        }
        
        print(f"Response data keys: {list(response_data.keys())}")
        print(f"Questions in response: {len(response_data['questions'])}")

        return Response(response_data)


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

        answers_data = request.data
        if not isinstance(answers_data, list):
            answers_data = [answers_data]

        # Validate all answers first
        validated_answers = []
        for answer_item in answers_data:
            serializer = StudentAnswerSubmitSerializer(data=answer_item)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            validated_answers.append(serializer.validated_data)

        # Use atomic transaction for submission
        with transaction.atomic():
            # Lock the assignment to prevent concurrent submissions
            assignment = TestAssignment.objects.select_for_update().get(
                student=user,
                test=test,
                status='started'
            )

            # Check deadline
            if assignment.due_at and timezone.now() > assignment.due_at:
                return Response(
                    {"error": "Test submission deadline has passed"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process answers
            total_marks = 0
            correct_answers = 0
            total_questions = 0

            for validated_data in validated_answers:
                question = validated_data['question']
                selected_option = validated_data['option']

                if question.test_id != test_id:
                    return Response(
                        {"error": "Question does not belong to this test"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Upsert answer
                answer, created = StudentAnswer.objects.update_or_create(
                    assignment=assignment,
                    question=question,
                    defaults={
                        'selected_option': selected_option,
                        'is_correct': selected_option.is_correct,
                        'marks_obtained': question.marks if selected_option.is_correct else 0,
                        'question_marks': question.marks,
                        'answered_at': timezone.now(),
                        'evaluated_at': timezone.now()
                    }
                )

                if selected_option.is_correct:
                    total_marks += question.marks
                    correct_answers += 1
                total_questions += 1

            # Update assignment
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

        # Get latest completed attempt
        assignment = TestAssignment.objects.filter(
            student=user,
            test=test,
            status__in=['submitted', 'evaluated']
        ).order_by('-attempt_number').first()

        if not assignment:
            return Response(
                {"error": "No completed attempt found"},
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

        # Check enrollment
        if not test.course.students.filter(id=user.id).exists():
            return Response(
                {"error": "You are not enrolled in this course"},
                status=status.HTTP_403_FORBIDDEN
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

        with transaction.atomic():
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

