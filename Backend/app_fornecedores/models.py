from django.db import models

from app_empresas.models import Empresa
from app_produtos.models import Produto


class Fornecedor(models.Model):
    id_fornecedor = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        db_column="id_empresa",
        related_name="fornecedores",
    )
    razao_social_fn = models.CharField(max_length=150)
    nome_fantasia_fn = models.CharField(max_length=150)
    cnpj_fn = models.CharField(max_length=18)
    endereco_fn = models.CharField(max_length=200)
    telefone_fn = models.CharField(max_length=20)
    email_fn = models.EmailField(max_length=100)
    contato_resp = models.CharField(max_length=20, blank=True, null=True)

    produtos = models.ManyToManyField(
        Produto,
        through="FornecimentoProduto",
        related_name="fornecedores",
    )

    class Meta:
        db_table = "fornecedor"

    def __str__(self):
        return self.nome_fantasia_fn


class FornecimentoProduto(models.Model):
    id_fornecimento = models.AutoField(primary_key=True)
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete=models.CASCADE,
        db_column="id_fornecedor",
        related_name="fornecimentos",
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        db_column="id_produto",
        related_name="fornecimentos",
    )
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        db_column="id_empresa",
        related_name="fornecimentos",
    )

    class Meta:
        db_table = "fornecimento_produto"
        unique_together = ("fornecedor", "produto")

    def __str__(self):
        return f"{self.fornecedor} → {self.produto}"