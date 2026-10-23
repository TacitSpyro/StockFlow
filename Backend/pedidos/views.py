from django.shortcuts import render

from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Case, When, IntegerField
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view
from rest_framework.response import Response

from Backend.paginacao import paginar
from Backend.busca import filtrar
from app_admin.models import Admin
from app_empresas.models import Empresa
from app_fornecedores.models import Fornecedor

from .models import PedidoCompra, ItemPedido
from .serializers import PedidoLinhaSerializer, PedidoDetalheSerializer

BUSCA_PEDIDO = dict(
    campos_texto={
        "numero": ["numero"],
        "fornecedor": ["fornecedor__nome_fantasia_fn", "fornecedor__razao_social_fn"],
    },
    campos_data={"data": "data_pedido__date"},
    campos_exatos={"status": "status"},
)


# ---------- helpers de validação ----------
def _inteiro(valor, campo):
    try:
        n = int(str(valor))
    except (ValueError, TypeError):
        raise ValueError(f"{campo} inválido")
    if n < 0:
        raise ValueError(f"{campo} não pode ser negativo")
    return n


def _decimal(valor, campo):
    try:
        d = Decimal(str(valor))
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError(f"{campo} inválido")
    if d < 0:
        raise ValueError(f"{campo} não pode ser negativo")
    return d


def _admin(dados):
    if dados.get("id_admin"):
        return Admin.objects.filter(id_admin=dados["id_admin"]).first()
    return None


def _gerar_numero(empresa):
    """PC-2026-0001, sequencial por empresa e ano. Chamar dentro de transaction.atomic."""
    prefixo = f"PC-{timezone.localdate().year}-"
    ultimo = (
        PedidoCompra.objects.select_for_update()
        .filter(empresa=empresa, numero__startswith=prefixo)
        .order_by("-numero").first()
    )
    seq = int(ultimo.numero.split("-")[-1]) + 1 if ultimo else 1
    return f"{prefixo}{seq:04d}"


def ordenar_pedidos(qs, modo):
    if modo == "antigo":
        return qs.order_by("data_pedido", "id")
    if modo == "alfabetico":
        return qs.order_by("fornecedor__nome_fantasia_fn", "id")
    if modo == "entrega":
        return qs.order_by("data_entrega_prevista", "id")
    if modo == "estado":  # abertos primeiro, e os que vencem antes no topo
        ordem = Case(
            When(status=PedidoCompra.Status.ABERTO, then=0),
            When(status=PedidoCompra.Status.RECEBIDO, then=1),
            default=2, output_field=IntegerField(),
        )
        return qs.annotate(_ordem=ordem).order_by("_ordem", "data_entrega_prevista", "id")
    return qs.order_by("-data_pedido", "-id")


# ---------- leitura ----------
@api_view(['GET'])
def listar_pedidos(request, id_empresa):
    pedidos = (
        PedidoCompra.objects.filter(empresa_id=id_empresa)
        .select_related("fornecedor")
        .prefetch_related("itens")  # evita uma query por pedido ao calcular valor/avaria
    )
    pedidos = filtrar(request, pedidos, **BUSCA_PEDIDO)
    pedidos = ordenar_pedidos(pedidos, request.GET.get("ordenar"))
    return paginar(request, pedidos, lambda objs: PedidoLinhaSerializer(objs, many=True).data)


@api_view(['GET'])
def obter_pedido(request, id_pedido):
    pedido = (
        PedidoCompra.objects.select_related("fornecedor")
        .prefetch_related("itens__catalogo").filter(id=id_pedido).first()
    )
    if not pedido:
        return Response({"erro": "Pedido não encontrado"}, status=404)
    return Response(PedidoDetalheSerializer(pedido).data)


# ---------- parte 1: abrir ----------
@api_view(['POST'])
def criar_pedido(request):
    dados = request.data

    faltando = [c for c in ["id_empresa", "id_fornecedor", "data_entrega_prevista", "itens"] if not dados.get(c)]
    if faltando:
        return Response({"erro": f"Campos obrigatórios faltando: {', '.join(faltando)}"}, status=400)

    empresa = Empresa.objects.filter(id_empresa=dados["id_empresa"]).first()
    if not empresa:
        return Response({"erro": "Empresa não encontrada"}, status=404)

    # fornecedor precisa ser DA MESMA empresa
    fornecedor = Fornecedor.objects.filter(id_fornecedor=dados["id_fornecedor"], empresa=empresa).first()
    if not fornecedor:
        return Response({"erro": "Fornecedor não encontrado"}, status=404)
    if not fornecedor.ativo:
        return Response({"erro": "Fornecedor inativo"}, status=400)

    data_prevista = parse_date(str(dados["data_entrega_prevista"]))
    if not data_prevista or data_prevista < timezone.localdate():
        return Response({"erro": "Data de entrega prevista inválida"}, status=400)

    tipo_frete = dados.get("tipo_frete", PedidoCompra.Frete.CIF)
    if tipo_frete not in PedidoCompra.Frete.values:
        return Response({"erro": "Tipo de frete inválido"}, status=400)

    try:
        prazo = _inteiro(dados.get("prazo_pagamento_dias", 0), "Prazo de pagamento")

        # só aceita produtos que esse fornecedor realmente fornece
        validos = set(fornecedor.produtos.values_list("id", flat=True))
        itens, vistos = [], set()
        for it in dados["itens"]:
            id_cat = it.get("id_catalogo")
            if id_cat not in validos:
                raise ValueError(f"Produto {id_cat} não é fornecido por este fornecedor")
            if id_cat in vistos:
                raise ValueError("Produto repetido no pedido")
            vistos.add(id_cat)
            qtd = _inteiro(it.get("quantidade_pedida"), "Quantidade")
            if qtd == 0:
                raise ValueError("Quantidade deve ser maior que zero")
            itens.append(ItemPedido(
                catalogo_id=id_cat,
                quantidade_pedida=qtd,
                preco_unitario_previsto=_decimal(it.get("preco_unitario_previsto"), "Preço previsto"),
            ))
    except ValueError as e:
        return Response({"erro": str(e)}, status=400)

    with transaction.atomic():
        pedido = PedidoCompra.objects.create(
            empresa=empresa,
            fornecedor=fornecedor,
            numero=_gerar_numero(empresa),      # servidor decide
            status=PedidoCompra.Status.ABERTO,  # servidor decide
            data_entrega_prevista=data_prevista,
            prazo_pagamento_dias=prazo,
            tipo_frete=tipo_frete,
            observacoes=dados.get("observacoes", ""),
            aberto_por=_admin(dados),
        )
        for item in itens:
            item.pedido = pedido
        ItemPedido.objects.bulk_create(itens)

    return Response({
        "id": pedido.id,
        "numero": pedido.numero,
        "situacao_cadastral": fornecedor.situacao_cadastral,  # o front pode avisar se não for ATIVA
    }, status=201)


