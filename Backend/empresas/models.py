from django.db import models

class Empresa(models.Model):
    id_empresa = models.AutoField(primary_key=True)
    razao_social_emp = models.CharField(max_length=150)
    nome_fantasia_emp = models.CharField(max_length=150)
    cnpj_emp = models.CharField(max_length=18)
    endereco_emp = models.CharField(max_length=200)
    telefone_emp = models.CharField(max_length=20)
    email_emp = models.EmailField(max_length=100)

    class Meta:
        db_table = "empresa"

    def __str__(self):
        return self.nome_fantasia_emp