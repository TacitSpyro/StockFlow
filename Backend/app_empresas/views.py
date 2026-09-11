from django.shortcuts import render
from app_empresas import Empresa
# Create your views here.

empresa = Empresa.objects.all()
