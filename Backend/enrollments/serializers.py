from rest_framework import serializers
from .models import Enrollment
from courses.models import Course


class EnrollmentCreateSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    
    def validate_course_id(self, value):
        if not Course.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Course not found or inactive.")
        return value 
    
    

class MyCourseSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = ['id', 'course_title', 'status', 'enrolled_at']