"""
Camada 2 - Desempenho do fornecedor (sem IA, só indicadores).

Recebe um DataFrame com uma linha por item de pedido e as colunas:
ds, pedido_id, atraso_dias, fill_rate, taxa_avaria, variacao_preco.
"""
import pandas as pd

from .util import escala

JANELA_RECENTE_MESES = 6
PESO_RECENTE = 0.6   # o que aconteceu nos últimos meses pesa mais que o histórico todo


def _metricas(df):
    pedidos = df.drop_duplicates("pedido_id")  # atraso é do pedido, não do item
    atrasados = pedidos.loc[pedidos["atraso_dias"] > 0, "atraso_dias"]
    var_preco = df["variacao_preco"].mean()
    return {
        "pct_no_prazo": float((pedidos["atraso_dias"] <= 0).mean()),
        "atraso_medio_dias": float(atrasados.mean()) if len(atrasados) else 0.0,
        "fill_rate": float(df["fill_rate"].mean()),
        "taxa_avaria": float(df["taxa_avaria"].mean()),
        # só conta quando pagou MAIS que o combinado
        "divergencia_preco": float(max(var_preco, 0.0)) if var_preco == var_preco else 0.0,
    }


def _nota(m):
    partes = {
        "prazo": escala(m["pct_no_prazo"], 0.60, 0.95),
        "avaria": escala(m["taxa_avaria"], 0.08, 0.01),
        "entrega_completa": escala(m["fill_rate"], 0.85, 0.98),
        "preco_combinado": escala(m["divergencia_preco"], 0.05, 0.005),
    }
    nota = (0.40 * partes["prazo"] + 0.25 * partes["avaria"]
            + 0.20 * partes["entrega_completa"] + 0.15 * partes["preco_combinado"])
    return round(nota, 1), partes


def calcular_desempenho(itens):
    if itens.empty:
        return {"nota": 50.0, "motivos": ["sem pedidos recebidos"], "total": None, "recente": None}

    corte = itens["ds"].max() - pd.DateOffset(months=JANELA_RECENTE_MESES - 1)
    recente_df = itens[itens["ds"] >= corte]

    m_total, m_recente = _metricas(itens), _metricas(recente_df)
    nota_total, _ = _nota(m_total)
    nota_recente, partes_recente = _nota(m_recente)
    nota = PESO_RECENTE * nota_recente + (1 - PESO_RECENTE) * nota_total

    motivos = []
    if m_recente["pct_no_prazo"] < 0.80:
        motivos.append(f"só {m_recente['pct_no_prazo']:.0%} das entregas no prazo nos últimos "
                       f"{JANELA_RECENTE_MESES} meses")
    if m_recente["pct_no_prazo"] < m_total["pct_no_prazo"] - 0.10:
        motivos.append("pontualidade de entrega piorando")
    if m_recente["taxa_avaria"] > 0.04:
        motivos.append(f"taxa de avaria de {m_recente['taxa_avaria']:.1%} nos últimos meses")
    if m_recente["divergencia_preco"] > 0.02:
        motivos.append(f"preço final {m_recente['divergencia_preco']:.1%} acima do combinado")

    return {
        "nota": round(nota, 1),
        "motivos": motivos,
        "total": {k: round(v, 4) for k, v in m_total.items()},
        "recente": {k: round(v, 4) for k, v in m_recente.items()},
        "notas_parciais_recente": partes_recente,
    }
