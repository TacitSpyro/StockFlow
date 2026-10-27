"""
Junta as 4 camadas num score final de 0 a 100.
Quanto MAIOR o score, mais seguro é o fornecedor.
"""

PESOS = {
    "preco": 0.40,
    "desempenho": 0.30,
    "dependencia": 0.15,
    "cadastro": 0.15,
}

LIMITE_BAIXO = 70   # score >= 70  -> risco BAIXO
LIMITE_MEDIO = 45   # score >= 45  -> risco MEDIO; abaixo disso, ALTO


def calcular_score(notas):
    """notas = {"preco": 80, "desempenho": 60, "dependencia": 100, "cadastro": 50}"""
    return round(sum(notas[camada] * peso for camada, peso in PESOS.items()), 1)


def nivel_risco(score):
    if score >= LIMITE_BAIXO:
        return "BAIXO"
    if score >= LIMITE_MEDIO:
        return "MEDIO"
    return "ALTO"
