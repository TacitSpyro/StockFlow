from django.urls import path
from .views import verificar_empresa

urlpatterns = [
    path('empresa/<int:id_empresa>/verificar/', verificar_empresa),
]