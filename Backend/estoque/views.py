from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

#@csrf_exempt
#def somar_valores(request):
    #if request.method == "POST":
   #     data = json.loads(request.body)
  #      a = TabelaA.objects.create(valor=data["valor_a"])
 #       b = TabelaB.objects.create(valor=data["valor_b"])
#        soma = a.valor + b.valor
#        return JsonResponse({"valor_a": a.valor, "valor_b": b.valor, "soma": soma})
#    return JsonResponse({"erro": "Método não permitido"}, status=405)