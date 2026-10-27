from decimal import Decimal

from django.db import models, transaction
from django.utils import timezone

from app_empresas.models import Empresa
from app_admin.models import Admin
from app_produtos.models import CatalogoProduto

class IndiceEconomico(models.Model):
    nome = models.CharField(max_length=30)             # "IPCA", "IGPM", "DOLAR"
    data = models.DateField()                          # primeiro dia do mês
    valor = models.DecimalField(max_digits=14, decimal_places=6)

    class Meta:
        db_table = "indice_economico"
        unique_together = ("nome", "data")
        ordering = ["nome", "data"]


class PedidoCompra(models.Model):

    class Status(models.TextChoices):
        ABERTO = "ABERTO", "Aberto"
        RECEBIDO = "RECEBIDO", "Recebido"
        CANCELADO = "CANCELADO", "Cancelado"

    class Frete(models.TextChoices):
        CIF = "CIF", "CIF (fornecedor paga)"
        FOB = "FOB", "FOB (comprador paga)"

    id = models.AutoField(primary_key=True)

    empresa = models.ForeignKey(
        Empresa, on_delete=models.CASCADE,
        db_column="id_empresa", related_name="pedidos",
    )
    fornecedor = models.ForeignKey(
        "app_fornecedores.Fornecedor",
        on_delete=models.PROTECT, related_name="pedidos",
    )

    numero = models.CharField(max_length=30)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ABERTO)

    # ---------- PARTE 1: abertura ----------
    data_pedido = models.DateTimeField(default=timezone.now)
    data_entrega_prevista = models.DateField()
    prazo_pagamento_dias = models.PositiveIntegerField(default=0)  # 0 = à vista (numérico, pro Prophet)
    tipo_frete = models.CharField(max_length=3, choices=Frete.choices, default=Frete.CIF)
    observacoes = models.CharField(max_length=300, blank=True)
    aberto_por = models.ForeignKey(
        Admin, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="pedidos_abertos",
    )

    # ---------- PARTE 2: fechamento (começam vazios) ----------
    data_recebimento = models.DateField(null=True, blank=True)
    valor_frete = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valor_impostos = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    observacoes_recebimento = models.CharField(max_length=300, blank=True)
    fechado_por = models.ForeignKey(
        Admin, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="pedidos_fechados",
    )

    class Meta:
        db_table = "pedido_compra"
        unique_together = ("numero", "empresa")
        ordering = ["-data_pedido"]
        indexes = [
            # as consultas do Prophet filtram sempre por fornecedor + data
            models.Index(fields=["fornecedor", "data_recebimento"]),
        ]

    # ---------- indicadores calculados ----------
    @property
    def atraso_dias(self):
        """Positivo = atrasou, negativo = adiantou, None = ainda não chegou."""
        if not self.data_recebimento:
            return None
        return (self.data_recebimento - self.data_entrega_prevista).days

    @property
    def atrasado(self):
        # pedido aberto que já passou do prazo
        return self.status == self.Status.ABERTO and self.data_entrega_prevista < timezone.localdate()

    @property
    def valor_previsto(self):
        return sum((i.subtotal_previsto for i in self.itens.all()), Decimal("0"))

    @property
    def valor_final(self):
        """Mercadoria + frete + impostos (custo total real do pedido)."""
        if self.status != self.Status.RECEBIDO:
            return None
        mercadoria = sum((i.subtotal_final or Decimal("0") for i in self.itens.all()), Decimal("0"))
        return mercadoria + (self.valor_frete or Decimal("0")) + (self.valor_impostos or Decimal("0"))

    @property
    def teve_avaria(self):
        return any((i.quantidade_avariada or 0) > 0 for i in self.itens.all())

    def fechar(self, itens_recebidos, data_recebimento, valor_frete=0, valor_impostos=0,
               admin=None, observacoes=""):
        """
        itens_recebidos = [
            {"id": 1, "quantidade_recebida": 100, "quantidade_avariada": 5,
             "categoria_avaria": "AMASSADO", "descricao_avaria": "Caixas amassadas",
             "preco_unitario_final": "12.50"},
        ]
        """
        if self.status != self.Status.ABERTO:
            raise ValueError("Só é possível fechar um pedido aberto")

        with transaction.atomic():
            for dados in itens_recebidos:
                item = self.itens.get(id=dados["id"])
                recebida = int(dados["quantidade_recebida"])
                avariada = int(dados.get("quantidade_avariada") or 0)

                if avariada > recebida:
                    raise ValueError(f"Item {item.id}: avariada ({avariada}) maior que recebida ({recebida})")

                item.quantidade_recebida = recebida
                item.quantidade_avariada = avariada
                item.categoria_avaria = dados.get("categoria_avaria", "") if avariada else ""
                item.descricao_avaria = dados.get("descricao_avaria", "")
                item.preco_unitario_final = Decimal(str(dados["preco_unitario_final"]))
                item.save()

            self.data_recebimento = data_recebimento
            self.valor_frete = valor_frete
            self.valor_impostos = valor_impostos
            self.observacoes_recebimento = observacoes
            self.fechado_por = admin
            self.status = self.Status.RECEBIDO
            self.save()

    def __str__(self):
        return f"{self.numero} - {self.fornecedor}"


