from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import TestAssignment

@admin.register(TestAssignment)
class TestAssignmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'test', 'status', 'obtained_marks')
    list_filter = ('status',)
