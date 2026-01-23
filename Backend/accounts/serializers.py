
from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate


class StudentRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for student registration with validation."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = super().create(validated_data)
        user.set_password(password)
        user.save()
        return user
    
    
class StudentLoginSerializer(serializers.Serializer):
    """Serializer for student login authentication."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        user = authenticate(username=email, password=password)
        
        if not user:
            raise serializers.ValidationError("Invalid email or password")
        
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")
        
        if user.role != 'STUDENT':
            raise serializers.ValidationError("Invalid user role")
        
        attrs['user'] = user
        return attrs
    
    
class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'phone_number', 'phone_verified',
            'age', 'city', 'role', 'is_active', 'is_profile_completed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'phone_verified']
    
    
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