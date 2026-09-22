from django.db import models

from app_empresas.models import Empresa


class Admin(models.Model):
    id_admin = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        db_column="id_empresa",
        related_name="admins",
    )
    matricula = models.IntegerField()
    nome_admin = models.CharField(max_length=150)
    senha = models.CharField(max_length=255)

    class Meta:
        db_table = "admin"

    def __str__(self):
        return self.nome_admin