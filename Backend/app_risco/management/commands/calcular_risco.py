# Uso:
#   python manage.py calcular_risco <id_empresa>
#   python manage.py calcular_risco <id_empresa> --indice IPCA      (IPCA, IGPM, DOLAR)
#   python manage.py calcular_risco <id_empresa> --indice nenhum    (Prophet sem regressor)

import logging
from datetime import date

import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from app_empresas.models import Empresa
from app_fornecedores.models import Fornecedor
from app_produtos.models import CatalogoProduto
from pedidos.models import IndiceEconomico, ItemPedido
from app_risco.ia import cadastro, dependencia, desempenho, preco, score
from app_risco.models import AvaliacaoRisco

# silencia o log barulhento do Stan/Prophet
_log = logging.getLogger("cmdstanpy")
_log.addHandler(logging.NullHandler())
_log.propagate = False
_log.setLevel(logging.CRITICAL)
logging.getLogger("prophet").setLevel(logging.WARNING)


class Command(BaseCommand):
    help = "Calcula o score de risco de cada fornecedor e salva em AvaliacaoRisco"

    def add_arguments(self, parser):
        parser.add_argument("empresa_id", type=int)
        parser.add_argument("--indice", default="nenhum",
                            help="Regressor do Prophet: IPCA, IGPM, DOLAR ou 'nenhum' (padrão). "
                                 "Com dados sintéticos o regressor só adiciona ruído.")

    # ---------- leitura do banco ----------
    def carregar_itens(self, empresa):
        qs = (ItemPedido.objects
              .filter(pedido__empresa=empresa, pedido__status="RECEBIDO",
                      preco_unitario_final__isnull=False, quantidade_recebida__isnull=False)
              .select_related("pedido"))
        linhas = []
        for it in qs.iterator():
            p = it.pedido
            d = timezone.localtime(p.data_pedido)
            preco_final = float(it.preco_unitario_final)
            linhas.append({
                "fornecedor_id": p.fornecedor_id,
                "catalogo_id": it.catalogo_id,
                "pedido_id": p.id,
                "ds": date(d.year, d.month, 1),
                "preco": preco_final,
                "qtd": it.quantidade_recebida,
                "gasto": preco_final * it.quantidade_recebida,
                "atraso_dias": p.atraso_dias,
                "fill_rate": it.fill_rate,
                "taxa_avaria": it.taxa_avaria,
                "variacao_preco": it.variacao_preco,
            })
        if not linhas:
            raise CommandError("Nenhum item de pedido RECEBIDO nessa empresa.")
        df = pd.DataFrame(linhas)
        df["ds"] = pd.to_datetime(df["ds"])
        return df

    def carregar_indice(self, nome):
        dados = list(IndiceEconomico.objects.filter(nome=nome).values_list("data", "valor"))
        if not dados:
            return None
        reg = pd.DataFrame(dados, columns=["ds", "valor"])
        reg["ds"] = pd.to_datetime(reg["ds"])
        reg["valor"] = reg["valor"].astype(float)
        return reg

    # ---------- execução ----------
    def handle(self, *args, **opts):
        try:
            empresa = Empresa.objects.get(pk=opts["empresa_id"])
        except Empresa.DoesNotExist:
            raise CommandError("Empresa não encontrada")

        df = self.carregar_itens(empresa)

        nome_indice = opts["indice"].upper()
        reg = None
        if nome_indice != "NENHUM":
            reg = self.carregar_indice(nome_indice)
            if reg is None:
                self.stderr.write(f"Índice {nome_indice} vazio: rodando sem regressor "
                                  f"(use importar_indices).")
                nome_indice = "NENHUM"

        nomes_item = dict(CatalogoProduto.objects.filter(empresa=empresa).values_list("id", "nome"))

        # janela de 12 meses para a dependência
        corte_12m = df["ds"].max() - pd.DateOffset(months=11)
        janela = df[df["ds"] >= corte_12m]
        gasto_total = float(janela["gasto"].sum())

        resultados = []
        sem_pedidos = 0

        for forn in Fornecedor.objects.filter(empresa=empresa, ativo=True):
            dff = df[df["fornecedor_id"] == forn.pk]
            if dff.empty:
                sem_pedidos += 1
                continue

            # --- camada 1: um Prophet por item ---
            itens_res = []
            for cat_id, grupo in dff.groupby("catalogo_id"):
                g = (grupo.groupby("ds")
                     .agg(gasto=("gasto", "sum"), qtd=("qtd", "sum"))
                     .reset_index().sort_values("ds"))
                g["y"] = g["gasto"] / g["qtd"]
                try:
                    r = preco.analisar_item(g[["ds", "y"]], reg)
                except Exception as e:
                    self.stderr.write(f"  aviso: {forn.nome_fantasia_fn} / "
                                      f"{nomes_item.get(cat_id, cat_id)}: {e}")
                    r = None
                if r:
                    r["gasto"] = float(grupo["gasto"].sum())
                    r["item"] = nomes_item.get(cat_id, str(cat_id))
                itens_res.append(r)
            c_preco = preco.consolidar(itens_res)

            # --- camadas 2, 3 e 4 ---
            c_desemp = desempenho.calcular_desempenho(dff)
            gasto_forn = float(janela.loc[janela["fornecedor_id"] == forn.pk, "gasto"].sum())
            c_dep = dependencia.calcular_dependencia(gasto_forn, gasto_total)
            c_cad = cadastro.calcular_cadastro(forn.situacao_cadastral, forn.idade_anos)

            notas = {
                "preco": c_preco["nota"],
                "desempenho": c_desemp["nota"],
                "dependencia": c_dep["nota"],
                "cadastro": c_cad["nota"],
            }
            final = score.calcular_score(notas)
            nivel = score.nivel_risco(final)
            motivos = (c_preco["motivos"] + c_desemp["motivos"]
                       + c_dep["motivos"] + c_cad["motivos"])

            AvaliacaoRisco.objects.update_or_create(
                empresa=empresa, fornecedor=forn,
                defaults={
                    "score_final": final,
                    "nivel": nivel,
                    "nota_preco": notas["preco"],
                    "nota_desempenho": notas["desempenho"],
                    "nota_dependencia": notas["dependencia"],
                    "nota_cadastro": notas["cadastro"],
                    "alta_prevista_pct": c_preco["alta_pct"],
                    "alta_pessimista_pct": c_preco["alta_pessimista_pct"],
                    "motivos": motivos,
                    "detalhes": {
                        "indice_usado": nome_indice,
                        "itens": [r for r in itens_res if r],
                        "desempenho": c_desemp,
                        "dependencia": c_dep,
                        "cadastro": c_cad,
                    },
                },
            )
            resultados.append((forn.nome_fantasia_fn, final, nivel, notas, c_preco["alta_pct"], motivos))

        # ---------- resumo no terminal (mais arriscados primeiro) ----------
        resultados.sort(key=lambda x: x[1])
        self.stdout.write("")
        self.stdout.write(f"{'Fornecedor':<22}{'Score':>6}  {'Risco':<6}{'Preço':>7}{'Desemp':>8}"
                          f"{'Depend':>8}{'Cadast':>8}{'Alta 12m':>10}")
        for nome, final, nivel, n, alta, _ in resultados:
            alta_txt = f"{alta:+.1f}%" if alta is not None else "n/d"
            self.stdout.write(f"{nome:<22}{final:>6.1f}  {nivel:<6}{n['preco']:>7.1f}"
                              f"{n['desempenho']:>8.1f}{n['dependencia']:>8.1f}"
                              f"{n['cadastro']:>8.1f}{alta_txt:>10}")
        self.stdout.write("")
        for nome, _, _, _, _, motivos in resultados:
            if motivos:
                self.stdout.write(f"{nome}: " + "; ".join(motivos))
        if sem_pedidos:
            self.stdout.write(f"\n{sem_pedidos} fornecedor(es) sem pedidos recebidos foram ignorados.")
        self.stdout.write(self.style.SUCCESS(
            f"\n{len(resultados)} fornecedores avaliados (índice: {nome_indice})."))
