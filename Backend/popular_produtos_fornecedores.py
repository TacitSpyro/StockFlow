from datetime import date
from app_empresas.models import Empresa
from app_produtos.models import Produto, CatalogoProduto
from app_fornecedores.models import Fornecedor

empresas = list(Empresa.objects.all()[:2])
empresa1 = empresas[0]
empresa2 = empresas[1] if len(empresas) > 1 else empresas[0]

# Busca o catálogo e fornecedores já cadastrados
catalogo_arroz = CatalogoProduto.objects.get(nome="Arroz Branco Tipo 1")
catalogo_feijao = CatalogoProduto.objects.get(nome="Feijão Carioca")
catalogo_oleo = CatalogoProduto.objects.get(nome="Óleo de Soja")
catalogo_acucar = CatalogoProduto.objects.get(nome="Açúcar Refinado")

fornecedor1 = Fornecedor.objects.get(nome_fantasia_fn="Alimentos Norte")
fornecedor3 = Fornecedor.objects.get(nome_fantasia_fn="Óleos do Sul")

produtos = [
    Produto.objects.create(
        catalogo=catalogo_arroz,
        fornecedor=fornecedor1,
        lote="LOTE-A001",
        empresa=empresa1,
        estoque_atual=120,
        estoque_capacidade=200,
        situacao=Produto.Situacao.ATIVO,
        data_fabricacao=date(2025, 3, 10),
        ala="A",
        secao="1",
        prateleira="03",
        descricao="Pacote de 5kg",
    ),
    Produto.objects.create(
        catalogo=catalogo_feijao,
        fornecedor=fornecedor1,
        lote="LOTE-A002",
        empresa=empresa1,
        estoque_atual=45,
        estoque_capacidade=150,
        situacao=Produto.Situacao.INSPECAO,
        data_fabricacao=date(2025, 5, 22),
        ala="A",
        secao="2",
        prateleira="01",
        descricao="Pacote de 1kg",
    ),
    Produto.objects.create(
        catalogo=catalogo_oleo,
        fornecedor=fornecedor3,
        lote="LOTE-B010",
        empresa=empresa2,
        estoque_atual=10,
        estoque_capacidade=160,
        situacao=Produto.Situacao.BLOQUEIO,
        data_fabricacao=date(2025, 1, 15),
        ala="B",
        secao="4",
        prateleira="02",
        descricao="Garrafa 900ml, lote com avaria no transporte",
    ),
    Produto.objects.create(
        catalogo=catalogo_acucar,
        fornecedor=fornecedor3,
        lote="LOTE-B011",
        empresa=empresa2,
        estoque_atual=88,
        estoque_capacidade=100,
        situacao=Produto.Situacao.ATIVO,
        data_fabricacao=date(2025, 6, 1),
        ala="B",
        secao="1",
        prateleira="05",
        descricao="Pacote de 1kg",
    ),
]

print(f"{Produto.objects.count()} produtos cadastrados!")