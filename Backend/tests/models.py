from pyexpat import model
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from courses.models import Course, Chapter

User = settings.AUTH_USER_MODEL


class Test(models.Model):

    
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
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True, help_text="Duration in minutes for timed tests")
    total_marks = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    is_published = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['course', 'is_active']),
            models.Index(fields=['is_published']),
        ]
        verbose_name = 'Test'
        verbose_name_plural = 'Tests'
    
    def __str__(self):
        return self.title
    
    def calculate_total_marks(self):
        """Calculate total marks from all questions"""
        return self.questions.aggregate(total_marks=models.Sum('marks'))['total_marks'] or 0
    
    def save(self, *args, **kwargs):
        """Update total_marks when saving"""
        super().save(*args, **kwargs)
        # Recalculate total marks from questions
        calculated_marks = self.calculate_total_marks()
        if calculated_marks != self.total_marks:
            self.total_marks = calculated_marks
            super().save(update_fields=['total_marks'])


class Question(models.Model):

    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name='questions'
    )

    text = models.TextField()
    marks = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = 'Question'
        verbose_name_plural = 'Questions'

    def __str__(self):
        return f"{self.test.title} | Q{self.order}"



class AnswerOption(models.Model):
    
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE, 
        related_name='options'
    )
    
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'Answer Option'
        verbose_name_plural = 'Answer Options'
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
        return self.text


class TestAssignment(models.Model):
 

    STATUS_ASSIGNED = "assigned"
    STATUS_STARTED = "started"
    STATUS_SUBMITTED = "submitted"
    STATUS_EVALUATED = "evaluated"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = (
        (STATUS_ASSIGNED, "Assigned"),
        (STATUS_STARTED, "Started"),
        (STATUS_SUBMITTED, "Submitted"),
        (STATUS_EVALUATED, "Evaluated"),
        (STATUS_CANCELLED, "Cancelled"),
    )

    student = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="test_assignments"
    )

    test = models.ForeignKey(
        Test,
        on_delete=models.PROTECT,
        related_name="assignments"
    )

    attempt_number = models.PositiveSmallIntegerField(default=1)
    test_version = models.PositiveIntegerField(default=1)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ASSIGNED
    )

    obtained_marks = models.PositiveIntegerField(null=True, blank=True)
    total_marks = models.PositiveIntegerField(null=True, blank=True)

    assigned_at = models.DateTimeField(default=timezone.now)
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    evaluated_at = models.DateTimeField(null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "test", "attempt_number")
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["test", "status"]),
            models.Index(fields=["assigned_at"]),
        ]
        verbose_name = "Test Assignment"
        verbose_name_plural = "Test Assignments"

    def __str__(self):
        return f"{self.student} | {self.test} | Attempt {self.attempt_number}"



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
            models.Index(fields=['assignment']),
            models.Index(fields=['question']),
            
        ]
        verbose_name = 'Student Answer'
        verbose_name_plural = 'Student Answers'
    
    def clean(self):
        if self.selected_option.question_id != self.question_id:
            raise ValidationError(
                "Selected option does not belong to this question."
            )

    def __str__(self):
        return f"{self.assignment.student} - Q{self.question.id}"
