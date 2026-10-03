from django.db import models

from app_empresas.models import Empresa
from app_admin.models import Admin


class Relatorio(models.Model):
    class Tipo(models.TextChoices):
        TODOS = "TODOS", "Todos"
        FORNECEDOR = "FORNECEDOR", "Fornecedor"
        PRODUTO = "PRODUTO", "Produto"

    id = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="relatorios")
    tipo = models.CharField(max_length=10, choices=Tipo.choices)

    data_geracao = models.DateTimeField(auto_now_add=True)
    gerado_por = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True, blank=True)

    # Período que o relatório cobre (filtro usado na hora de gerar)
    periodo_inicio = models.DateField(null=True, blank=True)
    periodo_fim = models.DateField(null=True, blank=True)

    # Os dados do relatório em si (contagens, listas, o que for)
    dados = models.JSONField(default=dict)

    class Meta:
        db_table = "relatorio"
        ordering = ["-data_geracao"]

    def __str__(self):
        return f"Relatório {self.get_tipo_display()} - {self.data_geracao.strftime('%d/%m/%Y %H:%M')}"