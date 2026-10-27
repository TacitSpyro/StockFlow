# pedidos/management/commands/importar_historico.py
#
# Uso:
#   python manage.py importar_historico <id_empresa>
#   python manage.py importar_historico <id_empresa> --meses 24 --pedidos-por-mes 3
#   python manage.py importar_historico <id_empresa> --limpar     (apaga os SIM- e recria)
#
# Lembre de ter os arquivos __init__.py em:
#   pedidos/management/__init__.py
#   pedidos/management/commands/__init__.py

import math
import random
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from app_empresas.models import Empresa
from app_fornecedores.models import Fornecedor
from app_produtos.models import CatalogoProduto
from pedidos.models import ItemPedido, PedidoCompra

PREFIXO = "SIM-"  # todo pedido sintético começa com isso (facilita limpar)

# nome do item -> preço base
ITENS = {
    "Item A (sintético)": 50.0,
    "Item B (sintético)": 120.0,
    "Item C (sintético)": 300.0,
    "Item D (sintético)": 15.0,
}

# O comportamento que você "planta" em cada fornecedor
PERFIS = [
    {"nome": "Alfa Metais",       "alta_anual": 0.03, "volatil": 0.01, "atraso": 0.05, "defeito": 0.01},
    {"nome": "Beta Insumos",      "alta_anual": 0.15, "volatil": 0.02, "atraso": 0.10, "defeito": 0.02},
    {"nome": "Gama Plásticos",    "alta_anual": 0.05, "volatil": 0.06, "atraso": 0.15, "defeito": 0.03},
    {"nome": "Delta Embalagens",  "alta_anual": 0.04, "volatil": 0.02, "atraso": 0.05, "defeito": 0.01, "salto_mes": 16},
    {"nome": "Épsilon Logística", "alta_anual": 0.06, "volatil": 0.02, "atraso": 0.05, "defeito": 0.02, "piora_entrega_mes": 14},
]


def ultimos_meses(n):
    """Os n meses completos antes do mês atual, do mais antigo ao mais recente."""
    hoje = date.today()
    ano, mes = hoje.year, hoje.month
    meses = []
    for _ in range(n):
        mes -= 1
        if mes == 0:
            ano, mes = ano - 1, 12
        meses.append(date(ano, mes, 1))
    return list(reversed(meses))


def dinheiro(valor):
    return Decimal(str(round(valor, 2)))


