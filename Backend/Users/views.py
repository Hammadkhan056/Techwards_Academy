import http
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import RegisterSerializer


# Create your views here.

class RegisterView(APIView):
    def post(self,request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message":"Account successfully Created",
                "data":{
                    "id":user.id,
                    "email":user.email,
                    "name": user.name,
                    "phone_number": user.phone_number,
                }
                },status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )