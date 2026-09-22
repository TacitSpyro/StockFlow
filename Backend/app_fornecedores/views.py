from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Fornecedor
from .serializers import FornecedorSerializer

import requests
from django.http import JsonResponse


def consultar_cep(request, cep):
    cep_limpo = "".join(filter(str.isdigit, cep))

    if len(cep_limpo) != 8:
        return JsonResponse({"erro": "CEP inválido"}, status=400)

    resposta = requests.get(f"https://viacep.com.br/ws/{cep_limpo}/json/", timeout=5)

    if resposta.status_code != 200:
        return JsonResponse({"erro": "Erro ao consultar CEP"}, status=502)

    dados = resposta.json()

    if dados.get("erro"):
        return JsonResponse({"erro": "CEP não encontrado"}, status=404)

    return JsonResponse({
        "logradouro": dados.get("logradouro", ""),
        "bairro": dados.get("bairro", ""),
        "cidade": dados.get("localidade", ""),
        "uf": dados.get("uf", ""),
    })

@api_view(['GET'])
def listar_fornecedores(request, id_empresa):
    fornecedores = Fornecedor.objects.filter(empresa_id=id_empresa)
    serializer = FornecedorSerializer(fornecedores, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def catalogo_do_fornecedor(request, id_fornecedor):
    try:
        fornecedor = Fornecedor.objects.get(id_fornecedor=id_fornecedor)
    except Fornecedor.DoesNotExist:
        return Response({"erro": "Fornecedor não encontrado"}, status=404)

    catalogo = fornecedor.produtos.all()  # os CatalogoProduto vinculados a ele
    data = [{"id": p.id, "nome": p.nome} for p in catalogo]
    return Response(data)
