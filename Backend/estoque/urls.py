from django.urls import path
from . import views

urlpatterns = [
    path("somar/", views.somar_valores),
]