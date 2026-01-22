from django.db import models
from django.conf import settings
from django.utils import timezone
from courses.models import Course, Chapter

User = settings.AUTH_USER_MODEL


class Test(models.Model):
    """
    Represents a test/quiz for a course.
    
    DELETION POLICY: Use PROTECT - cannot delete tests with student submissions
    - If you need to disable a test, set is_active=False
    - Preserves all student submissions and grades
    """
    
    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT, 
        related_name='tests'
    )
    
    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='tests'
    )
    
    title = models.CharField(max_length=255)
    total_marks = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['course', 'is_active']),
            models.Index(fields=['is_active']),
        ]
        verbose_name = 'Test'
        verbose_name_plural = 'Tests'
    
    def __str__(self):
        return self.title


class Question(models.Model):
    
    test = models.ForeignKey(
        Test,
        on_delete=models.PROTECT,
        related_name='questions'
    )
    
    text = models.TextField()
    marks = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'Question'
        verbose_name_plural = 'Questions'
    
    def __str__(self):
        return f"{self.test.title} - {self.text[:50]}"


class AnswerOption(models.Model):
    
    question = models.ForeignKey(
        Question,
        on_delete=models.PROTECT, 
        related_name='options'
    )
    
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'Answer Option'
        verbose_name_plural = 'Answer Options'
    
    def __str__(self):
        return f"{self.question.text[:30]} - {self.text}"


class TestAssignment(models.Model):
   
    
    STATUS_CHOICES = (
        ('assigned', 'Assigned'),
        ('started', 'Started'),
        ('submitted', 'Submitted'),
        ('evaluated', 'Evaluated'),
        ('cancelled', 'Cancelled'), 
    )

    student = models.ForeignKey(
        User,
        on_delete=models.PROTECT, 
        related_name='test_assignments'
    )

    test = models.ForeignKey(
        'Test',
        on_delete=models.PROTECT, 
        related_name='assignments'
    )

    attempt_number = models.PositiveSmallIntegerField(default=1)
    
    # IMPROVED: Track test version (in case test content changed)
    test_version = models.PositiveIntegerField(default=1)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='assigned'
    )
    obtained_marks = models.PositiveIntegerField(null=True, blank=True)
    total_marks = models.PositiveIntegerField(null=True, blank=True)
    
    is_completed = models.BooleanField(default=False)
    assigned_at = models.DateTimeField(default=timezone.now)
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    evaluated_at = models.DateTimeField(null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'test', 'attempt_number') 
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['test', 'status']),
            models.Index(fields=['assigned_at']),
            models.Index(fields=['student', 'test']),
        ]
        verbose_name = 'Test Assignment'
        verbose_name_plural = 'Test Assignments'

    def __str__(self):
        return f"{self.student.name} - {self.test.title} (Attempt {self.attempt_number})"


class StudentAnswer(models.Model):
    
    assignment = models.ForeignKey(
        TestAssignment,
        on_delete=models.CASCADE, 
        related_name='answers'
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.PROTECT, 
        related_name='student_answers'
    )

    selected_option = models.ForeignKey(
        AnswerOption,
        on_delete=models.PROTECT,  
        related_name='selected_by_students'
    )
    is_correct = models.BooleanField(default=False)
    marks_obtained = models.PositiveIntegerField(default=0)
    question_marks = models.PositiveIntegerField(default=1)
    answered_at = models.DateTimeField(default=timezone.now)
    evaluated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('assignment', 'question')
        indexes = [
            models.Index(fields=['assignment', 'is_correct']),
            models.Index(fields=['question', 'is_correct']),
            models.Index(fields=['answered_at']),
        ]
        verbose_name = 'Student Answer'
        verbose_name_plural = 'Student Answers'

    def __str__(self):
        return f"{self.assignment.student.name} - Q{self.question.id}"
