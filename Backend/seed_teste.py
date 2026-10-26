"""
Popula o banco com uma empresa de teste e histórico de pedidos para o Prophet.

Como rodar (na pasta do manage.py):

    python manage.py shell
    >>> exec(open("seed_teste.py", encoding="utf-8").read())

Pode rodar de novo quantas vezes quiser: os dados de teste anteriores
(empresa "Empresa Teste Prophet" e tudo ligado a ela) são apagados e recriados.
"""
import random
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.utils import timezone

from app_empresas.models import Empresa
from app_admin.models import Admin
from app_produtos.models import CatalogoProduto, Produto
from app_fornecedores.models import Fornecedor
from pedidos.models import PedidoCompra, ItemPedido

RNG = random.Random(42)  # semente fixa: os dados saem iguais a cada execução
HOJE = timezone.localdate()
NOME_EMPRESA = "Empresa Teste Prophet"
MATRICULA_ADMIN = 1001
SENHA_ADMIN = "teste123"


# ---------------------------------------------------------------- helpers
def gerar_cnpj(base12):
    """Completa 12 dígitos com os 2 dígitos verificadores (passa na validação local)."""
    def dv(base, pesos):
        soma = sum((ord(c) - 48) * p for c, p in zip(base, pesos))
        resto = soma % 11
        return 0 if resto < 2 else 11 - resto

    d1 = dv(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    d2 = dv(base12 + str(d1), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    return f"{base12}{d1}{d2}"


def dinheiro(valor):
    return Decimal(str(round(float(valor), 2)))


def limpar(empresa):
    # PROTECT nas FKs de fornecedor/catálogo: apaga pedidos e lotes antes
    PedidoCompra.objects.filter(empresa=empresa).delete()
    Produto.objects.filter(empresa=empresa).delete()
    empresa.delete()  # o resto (admin, catálogo, fornecedores) cai em cascata


_contador_numero = {}


def proximo_numero(ano):
    _contador_numero[ano] = _contador_numero.get(ano, 0) + 1
    return f"PC-{ano}-{_contador_numero[ano]:04d}"


_contador_lote = {"n": 0}


def proximo_lote(ano):
    _contador_lote["n"] += 1
    return f"L{ano}-{_contador_lote['n']:04d}"


# ---------------------------------------------------------------- limpeza
antiga = Empresa.objects.filter(nome_fantasia_emp=NOME_EMPRESA).first()
if antiga:
    limpar(antiga)
    print("Dados de teste anteriores removidos.")

# ---------------------------------------------------------------- empresa e admin
empresa = Empresa.objects.create(
    razao_social_emp="Empresa Teste Prophet LTDA",
    nome_fantasia_emp=NOME_EMPRESA,
    cnpj_emp=gerar_cnpj("102030400001"),
    endereco_emp="Rua das Flores, 100",
    telefone_emp="(11) 3000-0000",
    email_emp="contato@empresateste.com",
)

# ATENÇÃO: use a mesma função de hash que as suas views usam no cadastro de admin,
# senão o login desse usuário de teste não vai funcionar.
admin = Admin.objects.create(
    empresa=empresa,
    matricula=MATRICULA_ADMIN,
    nome_admin="Admin Teste",
    senha=make_password(SENHA_ADMIN),
)

# ---------------------------------------------------------------- catálogo
PRECO_BASE = {"Resina PP": 9.80, "Chapa de aço": 42.00, "Parafuso M8": 0.35}
QUANTIDADES = {
    "Resina PP": [100, 200, 300, 500],
    "Chapa de aço": [20, 40, 60],
    "Parafuso M8": [1000, 2000, 5000],
}
catalogo = {
    nome: CatalogoProduto.objects.create(nome=nome, empresa=empresa)
    for nome in PRECO_BASE
}

# ---------------------------------------------------------------- perfis de fornecedor
# Alfa: confiável, preço estável        | Beta: começa barato, sobe rápido, atrasa e avaria
# Gama: CNPJ inapto (testa o veto legal) e poucos pedidos (testa o mínimo do Prophet)
PERFIS = [
    dict(nome="Alfa Insumos Industriais", cnpj_base="112223330001", cidade="Campinas", uf="SP",
         cep="13010-000", situacao="ATIVA", produtos=["Resina PP", "Chapa de aço"],
         n_pedidos=36, intervalo=15, fator_preco=1.00, alta_mensal=0.004,
         var_medio=0.0, var_desvio=0.01, atraso_medio=0.5, atraso_desvio=1.0,
         fill_min=0.98, prob_avaria=0.10, taxa_avaria_max=0.02, frete="CIF"),
    dict(nome="Beta Distribuidora", cnpj_base="445556660001", cidade="Joinville", uf="SC",
         cep="89201-000", situacao="ATIVA", produtos=["Resina PP", "Chapa de aço"],
         n_pedidos=36, intervalo=15, fator_preco=0.90, alta_mensal=0.015,
         var_medio=0.02, var_desvio=0.03, atraso_medio=4.0, atraso_desvio=3.0,
         fill_min=0.88, prob_avaria=0.40, taxa_avaria_max=0.08, frete="FOB"),
    dict(nome="Gama Comércio de Metais", cnpj_base="778889990001", cidade="Belo Horizonte", uf="MG",
         cep="30110-000", situacao="INAPTA", produtos=["Chapa de aço", "Parafuso M8"],
         n_pedidos=12, intervalo=40, fator_preco=0.85, alta_mensal=0.0,
         var_medio=0.0, var_desvio=0.01, atraso_medio=1.0, atraso_desvio=1.0,
         fill_min=0.95, prob_avaria=0.10, taxa_avaria_max=0.02, frete="CIF"),
]


# ---------------------------------------------------------------- funções de pedido
def abrir_pedido(fornecedor, perfil, dia, prevista, nomes_produtos):
    """Cria o pedido ABERTO com a data de abertura no passado e os itens."""
    pedido = PedidoCompra.objects.create(
        empresa=empresa,
        fornecedor=fornecedor,
        numero=proximo_numero(dia.year),
        data_entrega_prevista=prevista,
        prazo_pagamento_dias=RNG.choice([0, 28, 30, 45]),
        tipo_frete=perfil["frete"],
        aberto_por=admin,
    )
    # data_pedido é auto_now_add: só dá para mudar com update()
    PedidoCompra.objects.filter(pk=pedido.pk).update(
        data_pedido=timezone.make_aware(datetime.combine(dia, time(9, 30)))
    )
    # refresh é obrigatório: sem ele o save() do fechar() sobrescreve a data de volta
    pedido.refresh_from_db()

    meses = (dia - perfil["_inicio"]).days / 30
    itens = []
    for nome in nomes_produtos:
        preco = PRECO_BASE[nome] * perfil["fator_preco"] * (1 + perfil["alta_mensal"]) ** meses
        preco *= 1 + RNG.gauss(0, 0.01)
        itens.append(ItemPedido.objects.create(
            pedido=pedido,
            catalogo=catalogo[nome],
            quantidade_pedida=RNG.choice(QUANTIDADES[nome]),
            preco_unitario_previsto=max(dinheiro(preco), Decimal("0.01")),
        ))
    return pedido, itens


def receber_pedido(pedido, itens, perfil, recebimento):
    """Preenche a parte 2 (recebimento) usando o próprio PedidoCompra.fechar()."""
    recebidos = []
    mercadoria = Decimal("0")
    for item in itens:
        recebida = round(item.quantidade_pedida * RNG.uniform(perfil["fill_min"], 1.0))
        avariada = 0
        if RNG.random() < perfil["prob_avaria"]:
            avariada = round(recebida * RNG.uniform(0, perfil["taxa_avaria_max"]))
        categoria = RNG.choice(["AMASSADO", "VENCIDO", "FORA_ESPECIFICACAO"]) if avariada else ""

        variacao = 1 + RNG.gauss(perfil["var_medio"], perfil["var_desvio"])
        final = max(dinheiro(float(item.preco_unitario_previsto) * variacao), Decimal("0.01"))
        mercadoria += final * recebida

        recebidos.append({
            "id": item.id,
            "quantidade_recebida": recebida,
            "quantidade_avariada": avariada,
            "categoria_avaria": categoria,
            "descricao_avaria": "Avaria registrada no recebimento" if avariada else "",
            "preco_unitario_final": final,
        })

    frete = dinheiro(float(mercadoria) * 0.04) if perfil["frete"] == "FOB" else Decimal("0")
    impostos = dinheiro(float(mercadoria) * 0.05)

    pedido.fechar(
        itens_recebidos=recebidos,
        data_recebimento=recebimento,
        valor_frete=frete,
        valor_impostos=impostos,
        admin=admin,
    )


def criar_lotes(pedido, fornecedor, k, n_pedidos):
    """Registra no estoque (tabela Produto) o que chegou neste pedido."""
    recebimento = pedido.data_recebimento
    for item in pedido.itens.select_related("catalogo"):
        recebida = item.quantidade_recebida or 0
        boa = recebida - (item.quantidade_avariada or 0)
        atual = int(boa * RNG.uniform(0.2, 1.0))

        if (item.quantidade_avariada or 0) > 0 and k >= n_pedidos - 3:
            situacao = Produto.Situacao.INSPECAO
        elif k < n_pedidos - 5 and RNG.random() < 0.5:
            situacao, atual = Produto.Situacao.ENCERRADO, 0
        else:
            situacao = Produto.Situacao.ATIVO

        lote = Produto.objects.create(
            catalogo=item.catalogo,
            fornecedor=fornecedor,
            lote=proximo_lote(recebimento.year),
            empresa=empresa,
            estoque_atual=atual,
            estoque_capacidade=((recebida // 100) + 1) * 100,
            situacao=situacao,
            data_fabricacao=recebimento - timedelta(days=RNG.randint(5, 40)),
            ala=RNG.choice(["A", "B", "C"]),
            secao=str(RNG.randint(1, 5)),
            prateleira=str(RNG.randint(1, 20)),
            descricao="Lote de teste",
            cadastrado_por=admin,
        )
        item.lote = lote
        item.save(update_fields=["lote"])


# ---------------------------------------------------------------- criação dos dados
resumo = []

for i, perfil in enumerate(PERFIS, start=1):
    fornecedor = Fornecedor.objects.create(
        empresa=empresa,
        razao_social_fn=f"{perfil['nome']} LTDA",
        nome_fantasia_fn=perfil["nome"],
        cnpj_fn=gerar_cnpj(perfil["cnpj_base"]),   # salvo limpo, sem máscara
        cep=perfil["cep"],
        logradouro="Av. Industrial",
        bairro="Distrito Industrial",
        cidade=perfil["cidade"],
        uf=perfil["uf"],
        numero="500",
        complemento="",
        email_fn=f"vendas{i}@fornecedor-teste.com",
        nome_responsavel="Responsável Teste",
        telefone_fn=f"(11) 99999-000{i}",
        ativo=True,
        cadastrado_por=admin,
        # preenchidos na mão: a consulta à Receita NÃO é feita no seed
        situacao_cadastral=perfil["situacao"],
        data_consulta_cnpj=timezone.now(),
    )
    fornecedor.produtos.set([catalogo[n].id for n in perfil["produtos"]])

    perfil["_inicio"] = HOJE - timedelta(days=perfil["n_pedidos"] * perfil["intervalo"] + 30)

    for k in range(perfil["n_pedidos"]):
        dia = perfil["_inicio"] + timedelta(days=k * perfil["intervalo"] + RNG.randint(-3, 3))
        prevista = dia + timedelta(days=RNG.choice([7, 10, 14]))
        atraso = max(-2, round(RNG.gauss(perfil["atraso_medio"], perfil["atraso_desvio"])))
        recebimento = min(max(prevista + timedelta(days=atraso), dia), HOJE)

        # o 1º produto vai em todo pedido; o 2º em metade deles
        nomes = perfil["produtos"][:1]
        if len(perfil["produtos"]) > 1 and RNG.random() < 0.5:
            nomes = perfil["produtos"]

        pedido, itens = abrir_pedido(fornecedor, perfil, dia, prevista, nomes)
        receber_pedido(pedido, itens, perfil, recebimento)

        if k >= perfil["n_pedidos"] - 8:   # só os mais recentes viram lotes no estoque
            criar_lotes(pedido, fornecedor, k, perfil["n_pedidos"])

    # pedidos ainda abertos, para testar a lista, o "atrasado" e a tela de fechar
    if perfil["situacao"] == "ATIVA":
        abrir_pedido(fornecedor, perfil, HOJE - timedelta(days=20), HOJE - timedelta(days=6),
                     perfil["produtos"][:1])      # aberto e ATRASADO
        abrir_pedido(fornecedor, perfil, HOJE - timedelta(days=3), HOJE + timedelta(days=9),
                     perfil["produtos"][:2])      # aberto e dentro do prazo

    resumo.append((fornecedor, perfil))

# ---------------------------------------------------------------- resumo
print("\nDados de teste criados.")
print(f"Empresa: {empresa.nome_fantasia_emp} (id {empresa.id_empresa})")
print(f"Login:   matrícula {MATRICULA_ADMIN} / senha {SENHA_ADMIN}")
print(f"Pedidos: {PedidoCompra.objects.filter(empresa=empresa).count()} | "
      f"Lotes: {Produto.objects.filter(empresa=empresa).count()}")
for fornecedor, perfil in resumo:
    fechados = PedidoCompra.objects.filter(
        fornecedor=fornecedor, status=PedidoCompra.Status.RECEBIDO).count()
    print(f"  id_fornecedor={fornecedor.id_fornecedor}  {perfil['nome']:<28} "
          f"{perfil['situacao']:<7}  {fechados} pedidos fechados")
