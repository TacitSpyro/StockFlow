from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Produto, CatalogoProduto
from .serializers import ProdutoSerializer

@api_view(['GET'])
def listar_produtos(request, id_empresa):
    produtos = Produto.objects.filter(empresa_id=id_empresa)
    serializer = ProdutoSerializer(produtos, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def listar_catalogo(request, id_empresa):
    catalogo = CatalogoProduto.objects.filter(empresa_id=id_empresa)
    data = [{"id": c.id, "nome": c.nome} for c in catalogo]
    return Response(data)


@api_view(['POST'])
def criar_catalogo(request):
    nome = request.data.get("nome")
    id_empresa = request.data.get("id_empresa")

    if not nome or not id_empresa:
        return Response({"erro": "Nome e empresa são obrigatórios"}, status=400)

    catalogo, criado = CatalogoProduto.objects.get_or_create(
        nome=nome.strip(),
        empresa_id=id_empresa,
    )
    return Response({"id": catalogo.id, "nome": catalogo.nome, "criado": criado})
