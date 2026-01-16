from django.db import models
import uuid
from django.contrib.auth.models import AbstractUser
# Create your models here.
class User(AbstractUser): 
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50,null=False,blank=False)
    username = models.CharField(unique=True,max_length=50,  help_text="Unique username for login")
    email = models.EmailField(unique=True,blank=False, null=False, help_text="User's email address")
    phone_number = models.CharField(max_length=13,unique=True, help_text="User phone number")
    father_name = models.CharField(max_length=50, null=True, blank=True)
    address = models.CharField(max_length=200, null=True,blank=True)
    city = models.CharField(max_length=20, null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_student = models.BooleanField(default=True)
    dob = models.DateField(null=True, blank=True)
    
    
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["phone_number","name","username"]
    
    
    class Meta: 
        ordering= ['-date_joined']
        verbose_name = "User"
        verbose_name_plural = "Users"
        
    def __str__(self): 
        return self.email
    
    
    