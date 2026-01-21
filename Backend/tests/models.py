from django.db import models
from django.conf import settings
from courses.models import Course, Chapter
# Create your models here.
class Test(models.Model): 
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='tests'
    )
    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    title = models.CharField(max_length=255)
    total_marks = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    
    def __str__(self):
        return self.title
    
    
    
class Question(models.Model):
    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name='questions'
        
    )
    text = models.TextField()
    marks = models.PositiveIntegerField(default=1)
    
    
    def __str__(self):
        return self.text[:50]
    

class AnswerOption(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name = 'options'
    )
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    
    
    def __str__(self):
        return self.text
    
    
    
    
    
    
    


User = settings.AUTH_USER_MODEL

class TestAssignment(models.Model):

    STATUS_CHOICES = (
        ('assigned', 'Assigned'),
        ('started', 'Started'),
        ('submitted', 'Submitted'),
        ('evaluated', 'Evaluated'),
    )

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assigned_tests'
    )

    test = models.ForeignKey(
        'Test',
        on_delete=models.CASCADE,
        related_name='assignments'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='assigned'
    )

    obtained_marks = models.PositiveIntegerField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    assigned_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('student', 'test')

    def __str__(self):
        return f"{self.student} - {self.test}"




class StudentAnswer(models.Model):
    assignment = models.ForeignKey(
        TestAssignment,
        on_delete=models.CASCADE,
        related_name='student_answers'
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE
    )

    selected_option = models.ForeignKey(
        AnswerOption,
        on_delete=models.CASCADE
    )

    is_correct = models.BooleanField(default=False)
    marks_obtained = models.PositiveIntegerField(default=0)

    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('assignment', 'question')

    def __str__(self):
        return f"{self.assignment.student} - Q{self.question.id}"
