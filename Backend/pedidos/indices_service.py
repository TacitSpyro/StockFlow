# app_pedidos/indices_service.py
from collections import defaultdict
from datetime import date, datetime
from decimal import Decimal

import requests

from .models import IndiceEconomico

URL_SGS = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados"

# codigo = série no SGS do Banco Central | agregar = como virar 1 valor por mês
SERIES = {
    "IPCA":  {"codigo": 433, "agregar": "ultimo"},  # variação mensal (%)
    "IGPM":  {"codigo": 189, "agregar": "ultimo"},  # variação mensal (%)
    "DOLAR": {"codigo": 1,   "agregar": "media"},   # venda, diária
}


def baixar_serie(codigo, data_inicial, data_final):
    """Devolve lista de (data, Decimal) ou None se a API falhar."""
    params = {
        "formato": "json",
        "dataInicial": data_inicial.strftime("%d/%m/%Y"),
        "dataFinal": data_final.strftime("%d/%m/%Y"),
    }
    try:
        resp = requests.get(URL_SGS.format(codigo=codigo), params=params, timeout=15)
        resp.raise_for_status()
        return [
            (datetime.strptime(p["data"], "%d/%m/%Y").date(), Decimal(p["valor"]))
            for p in resp.json()
        ]
    except (requests.RequestException, ValueError, KeyError):
        return None


def _para_mensal(pontos, como):
    por_mes = defaultdict(list)
    for dia, valor in pontos:
        por_mes[date(dia.year, dia.month, 1)].append(valor)
    if como == "media":
        return {m: sum(v) / len(v) for m, v in por_mes.items()}
    return {m: v[-1] for m, v in por_mes.items()}


def importar_indice(nome, data_inicial, data_final):
    """Baixa, agrega por mês e grava. Devolve quantos meses foram gravados."""
    cfg = SERIES[nome]
    pontos = baixar_serie(cfg["codigo"], data_inicial, data_final)
    if pontos is None:
        return None  # API indisponível: o chamador decide o que fazer
    mensal = _para_mensal(pontos, cfg["agregar"])
    for mes, valor in mensal.items():
        IndiceEconomico.objects.update_or_create(
            nome=nome, data=mes, defaults={"valor": valor.quantize(Decimal("0.000001"))}
        )
    return len(mensal)