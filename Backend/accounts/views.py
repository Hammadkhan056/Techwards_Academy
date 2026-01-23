# Create your views here.

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .serializers import StudentRegistrationSerializer, StudentLoginSerializer, StudentProfileSerializer, UserDetailSerializer
from rest_framework_simplejwt.tokens import RefreshToken


@method_decorator(csrf_exempt, name='dispatch')
class StudentRegistrationView(APIView):
    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "message": "Student registered successfully",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserDetailSerializer(user).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
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
                    "user": UserDetailSerializer(user).data,
                    "is_profile_completed": user.is_profile_completed
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class StudentProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = StudentProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = StudentProfileSerializer(
            request.user,
            data = request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message":"Profile completed successfully"},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)