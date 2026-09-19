from django.db import models

from app_empresas.models import Empresa


class Produto(models.Model):
    class Situacao(models.TextChoices):
        ATIVO = "ATIVO", "Ativo"
        INSPECAO = "INSPECAO", "Inspeção"
        BLOQUEIO = "BLOQUEIO", "Bloqueio"

    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=150)
    lote = models.CharField(max_length=50)

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        db_column="id_empresa",
        related_name="produtos",
    )

    # Nível de estoque como dois inteiros (ex: 10 de 160)
    estoque_atual = models.IntegerField(default=0)
    estoque_capacidade = models.IntegerField(default=0)

    situacao = models.CharField(
        max_length=10,
        choices=Situacao.choices,
        default=Situacao.ATIVO,
    )

    data_fabricacao = models.DateField()
    data_cadastro = models.DateTimeField(auto_now_add=True)

    # Armazenamento: ala + seção + prateleira
    ala = models.CharField(max_length=20)
    secao = models.CharField(max_length=20)
    prateleira = models.CharField(max_length=20)

    descricao = models.CharField(max_length=300, blank=True, null=True)

    class Meta:
        db_table = "produto"
        unique_together = ("lote", "empresa")

    @property
    def nivel_estoque(self):
        """Retorna o formato 'atual/capacidade', ex: '10/160'."""
        return f"{self.estoque_atual}/{self.estoque_capacidade}"

    @property
    def localizacao(self):
        return f"Ala {self.ala} - Seção {self.secao} - Prateleira {self.prateleira}"

    def __str__(self):
        return f"{self.nome} (lote {self.lote})"