# typing_game/urls.py
from django.urls import path
from . import views

app_name = 'typing_game' # Define an app namespace for clarity

urlpatterns = [
    # URL for the main game view (random snippet)
    path('game/', views.game_view, name='game_view_random'),

    # URL for playing a specific snippet (e.g., from search results)
    path('game/<int:snippet_id>/', views.game_view, name='game_view_specific'),

    # URL for the search results page
    path('search/', views.search_songs, name='search_songs'),

    # Optional: Make the root of the app redirect to the random game
    path('', views.game_view, name='game_home'),
]