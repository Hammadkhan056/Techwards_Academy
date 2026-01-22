# from django.contrib import admin
# from .models import Teacher

# # Register your models here.
# @admin.register(Teacher)
# class TeacherAdmin(admin.ModelAdmin):
#     list_display = ('full_name', 'expertise', 'experience_years', 'is_verified', 'profile_completed')
#     list_filter = ('is_verified', 'profile_completed', 'created_at')
#     search_fields = ('full_name', 'expertise', 'user__email')
#     readonly_fields = ('created_at', 'updated_at')
#     fieldsets = (
#         ('Personal Info', {'fields': ('user', 'full_name')}),
#         ('Professional Info', {'fields': ('expertise', 'experience_years', 'qualification', 'bio')}),
#         ('Status', {'fields': ('profile_completed', 'is_verified')}),
#         ('Timestamps', {'fields': ('created_at', 'updated_at')}),
#     )
