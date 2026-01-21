
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import TestAssignment, Question, Test, StudentAnswer, AnswerOption
from .serializers import (
    StudentTestListSerializer,
    QuestionSerializer, 
    StudentAnswerSubmitSerializer,
    StudentAnswerReviewSerializers
)


class StudentAssignedTestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role != 'STUDENT':
            return Response({"error": "Only Student allowed"},status=status.HTTP_403_FORBIDDEN)
        
        assignments = TestAssignment.objects.filter(
            student=user
        ).select_related('test')
        
        tests = [a.test for a in assignments]
        
        serializer = StudentTestListSerializer(tests, many=True)
        return Response(serializer.data)
    


class StudentStartTestView(APIView): 
    permission_classes = [IsAuthenticated]
    
    def get(self, request, test_id):
        user = request.user
        
        if user.role != 'STUDENT':
            return Response({"error":"Only Students Allowed."},status=status.HTTP_403_FORBIDDEN)
        
        
        if not user.is_profile_completed:
            return Response(
                {"error":"Complete proflie before starting test."},
                status= status.HTTP_403_FORBIDDEN
            )
            
        try: 
            assignment = TestAssignment.objects.get(
                student=user,
                test_id=test_id
            )
        
        except TestAssignment.DoesNotExist:
            return Response(
                {"error": "Test not assigned to you."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if assignment.iscompleted:
            return Response(
                {
                    "error": "Test already completed."
                },
                status =status.HTTP_400_BAD_REQUEST
            )
            
        questions = Question.objects.filter(test_id=test_id).prefetch_related('options')
        serializer = QuestionSerializer(questions, many=True)
        return Response({
            "test_id": test_id,
            "questions": serializer.data
        })
            
            
class StudentSubmitTestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self,request,test_id):
        user = request.user
        
        if user.role != 'STUDENT':
            return Response({"error":"Only Students allowed."},status=status.HTTP_403_FORBIDDEN)
        
        try:
            assignment = TestAssignment.objects.get(
                student=user,
                test_id=test_id
            )
            
        except TestAssignment.DoesNotExist:
            return Response({"error": "Test not assigned."},status=status.HTTP_403_FORBIDDEN)
        
        if assignment.is_completed:
            return Response({"error":"Test already Completed."},status=status.HTTP_400_BAD_REQUEST)
        
        serializer = StudentAnswerSubmitSerializer(
            data=request.data,
            many=True
        )
        
        serializer.is_valid(raise_exception=True)
        
        answer_data = serializer.validated_data
        total_marks = 0
        
        for item in answer_data:
            question_id = item['question_id']
            selected_answer_id = item['selected_answer_id']
            
            try:
                
                question = Question.objects.get(
                    id=question_id,
                    test_id=test_id
                )
                selected_answer = AnswerOption.objects.get(
                    id=selected_answer_id,
                    question=question)
            except (Question.DoesNotExist, AnswerOption.DoesNotExist):
                continue
            
            is_correct = selected_answer.is_correct
            
            StudentAnswer.objects.create(
                assignment=assignment,
                question=question,
                selected_option=selected_answer,
                is_correct=is_correct
            )
            
            if is_correct:
                total_marks += question.marks
                
                
        
        assignment.obtained_marks = total_marks
        assignment.is_completed = True
        assignment.save()
        
        return Response(
            {"message": "Test submitted successfully",
             "total_marks": total_marks}
        )
                

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
