from django.shortcuts import render

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Relatorio
from app_produtos.models import Produto
from app_fornecedores.models import Fornecedor


def montar_dados_produtos(produtos):
    return {
        "total": produtos.count(),
        "ativo": produtos.filter(situacao="ATIVO").count(),
        "inspecao": produtos.filter(situacao="INSPECAO").count(),
        "bloqueio": produtos.filter(situacao="BLOQUEIO").count(),
        "encerrado": produtos.filter(situacao="ENCERRADO").count(),
    }


def montar_dados_fornecedores(fornecedores):
    return {
        "total": fornecedores.count(),
        "ativos": fornecedores.filter(ativo=True).count(),
        "inativos": fornecedores.filter(ativo=False).count(),
    }


@api_view(['POST'])
def gerar_relatorio(request):
    dados_req = request.data

    id_empresa = dados_req.get("id_empresa")
    tipo = dados_req.get("tipo")  # "TODOS", "FORNECEDOR" ou "PRODUTO"
    id_admin = dados_req.get("id_admin")
    periodo_inicio = dados_req.get("periodo_inicio")  # opcional, "YYYY-MM-DD"
    periodo_fim = dados_req.get("periodo_fim")        # opcional

    if not id_empresa or tipo not in Relatorio.Tipo.values:
        return Response({"erro": "Empresa e tipo são obrigatórios"}, status=400)

    produtos = Produto.objects.filter(empresa_id=id_empresa)
    fornecedores = Fornecedor.objects.filter(empresa_id=id_empresa)

    # Filtro de período (aplica na data de fabricação dos produtos,
    # e na data de cadastro dos fornecedores)
    if periodo_inicio:
        produtos = produtos.filter(data_fabricacao__gte=periodo_inicio)
        fornecedores = fornecedores.filter(data_cadastro__gte=periodo_inicio)

    if periodo_fim:
        produtos = produtos.filter(data_fabricacao__lte=periodo_fim)
        fornecedores = fornecedores.filter(data_cadastro__lte=periodo_fim)

    # Monta os dados de acordo com o tipo escolhido
    dados = {}
    if tipo == Relatorio.Tipo.PRODUTO:
        dados = {"produtos": montar_dados_produtos(produtos)}
    elif tipo == Relatorio.Tipo.FORNECEDOR:
        dados = {"fornecedores": montar_dados_fornecedores(fornecedores)}
    elif tipo == Relatorio.Tipo.TODOS:
        dados = {
            "produtos": montar_dados_produtos(produtos),
            "fornecedores": montar_dados_fornecedores(fornecedores),
        }

    relatorio = Relatorio.objects.create(
        empresa_id=id_empresa,
        tipo=tipo,
        gerado_por_id=id_admin,
        periodo_inicio=periodo_inicio or None,
        periodo_fim=periodo_fim or None,
        dados=dados,
    )

    return Response({
        "id": relatorio.id,
        "tipo": relatorio.tipo,
        "data_geracao": relatorio.data_geracao,
        "periodo_inicio": relatorio.periodo_inicio,
        "periodo_fim": relatorio.periodo_fim,
        "dados": relatorio.dados,
    }, status=201)


@api_view(['GET'])
def listar_relatorios(request, id_empresa):
    tipo = request.GET.get("tipo")  # filtro opcional por tipo

    relatorios = Relatorio.objects.filter(empresa_id=id_empresa)
    if tipo:
        relatorios = relatorios.filter(tipo=tipo)

    data = [
        {
            "id": r.id,
            "tipo": r.tipo,
            "data_geracao": r.data_geracao,
            "periodo_inicio": r.periodo_inicio,
            "periodo_fim": r.periodo_fim,
            "dados": r.dados,
            "gerado_por": r.gerado_por.nome_admin if r.gerado_por else None,
        }
        for r in relatorios
    ]
    return Response(data)

@api_view(['GET'])
def obter_relatorio(request, id_relatorio):
    try:
        r = Relatorio.objects.get(id=id_relatorio)
    except Relatorio.DoesNotExist:
        return Response({"erro": "Relatório não encontrado"}, status=404)

    return Response({
        "id": r.id,
        "tipo": r.tipo,
        "data_geracao": r.data_geracao,
        "periodo_inicio": r.periodo_inicio,
        "periodo_fim": r.periodo_fim,
        "dados": r.dados,
        "gerado_por": r.gerado_por.nome_admin if r.gerado_por else None,
    })