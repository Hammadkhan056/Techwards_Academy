from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate

# Import models for counting
try:
    from courses.models import StudentNote
    STUDENT_NOTE_MODEL_AVAILABLE = True
except ImportError:
    STUDENT_NOTE_MODEL_AVAILABLE = False

try:
    from courses.models import TestAttempt
    TEST_ATTEMPT_MODEL_AVAILABLE = True
except ImportError:
    TEST_ATTEMPT_MODEL_AVAILABLE = False


class StudentRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for student registration with validation."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['role'] = 'STUDENT'
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
            'id', 'name', 'email', 'phone', 'phone_verified',
            'age', 'city', 'role', 'is_active', 'is_profile_completed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'phone_verified']
    
    
class StudentProfileSerializer(serializers.ModelSerializer):
    
    enrolled_courses_count = serializers.SerializerMethodField()
    tests_taken_count = serializers.SerializerMethodField()
    notes_count = serializers.SerializerMethodField()
    
    class Meta: 
        model = User
        fields = [
            'id',
            'name',
            'father_name',
            'email',
            'phone',
            'phone_verified',
            'age',
            'city',
            'address',
            'education',
            'bio',
            'role',
            'is_active',
            'is_profile_completed',
            'enrolled_courses_count',
            'tests_taken_count',
            'notes_count',
            'created_at',
            'updated_at'
        ]
        
    def get_enrolled_courses_count(self, obj):
        """Get the number of courses the student is enrolled in"""
        return obj.enrolled_courses.count()
    
    def get_tests_taken_count(self, obj):
        if TEST_ATTEMPT_MODEL_AVAILABLE:
            return TestAttempt.objects.filter(student=obj).count()
        else:
            # If TestAttempt model doesn't exist, return 0
            return 0
    
    def get_notes_count(self, obj):
        """Get the number of notes the student has created"""
        if STUDENT_NOTE_MODEL_AVAILABLE:
            return StudentNote.objects.filter(student=obj).count()
        else:
            # If StudentNote model doesn't exist, return 0
            return 0
        
    def update(self, instance, validated_data): 
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Check and set profile completion
        required_fields = ['name', 'age']
        is_complete = True
        for field in required_fields:
            if not getattr(instance, field):
                is_complete = False
                break
        
        # Check age requirement
        if is_complete and instance.age and instance.age >= 16:
            instance.is_profile_completed = True
        else:
            instance.is_profile_completed = False
        
        instance.save()
        return instance