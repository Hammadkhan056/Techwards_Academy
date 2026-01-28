from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from courses.models import Course, Chapter
from django.conf import settings

User = settings.AUTH_USER_MODEL


class Test(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
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
    duration_minutes = models.PositiveIntegerField()
    total_marks = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"
    
    def calculate_total_marks(self):
        """Calculate total marks from all questions"""
        return self.questions.aggregate(total=models.Sum('marks'))['total'] or 0
    
    def save(self, *args, **kwargs):
        if self.pk:
            self.total_marks = self.calculate_total_marks()
        super().save(*args, **kwargs)


class Question(models.Model):
    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    text = models.TextField()
    marks = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
        unique_together = ['test', 'order']
    
    def __str__(self):
        return f"Q{self.order}: {self.text[:50]}"


class AnswerOption(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options'
    )
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["question"],
                condition=models.Q(is_correct=True),
                name="one_correct_option_per_question"
            )
        ]
    
    def clean(self):
        if self.is_correct and self.question and self.question.pk:
            exists = AnswerOption.objects.filter(
                question=self.question,
                is_correct=True,
            ).exclude(pk=self.pk).exists()
            
            if exists:
                raise ValidationError(
                    "Only one correct answer is allowed per question."
                )
    
    def __str__(self):
        return f"{self.text} ({'Correct' if self.is_correct else 'Wrong'})"


class TestAssignment(models.Model):
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('started', 'Started'),
        ('submitted', 'Submitted'),
        ('evaluated', 'Evaluated'),
        ('cancelled', 'Cancelled'),
    ]
    
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='test_assignments'
    )
    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    attempt_number = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='assigned'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    evaluated_at = models.DateTimeField(null=True, blank=True)
    
    # Marks
    obtained_marks = models.PositiveIntegerField(null=True, blank=True)
    total_marks = models.PositiveIntegerField(null=True, blank=True)
    percentage = models.FloatField(null=True, blank=True)
    
    class Meta:
        ordering = ['-assigned_at']
        unique_together = ['student', 'test', 'attempt_number']
    
    def __str__(self):
        return f"{self.student.name} - {self.test.title} (Attempt {self.attempt_number})"
    
    def calculate_percentage(self):
        """Calculate percentage based on obtained and total marks"""
        if self.obtained_marks is not None and self.total_marks and self.total_marks > 0:
            return round((self.obtained_marks / self.total_marks) * 100, 2)
        return None


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
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['assignment', 'question']
    
    def __str__(self):
        return f"{self.assignment.student.name} - Q{self.question.order} - {'Correct' if self.is_correct else 'Wrong'}"
