from django.db import models
from app_empresas.models import Empresa
from app_admin.models import Admin


class CatalogoProduto(models.Model):
    """Representa um tipo de produto genérico (ex: 'Açúcar Refinado'), não um lote específico."""
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=150)
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        db_column="id_empresa",
        related_name="catalogo_produtos",
    )

    class Meta:
        db_table = "catalogo_produto"
        unique_together = ("nome", "empresa")

    def __str__(self):
        return self.nome


class Produto(models.Model):
    """Representa um LOTE específico de um produto do catálogo."""
    class Situacao(models.TextChoices):
        ATIVO = "ATIVO", "Ativo"
        INSPECAO = "INSPECAO", "Inspeção"
        BLOQUEIO = "BLOQUEIO", "Bloqueio"
        ENCERRADO = "ENCERRADO", "Encerrado"

    id = models.AutoField(primary_key=True)
    
    catalogo = models.ForeignKey(
        CatalogoProduto,
        on_delete=models.PROTECT,
        related_name="lotes",
    )
    fornecedor = models.ForeignKey(
        "app_fornecedores.Fornecedor",
        on_delete=models.PROTECT,
        related_name="lotes_fornecidos",
    )
    cadastrado_por = models.ForeignKey(
        Admin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="produtos_cadastrados",
    )

    lote = models.CharField(max_length=50)
    empresa = models.ForeignKey(
        Empresa, on_delete=models.CASCADE, db_column="id_empresa", related_name="produtos"
    )
    estoque_atual = models.IntegerField(default=0)
    estoque_capacidade = models.IntegerField(default=0)
    situacao = models.CharField(max_length=10, choices=Situacao.choices, default=Situacao.ATIVO)
    data_fabricacao = models.DateField()
    data_cadastro = models.DateTimeField(auto_now_add=True)
    ala = models.CharField(max_length=20)
    secao = models.CharField(max_length=20)
    prateleira = models.CharField(max_length=20)
    descricao = models.CharField(max_length=300, blank=True, null=True)

    class Meta:
        db_table = "produto"
        unique_together = ("lote", "empresa")

    @property
    def nome(self):
        return self.catalogo.nome

    def __str__(self):
        return f"{self.catalogo.nome} (lote {self.lote})"