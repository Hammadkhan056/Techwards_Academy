import stat
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Course, Chapter
from .serializers import CourseSerializer,ChapterSerializer
from .permissions import IsTeacherOrAdmin
from enrollments.models import Enrollment

# Create your views here.


class CourseListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if user.role == 'STUDENT':
            enrolled_courses = Course.objects.filter(
                enrollments__student=user,
                enrollments__status='active'
            ).distinct()
            
            serializer = CourseSerializer(enrolled_courses, many=True)
            return Response(serializer.data)
        
        
        courses = Course.objects.all()
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)
    
    
class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request,pk):
        try:
            course = Course.objects.get(id=pk)
        except Course.DoesNotExist:
            return Response({"error": "Course not found."},status=status.HTTP_404_NOT_FOUND)
        
        
        if request.user.role == 'STUDENT':
            if not Enrollment.objects.filter(
                student= request.user,
                course = course,
                status = 'active'
            ).exists():
                return Response(
                    {"error": "Not enrolled in this course"},
                    status = status.HTTP_403_FORBIDDEN
                )
                
        serializer = CourseSerializer(course)
        return Response(serializer.data)
    
    
    
    
class ChapterListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"error": "Course not found"},status=status.HTTP_404_NOT_FOUND)
        
        if request.user.role == 'STUDENT':
            if not Enrollment.objects.filter(
                student=request.user,
                course=course,
                status='active',
            ).exists():
                return Response(
                    {"error":"Enroll in course to veiw chapters"},
                    status = status.HTTP_403_FORBIDDEN
                )
                
        chapters = Chapter.objects.filter(course=course)
        serializer = ChapterSerializer(chapters,many=True)
        return Response(serializer.data)
    