"""
Camada 4 - Cadastro (regra simples sobre os dados do CNPJ).

"Não sei" (campo vazio, NAO_ENCONTRADO, INDISPONIVEL) cai em nota neutra:
ausência de informação não é sinal de risco.
"""

PIORES = ("BAIXADA", "NULA")
RUINS = ("INAPTA", "SUSPENSA")


def calcular_cadastro(situacao, idade_anos):
    situacao = (situacao or "").upper()

    if situacao in PIORES:
        return {"nota": 0.0, "verificado": True,
                "motivos": [f"situação cadastral na Receita: {situacao}"]}

    if situacao in RUINS:
        return {"nota": 20.0, "verificado": True,
                "motivos": [f"situação cadastral na Receita: {situacao}"]}

    if situacao == "ATIVA":
        if idade_anos is not None and idade_anos < 2:
            return {"nota": 70.0, "verificado": True,
                    "motivos": ["empresa aberta há menos de 2 anos"]}
        return {"nota": 100.0, "verificado": True, "motivos": []}

    # vazio, NAO_ENCONTRADO, INDISPONIVEL...
    return {"nota": 50.0, "verificado": False, "motivos": []}
