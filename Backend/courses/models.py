from django.db import models

# Create your models here.
class Course(models.Model):
    title = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1000,blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    
    def __str__(self):
        return self.title
    
    
    
class Chapter(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='chapters'
    )
    title = models.CharField(max_length=150,unique=True)
    order = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta: 
        ordering = ['order']
        unique_together = ('course','order')
        
    def __str__(self):
        return f"{self.course.title} - {self.title}"
    
    
    
