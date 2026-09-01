from django.db import models

from fornecedores.models import Fornecedor
from empresas.models import Empresa


class Admin(models.Model):
    id_admin = models.AutoField(primary_key=True)
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete=models.CASCADE,
        db_column="id_fornecedor",
        related_name="admins",
        null=True,
        blank=True,
    )
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        db_column="id_empresa",
        related_name="admins",
        null=True,
        blank=True,
    )
    nome_admin = models.CharField(max_length=150)
    email_admin = models.EmailField(max_length=100)
    matricula = models.IntegerField()
    data_nasc = models.DateField()
    senha_hash = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "admin"

    def __str__(self):
        return self.nome_admin