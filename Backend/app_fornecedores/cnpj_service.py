# app_fornecedores/cnpj_service.py
import re
import requests
from decimal import Decimal

URL_BRASILAPI = "https://brasilapi.com.br/api/cnpj/v1/{}"


def limpar_cnpj(texto):
    """Mantém dígitos e letras (CNPJ alfanumérico) e coloca em maiúsculas."""
    return re.sub(r"[^0-9A-Za-z]", "", texto or "").upper()


def validar_cnpj(cnpj):
    """Formato + dígitos verificadores (funciona com CNPJ numérico e alfanumérico)."""
    if not re.fullmatch(r"[0-9A-Z]{12}[0-9]{2}", cnpj):
        return False
    if len(set(cnpj)) == 1:  # 00000000000000, 11111111111111...
        return False

    def dv(base, pesos):
        soma = sum((ord(c) - 48) * p for c, p in zip(base, pesos))
        resto = soma % 11
        return 0 if resto < 2 else 11 - resto

    d1 = dv(cnpj[:12], [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    d2 = dv(cnpj[:12] + str(d1), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    return cnpj[12:] == f"{d1}{d2}"


def _resultado(situacao, dados=None):
    dados = dados or {}
    return {
        "situacao_cadastral": situacao,
        "data_abertura": dados.get("data_inicio_atividade") or None,
        "porte": dados.get("porte") or "",
        "capital_social": Decimal(str(dados["capital_social"])) if dados.get("capital_social") is not None else None,
        "dados": dados,
    }


def consultar_cnpj(cnpj):
    """
    Retorna um dict com situacao_cadastral, data_abertura, porte, capital_social e dados.
    situacao_cadastral pode ser:
      "ATIVA", "INAPTA", "BAIXADA", "SUSPENSA", "NULA"  -> vieram da Receita
      "NAO_ENCONTRADO"                                  -> API respondeu que não existe
      "INDISPONIVEL"                                    -> timeout/erro da API
    """
    try:
        resp = requests.get(URL_BRASILAPI.format(cnpj), timeout=5)
    except requests.RequestException:
        return _resultado("INDISPONIVEL")

    if resp.status_code in (400, 404):
        return _resultado("NAO_ENCONTRADO")
    if resp.status_code != 200:
        return _resultado("INDISPONIVEL")

    dados = resp.json()
    situacao = (dados.get("descricao_situacao_cadastral") or "").upper()
    return _resultado(situacao or "INDISPONIVEL", dados)