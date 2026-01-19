

from rest_framework import serializers
from .models import  User
import uuid
from django.contrib.auth import authenticate

class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['name','email','password']

    def create(self, validated_data):
        stu_id = uuid.uuid4()
        user = User.objects.create(
            stu_id=stu_id,
            name = validated_data['name'],
            email = validated_data['email'],
            role='STUDENT',
            is_profile_completed=False
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
    
    
class StudentLoginSerializer(serializers.Serializer): 
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs): 
        email = attrs.get('email')
        password = attrs.get('password')
        
        user = authenticate(username=email, password=password)
        
        
        if not user: 
            raise serializers.ValidationError("Invalid name or password")
        
        if not user.is_active: 
            raise serializers.ValidationError("This account is inactive.")
        
        if user.role != 'STUDENT':
            raise serializers.ValidationError("Invalid user role")
        
        attrs['user'] = user
        return attrs
    
    
class StudentProfileSerializer(serializers.ModelSerializer): 
    class Meta: 
        model = User
        fields = [
            'father_name',
            'address',
            'age',
            'city',
            'phone_number'
        ]
        
        
    def update(self, instance,validated_data): 
        for attr, value in validated_data.items():
            setattr(instance,attr,value)
        
        instance.is_profile_completed = True
        instance.save()
        return instance