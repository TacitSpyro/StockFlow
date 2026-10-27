"""
Camada 1 - Preço (Prophet + regressor opcional).

Recebe DataFrames e devolve números. Não importa models nem faz consultas.
"""
import numpy as np
import pandas as pd
from prophet import Prophet

from .util import escala

MIN_PONTOS = 12      # menos que isso e o Prophet não é confiável
MESES_FUTURO = 12


def analisar_item(serie, regressor=None, meses_futuro=MESES_FUTURO):
    """
    serie:     DataFrame mensal com colunas ds (início do mês) e y (preço médio).
    regressor: DataFrame mensal com colunas ds e valor (ex.: dólar), ou None.

    Devolve um dict, ou None se a série for curta demais.
    """
    if len(serie) < MIN_PONTOS:
        return None

    df = serie[["ds", "y"]].copy()
    df["ds"] = pd.to_datetime(df["ds"])

    # O regressor só entra se cobrir TODOS os meses do histórico
    usa_reg = False
    reg = None
    if regressor is not None:
        reg = regressor.rename(columns={"valor": "reg"})[["ds", "reg"]].copy()
        reg["ds"] = pd.to_datetime(reg["ds"])
        com_reg = df.merge(reg, on="ds", how="left")
        if com_reg["reg"].notna().all():
            df = com_reg
            usa_reg = True

    # Com menos de ~3 anos a sazonalidade anual fica instável (o próprio Prophet avisa),
    # e em testes ela piorou a previsão. Só liga com 36+ meses.
    m = Prophet(
        yearly_seasonality=len(df) >= 36,
        weekly_seasonality=False,
        daily_seasonality=False,
    )
    if usa_reg:
        m.add_regressor("reg")
    m.fit(df)

    futuro = m.make_future_dataframe(periods=meses_futuro, freq="MS")
    if usa_reg:
        futuro = futuro.merge(reg, on="ds", how="left")
        # meses futuros sem valor conhecido: repete a média dos últimos 3 meses
        futuro["reg"] = futuro["reg"].fillna(df["reg"].tail(3).mean())
    prev = m.predict(futuro)

    # Compara a média dos últimos 3 meses reais com a dos meses 10-12 do futuro.
    # São os mesmos meses do calendário, então a sazonalidade não distorce a conta.
    atual = float(df["y"].tail(3).mean())
    fut = prev.tail(3)
    previsto = float(fut["yhat"].mean())
    alta = (previsto / atual - 1) * 100
    alta_pess = (float(fut["yhat_upper"].mean()) / atual - 1) * 100

    # Maior mudança de tendência, com sinal e em unidade de preço por mês
    mudanca = None
    try:
        delta = m.params["delta"].mean(axis=0)
        meses_hist = m.t_scale / pd.Timedelta(days=30.44)
        por_mes = delta * m.y_scale / meses_hist
        i = int(np.argmax(np.abs(por_mes)))
        mudanca = {
            "data": str(pd.Timestamp(m.changepoints.iloc[i]).date()),
            "mudanca_por_mes": round(float(por_mes[i]), 4),
        }
    except Exception:
        pass

    nota = 0.7 * escala(alta, 15, 3) + 0.3 * escala(alta_pess, 25, 5)

    return {
        "preco_atual": round(atual, 2),
        "previsto_12m": round(previsto, 2),
        "alta_pct": round(alta, 1),
        "alta_pessimista_pct": round(alta_pess, 1),
        "nota": round(nota, 1),
        "usou_regressor": usa_reg,
        "mudanca_tendencia": mudanca,
    }


def consolidar(resultados):
    """
    Junta os resultados de vários itens de um fornecedor, ponderando pelo gasto.
    Cada resultado precisa ter a chave 'gasto' (o chamador adiciona).
    """
    validos = [r for r in resultados if r]
    if not validos:
        return {
            "nota": 50.0,
            "alta_pct": None,
            "alta_pessimista_pct": None,
            "motivos": ["histórico de preço insuficiente para prever"],
        }

    total = sum(r["gasto"] for r in validos) or 1.0

    def pond(campo):
        return sum(r[campo] * r["gasto"] for r in validos) / total

    alta = pond("alta_pct")
    motivos = []
    if alta >= 8:
        motivos.append(f"alta de preço prevista de {alta:.1f}% em 12 meses")
    elif alta >= 5:
        motivos.append(f"preço com tendência de alta ({alta:.1f}% em 12 meses)")

    return {
        "nota": round(pond("nota"), 1),
        "alta_pct": round(alta, 1),
        "alta_pessimista_pct": round(pond("alta_pessimista_pct"), 1),
        "motivos": motivos,
    }
