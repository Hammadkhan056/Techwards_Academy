from django.db import models
from django.conf import settings
# Create your models here.
User = settings.AUTH_USER_MODEL

class Teacher(models.Model):
    user = models.OneToOneField(User,on_delete=models.CASCADE,related_name="teacher_profile")
    full_name = models.CharField(max_length=100)
    expertise = models.CharField(max_length=200)
    experience_years = models.PositiveIntegerField()
    qualification = models.CharField(max_length=200)
    bio = models.TextField(blank=True)
    profile_completed = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    
    def __str__(self):
        return f"Teacher : {self.full_name}"
    
    
    