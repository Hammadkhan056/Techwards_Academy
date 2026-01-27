
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.core.validators import MinValueValidator, MaxValueValidator, MinLengthValidator


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""
    
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


class User(AbstractBaseUser, PermissionsMixin):
    
    
    ROLE_CHOICES = (
        ('STUDENT', 'Student'),
        ('ADMIN', 'Administrator'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    father_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    
    
    phone_verified = models.BooleanField(default=False)
    
    city = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=500, blank=True, null=True)
    age = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(120)]
    )
    
    phone = models.CharField(
        max_length=20, 
        null=True,
        blank=True,
        validators=[MinLengthValidator(7)]
    )
    
    education = models.CharField(max_length=200, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    
    is_profile_completed = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    objects = UserManager()
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
            models.Index(fields=['role']),
        ]
    
    def check_and_set_profile_completion(self):
        
        required_fields = ['name', 'age']
        
        # Check if all required fields are present and valid
        is_complete = True
        for field in required_fields:
            if not getattr(self, field):
                is_complete = False
                break
        
        # Check age requirement (must be 16 or older)
        if is_complete and self.age and self.age >= 16:
            self.is_profile_completed = True
        else:
            self.is_profile_completed = False
        
        # Don't save here - let the caller handle saving to avoid recursion
        return self.is_profile_completed
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
