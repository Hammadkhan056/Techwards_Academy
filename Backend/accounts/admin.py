from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.contrib.admin.exceptions import NotRegistered
from .models import User

# Unregister the default LogEntry to avoid the UUID/BigInt mismatch
try:
    admin.site.unregister(LogEntry)
except NotRegistered:
    pass

# Custom admin for LogEntry that handles UUID properly
@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    list_display = ('action_time', 'user', 'content_type', 'action_flag')
    list_filter = ('action_flag', 'content_type')
    search_fields = ('user__email', 'change_message')
    readonly_fields = ('action_time', 'user', 'content_type', 'object_id', 'object_repr', 'action_flag', 'change_message')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

# Register your models here.
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'is_staff', 'is_superuser', 'created_at')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'created_at')
    search_fields = ('email', 'name')
    fieldsets = (
        ('Personal Info', {'fields': ('id', 'email', 'name', 'father_name')}),
        ('Contact Info', {'fields': ('phone_number', 'city', 'address', 'age')}),
        ('Role & Profile', {'fields': ('role', 'is_profile_completed')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ('id', 'created_at', 'updated_at')

