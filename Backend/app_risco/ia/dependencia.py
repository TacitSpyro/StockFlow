"""Camada 3 - Dependência: quanto do gasto total da empresa vai para este fornecedor."""
from .util import escala


def calcular_dependencia(gasto_fornecedor, gasto_total):
    if not gasto_total:
        return {"nota": 50.0, "share": None, "motivos": []}

    share = gasto_fornecedor / gasto_total
    motivos = []
    if share >= 0.40:
        motivos.append(f"concentra {share:.0%} do seu gasto (alta dependência)")

    return {
        "nota": escala(share, 0.60, 0.25),
        "share": round(share, 4),
        "motivos": motivos,
    }
