from rest_framework import serializers
from .models import Teacher

class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = [
            "id",
            "full_name",
            "expertise",
            "experience_years",
            "qualification",
            "bio",
            "profile_completed",
            "is_verified"
        ]
        read_only_fields = ["profile_completed","is_verified"]
        
        
    
class TeacherProflieUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = [
            "full_name"
            "expertise",
            "experience_years",
            "qualification",
            "bio",
        ]
        
    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        
        required_fields = [
            instance.full_name, 
            instance.expertise,
            instance.experience_years,
            instance.qualification,
        ]
        
        instance.profile_completed = all(required_fields)
        instance.save()
        return instance