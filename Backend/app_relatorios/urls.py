from django.urls import path
from .views import gerar_relatorio, listar_relatorios, obter_relatorio

urlpatterns = [
    path('relatorio/gerar/', gerar_relatorio),
    path('empresa/<int:id_empresa>/relatorios/', listar_relatorios),
    path('relatorio/<int:id_relatorio>/', obter_relatorio),
]