@api_view(['PUT'])
def atualizar_pedido(request, id_pedido):
    pedido = PedidoCompra.objects.filter(id=id_pedido).first()
    if not pedido:
        return Response({"erro": "Pedido não encontrado"}, status=404)
    if pedido.status != PedidoCompra.Status.ABERTO:
        return Response({"erro": "Só é possível editar pedidos abertos"}, status=400)

    dados = request.data  # só 4 campos são lidos; qualquer outro é ignorado

    if "data_entrega_prevista" in dados:
        nova = parse_date(str(dados["data_entrega_prevista"]))
        if not nova or nova < timezone.localdate():
            return Response({"erro": "Data de entrega prevista inválida"}, status=400)
        pedido.data_entrega_prevista = nova

    if "tipo_frete" in dados:
        if dados["tipo_frete"] not in PedidoCompra.Frete.values:
            return Response({"erro": "Tipo de frete inválido"}, status=400)
        pedido.tipo_frete = dados["tipo_frete"]

    if "prazo_pagamento_dias" in dados:
        try:
            pedido.prazo_pagamento_dias = _inteiro(dados["prazo_pagamento_dias"], "Prazo de pagamento")
        except ValueError as e:
            return Response({"erro": str(e)}, status=400)

    pedido.observacoes = dados.get("observacoes", pedido.observacoes)
    pedido.save()
    return Response({"id": pedido.id})


# ---------- parte 2: fechar ----------
@api_view(['POST'])
def fechar_pedido(request, id_pedido):
    pedido = PedidoCompra.objects.filter(id=id_pedido).first()
    if not pedido:
        return Response({"erro": "Pedido não encontrado"}, status=404)
    if pedido.status != PedidoCompra.Status.ABERTO:
        return Response({"erro": "Só é possível fechar um pedido aberto"}, status=400)

    dados = request.data

    data_rec = parse_date(str(dados.get("data_recebimento", "")))
    if not data_rec or data_rec > timezone.localdate():
        return Response({"erro": "Data de recebimento inválida"}, status=400)
    if data_rec < timezone.localtime(pedido.data_pedido).date():
        return Response({"erro": "Recebimento não pode ser anterior à abertura do pedido"}, status=400)

    recebidos = dados.get("itens", [])
    # tem que vir TODOS os itens: item sem fechamento deixaria o valor final errado
    if {i.get("id") for i in recebidos} != set(pedido.itens.values_list("id", flat=True)):
        return Response({"erro": "Informe todos os itens do pedido (e somente eles)"}, status=400)

    try:
        normalizados = []
        for it in recebidos:
            avariada = _inteiro(it.get("quantidade_avariada", 0), "Quantidade avariada")
            categoria = it.get("categoria_avaria", "")
            if avariada > 0 and categoria not in ItemPedido.CategoriaAvaria.values:
                raise ValueError("Informe a categoria da avaria")
            normalizados.append({
                "id": it["id"],
                "quantidade_recebida": _inteiro(it.get("quantidade_recebida"), "Quantidade recebida"),
                "quantidade_avariada": avariada,
                "categoria_avaria": categoria,
                "descricao_avaria": it.get("descricao_avaria", ""),
                "preco_unitario_final": _decimal(it.get("preco_unitario_final"), "Preço final"),
            })

        pedido.fechar(
            itens_recebidos=normalizados,
            data_recebimento=data_rec,
            valor_frete=_decimal(dados.get("valor_frete", 0), "Frete"),
            valor_impostos=_decimal(dados.get("valor_impostos", 0), "Impostos"),
            admin=_admin(dados),
            observacoes=dados.get("observacoes", ""),
        )
    except ValueError as e:  # inclui o "avariada maior que recebida" do fechar()
        return Response({"erro": str(e)}, status=400)

    return Response({"id": pedido.id, "status": pedido.status})


@api_view(['POST'])
def cancelar_pedido(request, id_pedido):
    pedido = PedidoCompra.objects.filter(id=id_pedido).first()
    if not pedido:
        return Response({"erro": "Pedido não encontrado"}, status=404)
    if pedido.status != PedidoCompra.Status.ABERTO:
        return Response({"erro": "Só é possível cancelar pedidos abertos"}, status=400)
    pedido.status = PedidoCompra.Status.CANCELADO
    pedido.save(update_fields=["status"])
    return Response({"id": pedido.id, "status": pedido.status})