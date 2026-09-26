from django.db import models

#Importa Timezone pra lidar com fuso horário
from django.utils import timezone

#Importa dois models pra preencher as FKs
from app_empresas.models import Empresa
from app_admin.models import Admin


#definir a classe que vai criar a tabela intermediaria "CatalogoProduto" em ORM do django
#essa tabela permite que um fornecedor tenha um "Catálogo" de produtos que ele fornece
class CatalogoProduto(models.Model):

#colunas da tabela
    id = models.AutoField(primary_key=True) #Primary Key

    nome = models.CharField(max_length=150) #Texto

#FK de 1:N 
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE, #Deletar todos os dados caso a Pk for deletada
        db_column="id_empresa",
        related_name="catalogo_produtos",
    )

#Propriedade Unique_Together não pode ter um par igual de nome + empresa 
    class Meta:
        db_table = "catalogo_produto"
        unique_together = ("nome", "empresa")

    def __str__(self):
        return self.nome

#Tabela Principal do modelo
class Produto(models.Model):

#Define 4 opções/valores que o campo pode assumir
    class Situacao(models.TextChoices):
        ATIVO = "ATIVO", "Ativo"
        INSPECAO = "INSPECAO", "Inspeção"
        BLOQUEIO = "BLOQUEIO", "Bloqueio"
        ENCERRADO = "ENCERRADO", "Encerrado"

#colunas da tabela
    id = models.AutoField(primary_key=True) #Primary Key

    catalogo = models.ForeignKey(CatalogoProduto, on_delete=models.PROTECT, related_name="lotes")
    #Protect impede que um catálogo seja deletado caso tenha algum produto releacionado a ele

    fornecedor = models.ForeignKey("app_fornecedores.Fornecedor", on_delete=models.PROTECT, related_name="lotes_fornecidos")
    #A referencia de "app_fornecedores.Fornecedor" fica entre aspas pra ser uma string, como fornecedor tambem importa de
    #produtos cada inserção geraria um ciclo (produto -> fornecor -> produto -> fornecedor...) o django resolve isso depois

    lote = models.CharField(max_length=50) #Texto

    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, db_column="id_empresa", related_name="produtos") 
    #Deletar todos os dados caso a Pk for deletada

    estoque_atual = models.IntegerField(default=0) #Numero
    estoque_capacidade = models.IntegerField(default=0) #Numero

    situacao = models.CharField(max_length=10, choices=Situacao.choices, default=Situacao.ATIVO) 
    #Texto, puxa da class situação, padrão = Ativo

    data_fabricacao = models.DateField() #Data
    data_cadastro = models.DateTimeField(auto_now_add=True) #TimeStamp
    data_encerramento = models.DateTimeField(null=True, blank=True) #TimeStamp, pode ser NULL
    ala = models.CharField(max_length=20) #Texto
    secao = models.CharField(max_length=20) #Texto
    prateleira = models.CharField(max_length=20) #Texto
    descricao = models.CharField(max_length=300, blank=True, null=True) #Texto, pode ser NULL

    cadastrado_por = models.ForeignKey(
        Admin, on_delete=models.SET_NULL, null=True, blank=True, related_name="produtos_cadastrados" 
        #Campo fica como NULL se o admin for deletado
    )

#Garante que não existam pares iguais na mesma empresa
    class Meta:
        db_table = "produto"
        unique_together = ("lote", "empresa")

#Força que o campo data_encerramento receba a data de hoje se situação = encerrado, senão fica vazio 
    def save(self, *args, **kwargs):
        if self.situacao == self.Situacao.ENCERRADO and self.data_encerramento is None:
            self.data_encerramento = timezone.now()
        elif self.situacao != self.Situacao.ENCERRADO:
            self.data_encerramento = None

        super().save(*args, **kwargs)

#Retorna dado formatado ex(10/100)
    @property
    def nivel_estoque(self):
        return f"{self.estoque_atual}/{self.estoque_capacidade}"

#Concatena uma string ex("Ala A - Seção 3 - Prateleira 12") 
    @property
    def localizacao(self):
        return f"Ala {self.ala} - Seção {self.secao} - Prateleira {self.prateleira}"

    def __str__(self):
        return f"{self.catalogo.nome} (lote {self.lote})"