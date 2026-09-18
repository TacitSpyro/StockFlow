from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Empresa

@api_view(['GET'])
def verificar_empresa(request, id_empresa):
    try:
        empresa = Empresa.objects.get(id_empresa=id_empresa)
        return Response({
            "existe": True,
            "nome_fantasia": empresa.nome_fantasia_emp
        })
    except Empresa.DoesNotExist:
        return Response({"existe": False}, status=404)