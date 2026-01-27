from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now

from courses.models import Course
from accounts.models import User



class EnrollCourseView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        course_id = request.data.get('course_id')
        
        # Refresh user data to ensure we have the latest profile completion status
        user.refresh_from_db()
        
        if not course_id:
            return Response(
                {"error": "course_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Double-check profile completion status
        if not user.is_profile_completed:
            return Response(
                {"error": "Complete your profile first. Required: Name and Age (16+)"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if user.age and int(user.age) < 16:
            return Response(
                {"error":"You must be 16 years or older to enroll"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Check current enrollments using ManyToMany
        current_enrollments = user.enrolled_courses.count()
        
        if current_enrollments >= 2:
            return Response(
                {"error":"You can enroll in only 2 courses at a time."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {"error":"Course not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user.enrolled_courses.filter(id=course.id).exists():
            return Response(
                {"error":"Already enrolled in this course."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Add user to course students
        user.enrolled_courses.add(course)
        
        return Response(
            {"message":"Enrollment successful"},
            status=status.HTTP_201_CREATED
        )
        
        
        
class MyCourseView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self,request):
        courses = request.user.enrolled_courses.all()
        
        course_data = []
        for course in courses:
            course_data.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'thumbnail': course.thumbnail.url if course.thumbnail else None,
                'created_at': course.created_at
            })
        
        return Response(course_data)
    
    

class DropCourseView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        course_id = request.data.get('course_id')
        
        if not course_id:
            return Response(
                {"error":"course_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {"error":"Course not found."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        if not request.user.enrolled_courses.filter(id=course.id).exists():
            return Response(
                {"error":"You are not enrolled in this course."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Remove user from course students
        request.user.enrolled_courses.remove(course)
        
        return Response({"message":"Course dropped successfully"})