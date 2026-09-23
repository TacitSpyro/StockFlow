from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Produto, CatalogoProduto
from .serializers import ProdutoSerializer
from django.utils import timezone
from app_empresas.models import Empresa
from app_fornecedores.models import Fornecedor
from app_admin.models import Admin

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

@api_view(['POST'])
def criar_produto(request):
    dados = request.data

    obrigatorios = ["catalogo", "fornecedor", "lote", "situacao", "data_fabricacao", "id_empresa"]
    faltando = [c for c in obrigatorios if not dados.get(c)]
    if faltando:
        return Response({"erro": f"Campos obrigatórios faltando: {', '.join(faltando)}"}, status=400)

    try:
        empresa = Empresa.objects.get(id_empresa=dados["id_empresa"])
        catalogo = CatalogoProduto.objects.get(id=dados["catalogo"])
        fornecedor = Fornecedor.objects.get(id_fornecedor=dados["fornecedor"])
    except (Empresa.DoesNotExist, CatalogoProduto.DoesNotExist, Fornecedor.DoesNotExist):
        return Response({"erro": "Empresa, catálogo ou fornecedor não encontrado"}, status=404)

    admin = None
    if dados.get("id_admin"):
        admin = Admin.objects.filter(id_admin=dados["id_admin"]).first()

    data_encerramento = dados.get("data_encerramento") or None

    produto = Produto(
        catalogo=catalogo,
        fornecedor=fornecedor,
        lote=dados["lote"],
        empresa=empresa,
        estoque_atual=dados.get("estoque_atual") or 0,
        estoque_capacidade=dados.get("estoque_capacidade") or 0,
        situacao=dados["situacao"],
        data_fabricacao=dados["data_fabricacao"],
        ala=dados.get("ala", ""),
        secao=dados.get("secao", ""),
        prateleira=dados.get("prateleira", ""),
        descricao=dados.get("descricao", ""),
        cadastrado_por=admin,
    )

    if data_encerramento:
        produto.data_encerramento = data_encerramento

    produto.save()

    return Response({
        "id": produto.id,
        "lote": produto.lote,
        "situacao": produto.situacao,
        "data_encerramento": produto.data_encerramento,
    }, status=201)
