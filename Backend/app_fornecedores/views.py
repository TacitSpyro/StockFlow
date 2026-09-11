from django.shortcuts import render
from app_fornecedores import Fornecedor
# Create your views here.

fornecedor = Fornecedor.objects.all()
