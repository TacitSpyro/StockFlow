from django.db import models

from app_empresas.models import Empresa


class Produto(models.Model):
    id = models.AutoField(primary_key=True)
    lote = models.CharField(max_length=50)
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        db_column="id_empresa",
        related_name="produtos",
    )
    nome_prod = models.CharField(max_length=150, blank=True, null=True)
    valor_prod = models.IntegerField(blank=True, null=True)
    quantidade_estoque = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = "produto"
        unique_together = ("lote", "empresa")

    def __str__(self):
        return f"{self.nome_prod} (lote {self.lote} - {self.empresa})"