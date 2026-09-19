from django.urls import path
from . import views
from .views import listar_fornecedores

urlpatterns = [
    path("cep/<str:cep>/", views.consultar_cep, name="consultar_cep"),
    path('empresa/<int:id_empresa>/fornecedores/', listar_fornecedores),
]