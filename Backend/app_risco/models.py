from django.db import models

from app_empresas.models import Empresa


class AvaliacaoRisco(models.Model):
    """Resultado do último cálculo de risco de um fornecedor (uma linha por fornecedor)."""

    class Nivel(models.TextChoices):
        BAIXO = "BAIXO", "Baixo"
        MEDIO = "MEDIO", "Médio"
        ALTO = "ALTO", "Alto"

    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="avaliacoes_risco")
    fornecedor = models.ForeignKey(
        "app_fornecedores.Fornecedor", on_delete=models.CASCADE, related_name="avaliacoes_risco"
    )
    calculado_em = models.DateTimeField(auto_now=True)

    # score de 0 a 100: quanto MAIOR, mais seguro
    score_final = models.DecimalField(max_digits=5, decimal_places=1)
    nivel = models.CharField(max_length=5, choices=Nivel.choices)

    nota_preco = models.DecimalField(max_digits=5, decimal_places=1)
    nota_desempenho = models.DecimalField(max_digits=5, decimal_places=1)
    nota_dependencia = models.DecimalField(max_digits=5, decimal_places=1)
    nota_cadastro = models.DecimalField(max_digits=5, decimal_places=1)

    alta_prevista_pct = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    alta_pessimista_pct = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)

    motivos = models.JSONField(default=list)    # frases prontas pra mostrar na tela
    detalhes = models.JSONField(default=dict)   # itens, métricas, índice usado...

    class Meta:
        db_table = "avaliacao_risco"
        unique_together = ("empresa", "fornecedor")
        ordering = ["score_final"]   # os mais arriscados primeiro

    def __str__(self):
        return f"{self.fornecedor} - {self.nivel} ({self.score_final})"
