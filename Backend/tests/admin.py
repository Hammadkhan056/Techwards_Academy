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

@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'chapter', 'total_marks', 'is_active', 'created_at')
    list_filter = ('is_active', 'course', 'created_at')
    search_fields = ('title', 'course__title')
    readonly_fields = ('created_at',)
    inlines = [QuestionInline]
    fieldsets = (
        ('Test Info', {'fields': ('course', 'chapter', 'title')}),
        ('Marks', {'fields': ('total_marks',)}),
        ('Status', {'fields': ('is_active',)}),
        ('Timestamps', {'fields': ('created_at',)}),
    )

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
    list_display = ('student', 'test', 'attempt_number', 'status', 'obtained_marks', 'total_marks', 'evaluated_at')
    list_filter = ('status', 'attempt_number', 'assigned_at', 'evaluated_at')
    search_fields = ('student__email', 'student__name', 'test__title')
    readonly_fields = ('assigned_at', 'started_at', 'submitted_at', 'evaluated_at', 'created_at', 'updated_at')
    fieldsets = (
        ('Assignment Info', {'fields': ('student', 'test', 'attempt_number')}),
        ('Test Version', {'fields': ('test_version',)}),
        ('Results', {'fields': ('obtained_marks', 'total_marks', 'status')}),
        ('Dates', {'fields': ('due_at',)}),
        ('Timestamps', {'fields': ('assigned_at', 'started_at', 'submitted_at', 'evaluated_at', 'created_at', 'updated_at')}),
    )

@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'question', 'is_correct', 'marks_obtained', 'question_marks', 'evaluated_at')
    list_filter = ('is_correct', 'assignment__test', 'answered_at', 'evaluated_at')
    search_fields = ('assignment__student__email', 'question__text')
    readonly_fields = ('assignment', 'question', 'selected_option', 'answered_at', 'evaluated_at')
    fieldsets = (
        ('Assignment', {'fields': ('assignment', 'question')}),
        ('Answer', {'fields': ('selected_option',)}),
        ('Evaluation', {'fields': ('is_correct', 'marks_obtained', 'question_marks')}),
        ('Timestamps', {'fields': ('answered_at', 'evaluated_at')}),
    )
