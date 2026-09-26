#Importar o modulo de models do django pra poder escrever os dados
from django.db import models

#definir a classe que vai criar a tabela "Empresas" em ORM do django
class Empresa(models.Model):

#colunas da tabela
    id_empresa = models.AutoField(primary_key=True) #Primary Key

    razao_social_emp = models.CharField(max_length=150) #Texto
    nome_fantasia_emp = models.CharField(max_length=150) #Texto
    cnpj_emp = models.CharField(max_length=18) #Texto
    endereco_emp = models.CharField(max_length=200) #Texto
    telefone_emp = models.CharField(max_length=20) #Texto
    email_emp = models.EmailField(max_length=100) #Email

#Recebe data e hora do momento de cadastro
    data_cadastro = models.DateTimeField(auto_now_add=True) #TimeStamp

    class Meta:
        db_table = "empresa"

    def __str__(self):
        return self.nome_fantasia_emp