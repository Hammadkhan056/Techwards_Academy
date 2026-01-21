from encodings.punycode import T
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from yaml import serialize
# Create your views here.
from .models import Teacher
from .serializers import TeacherProfileSerializer, TeacherProflieUpdateSerializer
from .permissions import IsTeacher, IsAdmin

class TeacherProfileCreateView(APIView):
    permission_classes = [IsTeacher]
    
    def post(self,request):
        teacher, created = Teacher.objects.get_or_create(user=request.user)
        
        if not created:
            return Response(
                {"error":"Profile already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        serializer = TeacherProfileSerializer(teacher)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    

class TeacherProfileDetailView(APIView):
    permission_classes = [IsTeacher]
    def get(self, request):
        teacher = get_object_or_404(Teacher, user=request.user)
        serializer= TeacherProfileSerializer(teacher)
        return Response(serializer.data)
    
    
    
class TeacherProfileUpdateView(APIView):
    permission_classes = [IsTeacher]
    
    def put(self, request):
        teacher = get_object_or_404(Teacher, user=request.user)
        serializer = TeacherProflieUpdateSerializer(teacher,data=request.data)
        
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Profile updated successfully."})
    
    
class TeacherVerfiyView(APIView):
    permission_classes = [IsAdmin]
    def post(self,request, teacher_id):
        teacher = get_object_or_404(Teacher, id=teacher_id)
        teacher.is_verified = True
        teacher.save()
        return Response({"detail": "Teacher verified successfully."})
    
    
    