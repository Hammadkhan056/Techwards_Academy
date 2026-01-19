
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, password, **extra_fields)

# Create your models here.
class User(AbstractBaseUser, PermissionsMixin): 
    ROLE_CHOICES = (
        ('STUDENT', 'student'),
    )
    stu_id = models.UUIDField()
    # stu_id = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=100)
    father_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES,default='STUDENT')
    is_profile_completed = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    city = models.CharField(max_length=50,blank=True,null=True)
    phone_number = models.CharField(max_length=11, null=True, blank=True)
    age = models.CharField(max_length=2, null=True, blank=True)
    address = models.CharField(max_length=500, null=True, blank=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    objects = UserManager()
    
    def __str__(self):
        return f"{self.email} - {self.stu_id}"
    
