import re
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Fornecedor
from .serializers import FornecedorSerializer
from app_empresas.models import Empresa
from app_admin.models import Admin

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

    catalogo = fornecedor.produtos.all()
    data = [{"id": p.id, "nome": p.nome} for p in catalogo]
    return Response(data)

def limpar_numeros(texto):
    """Remove tudo que não for dígito."""
    return re.sub(r'\D', '', texto or "")


def validar_telefone(telefone_limpo):
    """Telefone brasileiro: 10 dígitos (fixo) ou 11 dígitos (celular)."""
    return len(telefone_limpo) in (10, 11)


def validar_cnpj_formato(cnpj_limpo):
    """Só confere se tem 14 dígitos. Não valida dígito verificador (pode evoluir depois)."""
    return len(cnpj_limpo) == 14


@api_view(['POST'])
def criar_fornecedor(request):
    dados = request.data

    # Campos obrigatórios
    obrigatorios = [
        "razao_social_fn", "nome_fantasia_fn", "cnpj_fn", "cep",
        "email_fn", "nome_responsavel", "telefone_fn", "id_empresa",
    ]
    faltando = [campo for campo in obrigatorios if not dados.get(campo)]
    if faltando:
        return Response({"erro": f"Campos obrigatórios faltando: {', '.join(faltando)}"}, status=400)

    # Empresa existe?
    try:
        empresa = Empresa.objects.get(id_empresa=dados["id_empresa"])
    except Empresa.DoesNotExist:
        return Response({"erro": "Empresa não encontrada"}, status=404)

    # Limpa e valida telefone
    telefone_limpo = limpar_numeros(dados["telefone_fn"])
    if not validar_telefone(telefone_limpo):
        return Response({"erro": "Telefone inválido. Use DDD + número (10 ou 11 dígitos)"}, status=400)

    # Limpa e valida CNPJ
    cnpj_limpo = limpar_numeros(dados["cnpj_fn"])
    if not validar_cnpj_formato(cnpj_limpo):
        return Response({"erro": "CNPJ inválido. Deve conter 14 dígitos"}, status=400)

    # Confere duplicidade de CNPJ (já que é unique no model)
    if Fornecedor.objects.filter(cnpj_fn=cnpj_limpo).exists():
        return Response({"erro": "Já existe um fornecedor com esse CNPJ"}, status=400)

    # Limpa CEP também
    cep_limpo = limpar_numeros(dados["cep"])
    if len(cep_limpo) != 8:
        return Response({"erro": "CEP inválido. Deve conter 8 dígitos"}, status=400)

    # Formata de volta pro padrão do banco (opcional, deixa mais legível)
    telefone_formatado = (
        f"({telefone_limpo[:2]}) {telefone_limpo[2:7]}-{telefone_limpo[7:]}"
        if len(telefone_limpo) == 11
        else f"({telefone_limpo[:2]}) {telefone_limpo[2:6]}-{telefone_limpo[6:]}"
    )
    cnpj_formatado = f"{cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:]}"
    cep_formatado = f"{cep_limpo[:5]}-{cep_limpo[5:]}"

    admin = None
    if dados.get("id_admin"):
        admin = Admin.objects.filter(id_admin=dados["id_admin"]).first()

    fornecedor = Fornecedor.objects.create(
        empresa=empresa,
        razao_social_fn=dados["razao_social_fn"],
        nome_fantasia_fn=dados["nome_fantasia_fn"],
        cnpj_fn=cnpj_formatado,
        cep=cep_formatado,
        logradouro=dados.get("logradouro", ""),
        bairro=dados.get("bairro", ""),
        cidade=dados.get("cidade", ""),
        uf=dados.get("uf", ""),
        numero=dados.get("numero", ""),
        complemento=dados.get("complemento", ""),
        email_fn=dados["email_fn"],
        nome_responsavel=dados["nome_responsavel"],
        telefone_fn=telefone_formatado,
        ativo=dados.get("ativo", True),
        cadastrado_por=admin,
    )

    return Response({
        "id_fornecedor": fornecedor.id_fornecedor,
        "nome_fantasia_fn": fornecedor.nome_fantasia_fn,
    }, status=201)
