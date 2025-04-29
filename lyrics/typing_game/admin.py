# typing_game/admin.py
from django.contrib import admin
from .models import LyricSnippet

@admin.register(LyricSnippet)
class LyricSnippetAdmin(admin.ModelAdmin):
    # Add 'youtube_url' to the list display
    list_display = ('song_title', 'artist', 'lyrics_preview', 'yt_id', 'created_at')
    search_fields = ('song_title', 'artist', 'lyrics')
    list_filter = ('artist',)
    # The youtube_url field will automatically appear in the add/change forms

    def lyrics_preview(self, obj):
        # Show a preview of the lyrics in the admin list
        return obj.lyrics[:75] + '...' if len(obj.lyrics) > 75 else obj.lyrics
    lyrics_preview.short_description = 'Lyrics Preview'