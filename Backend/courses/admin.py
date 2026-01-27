from django.contrib import admin
from .models import Course, Chapter, VideoLecture, AdminNote, StudentNote

# Register your models here.
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'thumbnail_preview', 'is_active', 'created_at', 'archived_at')
    list_filter = ('is_active', 'created_at', 'archived_at')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at', 'archived_at', 'archived_by', 'thumbnail_preview')
    fieldsets = (
        ('Course Info', {'fields': ('title', 'description', 'thumbnail')}),
        ('Status', {'fields': ('is_active',)}),
        ('Soft Delete', {'fields': ('archived_at', 'archived_by')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    def thumbnail_preview(self, obj):
        if obj.thumbnail:
            return f'<img src="{obj.thumbnail.url}" width="50" height="50" style="object-fit: cover;" />'
        return "No image"
    thumbnail_preview.short_description = 'Thumbnail'
    thumbnail_preview.allow_tags = True

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'created_at')
    list_filter = ('course', 'created_at')
    search_fields = ('title', 'course__title')
    ordering = ('course', 'order')
    readonly_fields = ('created_at',)


# ============================================================================
# VIDEO LECTURE ADMIN
# ============================================================================

@admin.register(VideoLecture)
class VideoLectureAdmin(admin.ModelAdmin):
    list_display = ('title', 'chapter', 'order', 'is_published', 'created_at')
    list_filter = ('is_published', 'chapter__course', 'created_at')
    search_fields = ('title', 'chapter__title', 'chapter__course__title')
    ordering = ('chapter', 'order')
    readonly_fields = ('created_at', 'updated_at', 'get_youtube_id', 'get_embed_url')
    
    fieldsets = (
        ('Video Info', {'fields': ('title', 'description', 'chapter', 'order')}),
        ('YouTube', {'fields': ('youtube_url', 'get_youtube_id', 'get_embed_url')}),
        ('Metadata', {'fields': ('is_published',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    list_editable = ('is_published',)


# ============================================================================
# ADMIN NOTE ADMIN
# ============================================================================

@admin.register(AdminNote)
class AdminNoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'chapter', 'note_type', 'created_by', 'created_at')
    list_filter = ('note_type', 'chapter__course', 'created_at')
    search_fields = ('title', 'content', 'chapter__title')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'get_file_name', 'get_file_size')
    
    fieldsets = (
        ('Note Info', {'fields': ('title', 'chapter', 'note_type')}),
        ('Content', {'fields': ('content', 'file')}),
        ('File Info', {'fields': ('get_file_name', 'get_file_size'), 'classes': ('collapse',)}),
        ('Metadata', {'fields': ('created_by', 'created_at', 'updated_at')}),
    )
    
    def save_model(self, request, obj, form, change):
        """Auto-set created_by on creation"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# ============================================================================
# STUDENT NOTE ADMIN
# ============================================================================

@admin.register(StudentNote)
class StudentNoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'student', 'chapter', 'video', 'updated_at')
    list_filter = ('chapter__course', 'chapter', 'updated_at')
    search_fields = ('title', 'content', 'student__name', 'student__email')
    readonly_fields = ('created_at', 'updated_at', 'student')
    
    fieldsets = (
        ('Note Info', {'fields': ('title', 'content')}),
        ('Association', {'fields': ('student', 'chapter', 'video')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make student read-only after creation"""
        if obj:  # editing an existing object
            return self.readonly_fields
        return []  # allow setting on creation
    
    def get_queryset(self, request):
        """Admin can see all, students only their own (if allowed)"""
        qs = super().get_queryset(request)
        if request.user.role == 'STUDENT':
            qs = qs.filter(student=request.user)
        return qs
