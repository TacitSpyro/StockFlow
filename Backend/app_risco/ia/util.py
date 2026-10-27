def escala(valor, pior, melhor):
    """
    Converte um valor em nota de 0 a 100 por interpolação linear.

        valor == pior   -> 0
        valor == melhor -> 100

    Funciona nos dois sentidos (quando menor é melhor, é só passar pior > melhor).
    Valor ausente (None/NaN) vira nota neutra: 50.
    """
    if valor is None or valor != valor:
        return 50.0
    t = (valor - pior) / (melhor - pior)
    return round(max(0.0, min(1.0, t)) * 100, 1)
