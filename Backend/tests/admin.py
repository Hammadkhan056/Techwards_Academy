from django.contrib import admin
from .models import Test, Question, AnswerOption, TestAssignment, StudentAnswer

# Register your models here.

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ('text', 'marks')

class AnswerOptionInline(admin.TabularInline):
    model = AnswerOption
    extra = 1
    fields = ('text', 'is_correct')
    min_num = 2  # Require at least 2 options
    
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        formset.validate_min = True
        return formset

@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'chapter', 'duration_minutes', 'total_marks', 'is_published', 'is_active', 'created_at')
    list_filter = ('is_active', 'is_published', 'course', 'created_at')
    search_fields = ('title', 'course__title')
    readonly_fields = ('created_at', 'updated_at', 'calculate_total_marks')
    inlines = [QuestionInline]
    fieldsets = (
        ('Test Info', {'fields': ('course', 'chapter', 'title', 'description')}),
        ('Test Settings', {'fields': ('duration_minutes', 'total_marks', 'is_published', 'is_active')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'calculate_total_marks')}),
    )
    
    def calculate_total_marks(self, obj):
        """Display calculated total marks from questions"""
        calculated = obj.calculate_total_marks()
        return f"Calculated: {calculated} | Current: {obj.total_marks}"
    calculate_total_marks.short_description = 'Total Marks Verification'

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'test', 'marks')
    list_filter = ('test', 'marks')
    search_fields = ('text', 'test__title')
    inlines = [AnswerOptionInline]

@admin.register(AnswerOption)
class AnswerOptionAdmin(admin.ModelAdmin):
    list_display = ('text', 'question', 'is_correct')
    list_filter = ('is_correct',)
    search_fields = ('text', 'question__text')

@admin.register(TestAssignment)
class TestAssignmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'test', 'attempt_number', 'status', 'obtained_marks', 'total_marks', 'submitted_at')
    list_filter = ('status', 'attempt_number', 'assigned_at', 'submitted_at')
    search_fields = ('student__email', 'student__name', 'test__title')
    readonly_fields = ('assigned_at', 'started_at', 'submitted_at', 'evaluated_at')
    fieldsets = (
        ('Assignment Info', {'fields': ('student', 'test', 'attempt_number')}),
        ('Results', {'fields': ('obtained_marks', 'total_marks', 'status')}),
        ('Timestamps', {'fields': ('assigned_at', 'started_at', 'submitted_at', 'evaluated_at')}),
    )

@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'question', 'is_correct', 'marks_obtained', 'created_at')
    list_filter = ('is_correct', 'assignment__test', 'created_at')
    search_fields = ('assignment__student__email', 'question__text')
    readonly_fields = ('assignment', 'question', 'selected_option', 'created_at')
    fieldsets = (
        ('Assignment', {'fields': ('assignment', 'question')}),
        ('Answer', {'fields': ('selected_option',)}),
        ('Evaluation', {'fields': ('is_correct', 'marks_obtained')}),
        ('Timestamps', {'fields': ('created_at',)}),
    )
