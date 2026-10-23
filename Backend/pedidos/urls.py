from django.urls import path
from . import views
from .views import listar_pedidos, criar_pedido, obter_pedido, atualizar_pedido, fechar_pedido, cancelar_pedido

urlpatterns = [
    path("empresa/<int:id_empresa>/pedidos/", views.listar_pedidos),
    path("pedido/criar/", views.criar_pedido),
    path("pedido/<int:id_pedido>/", views.obter_pedido),
    path("pedido/<int:id_pedido>/atualizar/", views.atualizar_pedido),
    path("pedido/<int:id_pedido>/fechar/", views.fechar_pedido),
    path("pedido/<int:id_pedido>/cancelar/", views.cancelar_pedido),
]