from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from app_produtos import Produto

produtos = Produto.objects.all()
