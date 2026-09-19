from datetime import date
from app_empresas.models import Empresa
from app_produtos.models import Produto
from app_fornecedores.models import Fornecedor


empresas = list(Empresa.objects.all()[:2])
empresa1 = empresas[0]
empresa2 = empresas[1] if len(empresas) > 1 else empresas[0]

produtos = [
    Produto.objects.create(
        nome="Arroz Branco Tipo 1",
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
        nome="Feijão Carioca",
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
        nome="Óleo de Soja",
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
        nome="Açúcar Refinado",
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


fornecedores = [
    Fornecedor.objects.create(
        empresa=empresa1,
        razao_social_fn="Distribuidora Alimentos Norte Ltda",
        nome_fantasia_fn="Alimentos Norte",
        cnpj_fn="11.222.333/0001-44",
        cep="01310-100",
        logradouro="Av. Paulista",
        bairro="Bela Vista",
        cidade="São Paulo",
        uf="SP",
        numero="1000",
        complemento="Galpão 3",
        email_fn="contato@alimentosnorte.com.br",
        nome_responsavel="Ricardo Nunes",
        telefone_fn="(11) 3344-5566",
        ativo=True,
    ),
    Fornecedor.objects.create(
        empresa=empresa1,
        razao_social_fn="Grãos & Cia Comércio Ltda",
        nome_fantasia_fn="Grãos & Cia",
        cnpj_fn="22.333.444/0001-55",
        cep="80010-000",
        logradouro="Rua XV de Novembro",
        bairro="Centro",
        cidade="Curitiba",
        uf="PR",
        numero="250",
        complemento="",
        email_fn="vendas@graosecia.com.br",
        nome_responsavel="Ana Paula Reis",
        telefone_fn="(41) 3222-1199",
        ativo=True,
    ),
    Fornecedor.objects.create(
        empresa=empresa2,
        razao_social_fn="Óleos e Derivados do Sul S.A.",
        nome_fantasia_fn="Óleos do Sul",
        cnpj_fn="33.444.555/0001-66",
        cep="90020-000",
        logradouro="Av. Borges de Medeiros",
        bairro="Centro Histórico",
        cidade="Porto Alegre",
        uf="RS",
        numero="500",
        complemento="Sala 12",
        email_fn="comercial@oleosdosul.com.br",
        nome_responsavel="Fernando Costa",
        telefone_fn="(51) 3011-2233",
        ativo=True,
    ),
]

print(f"{Fornecedor.objects.count()} fornecedores cadastrados!")