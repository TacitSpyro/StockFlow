from django.db import models

#Importando as 3 relações dessa tabela
from app_admin.models import Admin
from app_empresas.models import Empresa
from app_produtos.models import CatalogoProduto


#definir a classe que vai criar a tabela "Fornecedor" em ORM do django
class Fornecedor(models.Model):

#colunas da tabela

    id_fornecedor = models.AutoField(primary_key=True) #Primary Key

#FK com cardinalidade 1:n muitos fornecedores 1 empresa
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE, #Deletar todos os dados caso a Pk for deletada
        db_column="id_empresa",
        related_name="fornecedores",
    )

#Fk que salva quem fez o cadastro do fornecedor
    cadastrado_por = models.ForeignKey(
        Admin,
        on_delete=models.SET_NULL, #Campo fica como NULL se o admin for deletado
        null=True,
        blank=True,
        related_name="fornecedores_cadastrados",
    )

    razao_social_fn = models.CharField(max_length=150)
    nome_fantasia_fn = models.CharField(max_length=150)
    cnpj_fn = models.CharField(max_length=18, unique=True)

    # Endereço via CEP, calcula o CEP na Views com ViaCEP

    cep = models.CharField(max_length=9)  #Texto
    logradouro = models.CharField(max_length=150, blank=True) #Texto, pode ser definido como NULL
    bairro = models.CharField(max_length=100, blank=True) #Texto, pode ser definido como NULL
    cidade = models.CharField(max_length=100, blank=True) #Texto, pode ser definido como NULL
    uf = models.CharField(max_length=2, blank=True) #Texto, pode ser definido como NULL
    numero = models.CharField(max_length=10, blank=True) #Texto, pode ser definido como NULL
    complemento = models.CharField(max_length=100, blank=True, null=True) #Texto, pode ser definido como NULL

    email_fn = models.EmailField(max_length=100) #Email
    nome_responsavel = models.CharField(max_length=150) #Texto
    telefone_fn = models.CharField(max_length=20) #Texto

    ativo = models.BooleanField(default=True) #Booleano
    data_cadastro = models.DateTimeField(auto_now_add=True) #TimeStamp

#Relação N:N ou M2M o django cria uma tabela interediara automaticamente 
    produtos = models.ManyToManyField(
        CatalogoProduto,
        related_name="fornecedores",
    )

    class Meta:
        db_table = "fornecedor"

#Formata o endereço quando alguem consultar
    @property
    def endereco_completo(self):
        partes = [self.logradouro, self.numero, self.complemento, self.bairro, self.cidade, self.uf]
        return ", ".join(p for p in partes if p)

    def __str__(self):
        return self.nome_fantasia_fn