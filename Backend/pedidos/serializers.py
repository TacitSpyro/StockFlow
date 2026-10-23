from rest_framework import serializers
from .models import PedidoCompra, ItemPedido


class PedidoLinhaSerializer(serializers.ModelSerializer):
    """Uma linha da tabela. Lista explícita: o que não está aqui não vaza."""
    fornecedor_nome = serializers.CharField(source="fornecedor.nome_fantasia_fn", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    atrasado = serializers.ReadOnlyField()
    valor = serializers.SerializerMethodField()
    valor_definitivo = serializers.SerializerMethodField()
    teve_avaria = serializers.SerializerMethodField()

    class Meta:
        model = PedidoCompra
        fields = [
            "id", "numero", "fornecedor_nome", "status", "status_label",
            "data_pedido", "data_entrega_prevista", "data_recebimento",
            "atrasado", "valor", "valor_definitivo", "teve_avaria",
        ]
        read_only_fields = fields

    def get_valor_definitivo(self, p):
        return p.status == PedidoCompra.Status.RECEBIDO

    def get_valor(self, p):
        v = p.valor_final if p.status == PedidoCompra.Status.RECEBIDO else p.valor_previsto
        return str(v)  # Decimal como texto, sem perder precisão

    def get_teve_avaria(self, p):
        return p.teve_avaria if p.status == PedidoCompra.Status.RECEBIDO else None


class ItemPedidoSerializer(serializers.ModelSerializer):
    produto = serializers.CharField(source="catalogo.nome", read_only=True)

    class Meta:
        model = ItemPedido
        fields = [
            "id", "produto", "quantidade_pedida", "preco_unitario_previsto",
            "quantidade_recebida", "quantidade_avariada", "categoria_avaria",
            "descricao_avaria", "preco_unitario_final",
        ]
        read_only_fields = fields


class PedidoDetalheSerializer(serializers.ModelSerializer):
    fornecedor_nome = serializers.CharField(source="fornecedor.nome_fantasia_fn", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    situacao_cadastral = serializers.CharField(source="fornecedor.situacao_cadastral", read_only=True)
    editavel = serializers.SerializerMethodField()
    itens = ItemPedidoSerializer(many=True, read_only=True)
    valor_previsto = serializers.SerializerMethodField()
    valor_final = serializers.SerializerMethodField()

    class Meta:
        model = PedidoCompra
        fields = [
            "id", "numero", "fornecedor_nome", "situacao_cadastral", "status", "status_label",
            "editavel", "data_pedido", "data_entrega_prevista", "prazo_pagamento_dias",
            "tipo_frete", "observacoes", "data_recebimento", "valor_frete", "valor_impostos",
            "observacoes_recebimento", "valor_previsto", "valor_final", "itens",
        ]
        read_only_fields = fields

    def get_editavel(self, p):
        return p.status == PedidoCompra.Status.ABERTO

    def get_valor_previsto(self, p):
        return str(p.valor_previsto)

    def get_valor_final(self, p):
        return None if p.valor_final is None else str(p.valor_final)