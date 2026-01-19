# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import StudentRegistrationSerializer, StudentLoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class StudentRegistrationView(APIView):
    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Student registered successfully"
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentLoginView(APIView): 
    def post(self, request): 
        serializer = StudentLoginSerializer(data=request.data)
        if serializer.is_valid(): 
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            return Response(
                {
                    "message": "Login Successful",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "is_profile_completed": user.is_profile_completed   
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)