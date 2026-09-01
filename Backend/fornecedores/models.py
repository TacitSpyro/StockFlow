from django.db import models

class Fornecedor(models.Model):
    id_fornecedor = models.AutoField(primary_key=True)
    razao_social_fn = models.CharField(max_length=150)
    nome_fantasia_fn = models.CharField(max_length=150)
    cnpj_fn = models.CharField(max_length=18)
    endereco_fn = models.CharField(max_length=200)
    telefone_fn = models.CharField(max_length=20)
    email_fn = models.EmailField(max_length=100)
    contato_resp = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = "fornecedor"

    def __str__(self):
        return self.nome_fantasia_fn