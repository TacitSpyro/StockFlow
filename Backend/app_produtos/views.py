from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Produto
from .serializers import ProdutoSerializer

@api_view(['GET'])
def listar_produtos(request, id_empresa):
    produtos = Produto.objects.filter(empresa_id=id_empresa)
    serializer = ProdutoSerializer(produtos, many=True)
    return Response(serializer.data)