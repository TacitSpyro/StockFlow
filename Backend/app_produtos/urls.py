from django.urls import path
from .views import listar_produtos, listar_catalogo,criar_catalogo,criar_produto

urlpatterns = [
    path('empresa/<int:id_empresa>/produtos/', listar_produtos),
    path('empresa/<int:id_empresa>/produtos/', listar_produtos),
    path('empresa/<int:id_empresa>/catalogo/', listar_catalogo),
    path('catalogo/criar/', criar_catalogo),
    path('produto/criar/', criar_produto),
]