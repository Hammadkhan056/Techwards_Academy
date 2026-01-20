from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now

from .models import Enrollment
from .serializers import EnrollmentCreateSerializer, MyCourseSerializer
from courses.models import Course



class EnrollCourseView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        serializer = EnrollmentCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.is_profile_completed:
            return Response(
                {"error": "Complete your profile first"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        
        if int(user.age) <= 15:
            return Response(
                {"error":"You must be older than 15 to enroll"},
                status = status.HTTP_403_FORBIDDEN
            )
            
            
        active_enrollments = Enrollment.objects.filter(
            student=user, status='active'
        ).count()
        
        if active_enrollments >= 2:
            return Response(
                {"error":"You can enroll in only 2 courses at a time."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        course = Course.objects.get(id=serializer.validated_data['course_id'])
        
        if Enrollment.objects.filter(student=user,course=course).exists():
            return Response(
                {"error":"Already enrolled in this course."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        Enrollment.objects.create(
            student = user, 
            course = course
        )
        
        return Response(
            {"message":"Enrollment successful"},
            status=status.HTTP_201_CREATED
        )
        
        
        
class MyCourseView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self,request):
        enrollments = Enrollment.objects.filter(
            student=request.user,
            status='active'
        )
        
        
        serializer = MyCourseSerializer(enrollments, many=True)
        return Response(serializer.data)
    
    

class DropCourseView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        enrollment_id = request.data.get('enrollment_id')
        try:
            enrollment = Enrollment.objects.get(
                id=enrollment_id,
                student=request.user,
                status='active'
            )

        except Enrollment.DoesNotExist:
            return Response(
                {"error":"Active enrollment not found."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        enrollment.status = 'dropped'
        enrollment.save()
        
        return Response({"message":"Course dropped successfully"})
    
    