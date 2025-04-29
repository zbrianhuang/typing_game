# typing_game/views.py
from django.shortcuts import render, get_object_or_404 # Added get_object_or_404
from .models import LyricSnippet
import random
from django.db.models import Q # Import Q for complex lookups

# Your existing list_songs function seems redundant if game_view is the main entry.
# Consider removing list_songs or clarifying its purpose.
# def list_songs(request):
#     render(request, 'typing_game/game.html') # This doesn't actually return the render result

def game_view(request, snippet_id=None):
    """
    Fetches a random OR specific lyric snippet and renders the typing game page.
    If snippet_id is provided, fetches that specific snippet.
    Otherwise, fetches a random one.
    """
    context = {'error': None, 'snippet': None}

    if snippet_id:
        # Get specific snippet or return 404 if not found
        snippet = get_object_or_404(LyricSnippet, pk=snippet_id)
        context['snippet'] = snippet
    else:
        # Original logic: Get a random snippet
        snippets = list(LyricSnippet.objects.all()) # Get all snippets
        if not snippets:
            # Handle case where database is empty
            context['error'] = "No lyric snippets found in the database. Please add some via the admin panel."
        else:
            random_snippet = random.choice(snippets) # Select one randomly
            context['snippet'] = random_snippet

    return render(request, 'typing_game/game.html', context)

def search_songs(request):
    """
    Searches for lyric snippets based on a query parameter (q).
    Searches song_title and artist fields.
    """
    query = request.GET.get('q', '') # Get the search query, default to empty string
    results = [] # Initialize empty list for results

    if query: # Only perform search if query is not empty
        results = LyricSnippet.objects.filter(
            Q(song_title__icontains=query) | # Case-insensitive contains search on title
            Q(artist__icontains=query)       # Case-insensitive contains search on artist
        ).distinct() # Use distinct() if searching lyrics could potentially match multiple times for the same snippet

    context = {
        'query': query,
        'results': results,
    }
    return render(request, 'typing_game/search_results.html', context)