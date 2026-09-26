from django.db import models

#importa a tabela empresa do outro Model
from app_empresas.models import Empresa

#Tabela de administrador
class Admin(models.Model):
    id_admin = models.AutoField(primary_key=True)

#Foreign Key da Tabela empresas
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE, #Deletar todos os dados caso a Pk for deletada
        db_column="id_empresa",
        related_name="admins",
    )
    matricula = models.IntegerField() #Numero
    nome_admin = models.CharField(max_length=150) #Texto
    senha = models.CharField(max_length=255) #Texto, Hash definido nas views

    class Meta:
        db_table = "admin"

    def __str__(self):
        return self.nome_admin