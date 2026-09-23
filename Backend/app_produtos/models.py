from django.db import models
from django.utils import timezone

from app_empresas.models import Empresa
from app_admin.models import Admin


class CatalogoProduto(models.Model):

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
    class Situacao(models.TextChoices):
        ATIVO = "ATIVO", "Ativo"
        INSPECAO = "INSPECAO", "Inspeção"
        BLOQUEIO = "BLOQUEIO", "Bloqueio"
        ENCERRADO = "ENCERRADO", "Encerrado"

    id = models.AutoField(primary_key=True)
    catalogo = models.ForeignKey(CatalogoProduto, on_delete=models.PROTECT, related_name="lotes")
    fornecedor = models.ForeignKey("app_fornecedores.Fornecedor", on_delete=models.PROTECT, related_name="lotes_fornecidos")
    lote = models.CharField(max_length=50)
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, db_column="id_empresa", related_name="produtos")
    estoque_atual = models.IntegerField(default=0)
    estoque_capacidade = models.IntegerField(default=0)
    situacao = models.CharField(max_length=10, choices=Situacao.choices, default=Situacao.ATIVO)
    data_fabricacao = models.DateField()
    data_cadastro = models.DateTimeField(auto_now_add=True)
    data_encerramento = models.DateTimeField(null=True, blank=True)
    ala = models.CharField(max_length=20)
    secao = models.CharField(max_length=20)
    prateleira = models.CharField(max_length=20)
    descricao = models.CharField(max_length=300, blank=True, null=True)
    cadastrado_por = models.ForeignKey(
        Admin, on_delete=models.SET_NULL, null=True, blank=True, related_name="produtos_cadastrados"
    )

    class Meta:
        db_table = "produto"
        unique_together = ("lote", "empresa")

    def save(self, *args, **kwargs):
        if self.situacao == self.Situacao.ENCERRADO and self.data_encerramento is None:
            self.data_encerramento = timezone.now()
        elif self.situacao != self.Situacao.ENCERRADO:
            self.data_encerramento = None

        super().save(*args, **kwargs)

    @property
    def nivel_estoque(self):
        return f"{self.estoque_atual}/{self.estoque_capacidade}"

    @property
    def localizacao(self):
        return f"Ala {self.ala} - Seção {self.secao} - Prateleira {self.prateleira}"

    def __str__(self):
        return f"{self.catalogo.nome} (lote {self.lote})"