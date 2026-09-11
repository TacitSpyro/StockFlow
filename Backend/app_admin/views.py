from django.shortcuts import render
from app_admin import Admin

# Create your views here.

admin = Admin.objects.all()
