from django.urls import path
from .views import listar_produtos

urlpatterns = [
    path('empresa/<int:id_empresa>/produtos/', listar_produtos),
]