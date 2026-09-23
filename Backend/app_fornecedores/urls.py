from django.urls import path
from . import views
from .views import listar_fornecedores,criar_fornecedor

urlpatterns = [
    path("cep/<str:cep>/", views.consultar_cep, name="consultar_cep"),
    path('empresa/<int:id_empresa>/fornecedores/', listar_fornecedores),
    path('empresa/<int:id_empresa>/fornecedores/', listar_fornecedores),
    path('fornecedor/criar/', criar_fornecedor),
]