class ItemPedido(models.Model):

    class CategoriaAvaria(models.TextChoices):
        AMASSADO = "AMASSADO", "Embalagem amassada/danificada"
        VENCIDO = "VENCIDO", "Vencido / validade curta"
        FORA_ESPECIFICACAO = "FORA_ESPECIFICACAO", "Fora de especificação"
        QUANTIDADE_ERRADA = "QUANTIDADE_ERRADA", "Quantidade errada"
        OUTRO = "OUTRO", "Outro"

    id = models.AutoField(primary_key=True)
    pedido = models.ForeignKey(PedidoCompra, on_delete=models.CASCADE, related_name="itens")
    catalogo = models.ForeignKey(CatalogoProduto, on_delete=models.PROTECT, related_name="itens_pedido")

    # ---------- PARTE 1: o que foi pedido ----------
    quantidade_pedida = models.PositiveIntegerField()
    preco_unitario_previsto = models.DecimalField(max_digits=12, decimal_places=2)

    # ---------- PARTE 2: o que realmente chegou ----------
    quantidade_recebida = models.PositiveIntegerField(null=True, blank=True)
    quantidade_avariada = models.PositiveIntegerField(null=True, blank=True)  # subconjunto da recebida
    categoria_avaria = models.CharField(max_length=20, choices=CategoriaAvaria.choices, blank=True)
    descricao_avaria = models.CharField(max_length=300, blank=True)
    preco_unitario_final = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    lote = models.ForeignKey(
        "app_produtos.Produto", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="item_origem",
    )

    class Meta:
        db_table = "item_pedido"
        indexes = [models.Index(fields=["catalogo", "pedido"])]

    @property
    def subtotal_previsto(self):
        return self.quantidade_pedida * self.preco_unitario_previsto

    @property
    def subtotal_final(self):
        if self.quantidade_recebida is None or self.preco_unitario_final is None:
            return None
        return self.quantidade_recebida * self.preco_unitario_final

    @property
    def fill_rate(self):
        """Quanto do pedido chegou de fato (1.0 = 100%)."""
        if self.quantidade_recebida is None or not self.quantidade_pedida:
            return None
        return self.quantidade_recebida / self.quantidade_pedida

    @property
    def taxa_avaria(self):
        if not self.quantidade_recebida:
            return None
        return (self.quantidade_avariada or 0) / self.quantidade_recebida

    @property
    def variacao_preco(self):
        """Quanto o preço final divergiu do previsto (0.05 = pagou 5% a mais)."""
        if self.preco_unitario_final is None or not self.preco_unitario_previsto:
            return None
        return float(self.preco_unitario_final / self.preco_unitario_previsto - 1)

    @property
    def custo_efetivo_unitario(self):
        """
        Preço final + parte do frete e impostos do pedido, rateada pelo
        valor deste item. Permite comparar fornecedor CIF com fornecedor FOB.
        """
        if self.subtotal_final is None or not self.quantidade_recebida:
            return None
        pedido = self.pedido
        total_mercadoria = sum((i.subtotal_final or Decimal("0") for i in pedido.itens.all()), Decimal("0"))
        extras = (pedido.valor_frete or Decimal("0")) + (pedido.valor_impostos or Decimal("0"))
        rateio = extras * (self.subtotal_final / total_mercadoria) if total_mercadoria else Decimal("0")
        return (self.subtotal_final + rateio) / self.quantidade_recebida

    def __str__(self):
        return f"{self.quantidade_pedida}x {self.catalogo.nome}"