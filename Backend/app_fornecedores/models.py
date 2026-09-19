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
    cnpj_fn = models.CharField(max_length=18, unique=True)

    # Endereço via CEP
    cep = models.CharField(max_length=9)  # formato 00000-000
    logradouro = models.CharField(max_length=150, blank=True)
    bairro = models.CharField(max_length=100, blank=True)
    cidade = models.CharField(max_length=100, blank=True)
    uf = models.CharField(max_length=2, blank=True)
    numero = models.CharField(max_length=10, blank=True)
    complemento = models.CharField(max_length=100, blank=True, null=True)

    email_fn = models.EmailField(max_length=100)
    nome_responsavel = models.CharField(max_length=150)
    telefone_fn = models.CharField(max_length=20)

    ativo = models.BooleanField(default=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)

    produtos = models.ManyToManyField(
        Produto,
        through="FornecimentoProduto",
        related_name="fornecedores",
    )

    class Meta:
        db_table = "fornecedor"

    @property
    def endereco_completo(self):
        partes = [self.logradouro, self.numero, self.complemento, self.bairro, self.cidade, self.uf]
        return ", ".join(p for p in partes if p)

    def __str__(self):
        return self.nome_fantasia_fn

class FornecimentoProduto(models.Model):
    id = models.AutoField(primary_key=True)
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete=models.CASCADE,
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
    )
    data_fornecimento = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fornecimento_produto"
        unique_together = ("fornecedor", "produto")

    def __str__(self):
        return f"{self.fornecedor.nome_fantasia_fn} → {self.produto.nome}"