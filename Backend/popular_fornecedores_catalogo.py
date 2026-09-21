from app_empresas.models import Empresa
from app_produtos.models import CatalogoProduto
from app_fornecedores.models import Fornecedor

# 1. Busca as empresas já cadastradas
empresas = list(Empresa.objects.all()[:2])
empresa1 = empresas[0]
empresa2 = empresas[1] if len(empresas) > 1 else empresas[0]

# 2. Cria o catálogo de produtos (os "tipos" de produto que existem, sem lote ainda)
catalogo_arroz = CatalogoProduto.objects.create(nome="Arroz Branco Tipo 1", empresa=empresa1)
catalogo_feijao = CatalogoProduto.objects.create(nome="Feijão Carioca", empresa=empresa1)
catalogo_oleo = CatalogoProduto.objects.create(nome="Óleo de Soja", empresa=empresa2)
catalogo_acucar = CatalogoProduto.objects.create(nome="Açúcar Refinado", empresa=empresa2)
catalogo_oleo_girassol = CatalogoProduto.objects.create(nome="Óleo de Girassol", empresa=empresa2)

print(f"{CatalogoProduto.objects.count()} itens de catálogo cadastrados!")

# 3. Cria os fornecedores
fornecedor1 = Fornecedor.objects.create(
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
)

fornecedor2 = Fornecedor.objects.create(
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
)

fornecedor3 = Fornecedor.objects.create(
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
)

print(f"{Fornecedor.objects.count()} fornecedores cadastrados!")

# 4. Vincula cada fornecedor aos produtos do catálogo que ele pode fornecer (M2M)
fornecedor1.produtos.set([catalogo_arroz, catalogo_feijao])
fornecedor2.produtos.set([catalogo_feijao])
fornecedor3.produtos.set([catalogo_oleo, catalogo_acucar, catalogo_oleo_girassol])

print("Vínculos fornecedor <-> catálogo criados!")