class Command(BaseCommand):
    help = "Cria fornecedores fictícios e um histórico sintético de pedidos já fechados"

    def add_arguments(self, parser):
        parser.add_argument("empresa_id", type=int)
        parser.add_argument("--meses", type=int, default=24)
        parser.add_argument("--pedidos-por-mes", type=int, default=3)
        parser.add_argument("--seed", type=int, default=7)
        parser.add_argument("--limpar", action="store_true")

    @transaction.atomic
    def handle(self, *args, **opts):
        random.seed(opts["seed"])

        try:
            empresa = Empresa.objects.get(pk=opts["empresa_id"])
        except Empresa.DoesNotExist:
            raise CommandError("Empresa não encontrada")

        existentes = PedidoCompra.objects.filter(empresa=empresa, numero__startswith=PREFIXO)
        if existentes.exists():
            if not opts["limpar"]:
                raise CommandError("Já existem pedidos SIM- nessa empresa. Use --limpar para recriar.")
            existentes.delete()  # os itens saem junto (CASCADE)

        # 1) catálogo de produtos
        catalogos = []
        for nome in ITENS:
            cat, _ = CatalogoProduto.objects.get_or_create(nome=nome, empresa=empresa)
            catalogos.append(cat)

        # 2) fornecedores fictícios (cadastro vazio = camada 4 neutra)
        fornecedores = []
        for idx, perfil in enumerate(PERFIS, start=1):
            forn, _ = Fornecedor.objects.get_or_create(
                empresa=empresa,
                cnpj_fn=f"9900000000{idx:04d}",  # 14 dígitos, claramente falso
                defaults={
                    "razao_social_fn": f"{perfil['nome']} Ltda",
                    "nome_fantasia_fn": perfil["nome"],
                    "cep": "00000-000",
                    "email_fn": f"contato{idx}@exemplo.com",
                    "nome_responsavel": "Responsável Sintético",
                    "telefone_fn": "(00) 00000-0000",
                },
            )
            forn.produtos.set(catalogos)
            fornecedores.append(forn)

        # 3) pedidos
        meses = ultimos_meses(opts["meses"])
        hoje = date.today()
        total_pedidos = 0
        total_itens = 0
        seq = 0

        for forn, perfil in zip(fornecedores, PERFIS):
            base_item = {c.id: ITENS[c.nome] * random.uniform(0.9, 1.1) for c in catalogos}

            for i, mes in enumerate(meses):
                tendencia = (1 + perfil["alta_anual"]) ** (i / 12)
                sazonal = 1 + 0.03 * math.sin(2 * math.pi * mes.month / 12)
                salto = 1.12 if perfil.get("salto_mes") is not None and i >= perfil["salto_mes"] else 1.0

                prob_atraso = perfil["atraso"]
                if perfil.get("piora_entrega_mes") is not None and i >= perfil["piora_entrega_mes"]:
                    prob_atraso += 0.25

                for k in range(opts["pedidos_por_mes"]):
                    seq += 1
                    # o 1º pedido do mês leva todos os itens (sem buracos na série);
                    # os extras levam só alguns
                    itens_do_pedido = catalogos if k == 0 else random.sample(catalogos, 2)

                    data_ped = timezone.make_aware(
                        datetime(mes.year, mes.month, random.randint(1, 27), 10, 0)
                    )
                    prevista = data_ped.date() + timedelta(days=10)
                    atraso = random.randint(1, 8) if random.random() < prob_atraso else 0
                    recebimento = min(prevista + timedelta(days=atraso), hoje)

                    pedido = PedidoCompra.objects.create(
                        empresa=empresa,
                        fornecedor=forn,
                        numero=f"{PREFIXO}{seq:06d}",
                        data_pedido=data_ped,
                        data_entrega_prevista=prevista,
                        prazo_pagamento_dias=random.choice([0, 28, 30, 45]),
                        tipo_frete=random.choice(["CIF", "FOB"]),
                    )

                    recebidos = []
                    total_mercadoria = 0.0
                    for cat in itens_do_pedido:
                        preco = base_item[cat.id] * tendencia * sazonal * salto * random.gauss(1, perfil["volatil"])
                        preco_final = preco * random.gauss(1, 0.01)  # pequena divergência do combinado
                        qtd = random.randint(20, 200)
                        fill = 1.0 if random.random() > 0.1 else random.uniform(0.85, 0.99)
                        recebida = max(1, int(qtd * fill))
                        avariada = int(recebida * max(0.0, random.gauss(perfil["defeito"], 0.01)))

                        item = ItemPedido.objects.create(
                            pedido=pedido,
                            catalogo=cat,
                            quantidade_pedida=qtd,
                            preco_unitario_previsto=dinheiro(preco),
                        )
                        total_mercadoria += preco_final * recebida
                        recebidos.append({
                            "id": item.id,
                            "quantidade_recebida": recebida,
                            "quantidade_avariada": avariada,
                            "categoria_avaria": "AMASSADO" if avariada else "",
                            "descricao_avaria": "Dado sintético" if avariada else "",
                            "preco_unitario_final": dinheiro(preco_final),
                        })
                        total_itens += 1

                    pedido.fechar(
                        itens_recebidos=recebidos,
                        data_recebimento=recebimento,
                        valor_frete=dinheiro(random.uniform(50, 300)),
                        valor_impostos=dinheiro(total_mercadoria * 0.08),
                        observacoes="Pedido sintético",
                    )
                    total_pedidos += 1

        self.stdout.write(self.style.SUCCESS(
            f"{len(fornecedores)} fornecedores, {total_pedidos} pedidos e {total_itens} itens criados."
        ))