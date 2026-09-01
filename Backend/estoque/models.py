from django.db import models

class Produto(models.Model):
    id_produtos = models.AutoField(primary_key=True)
    nome_prod = models.CharField(max_length=150, blank=True, null=True)
    valor_prod = models.IntegerField(blank=True, null=True)
    descricao = models.TextField(blank=True, null=True)
    categoria = models.CharField(max_length=80, blank=True, null=True)
    quantidade_estoque = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = "produto"

    def __str__(self):
        return self.nome_prod or f"Produto {self.pk}"