from django.urls import path

from . import views

urlpatterns =[
    path('header/', views.home, name='home')
]