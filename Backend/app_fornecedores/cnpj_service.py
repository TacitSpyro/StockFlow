# app_fornecedores/cnpj_service.py
import re
import requests

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


def consultar_cnpj(cnpj):
    """
    Retorna a situação cadastral como texto, ou um status técnico:
      "ATIVA", "INAPTA", "BAIXADA", "SUSPENSA", "NULA"  -> vieram da Receita
      "NAO_ENCONTRADO"                                  -> API respondeu que não existe
      "INDISPONIVEL"                                    -> timeout/erro da API
    """
    try:
        resp = requests.get(URL_BRASILAPI.format(cnpj), timeout=5)
    except requests.RequestException:
        return {"situacao_cadastral": "INDISPONIVEL", "dados": {}}

    if resp.status_code in (400, 404):
        return {"situacao_cadastral": "NAO_ENCONTRADO", "dados": {}}
    if resp.status_code != 200:
        return {"situacao_cadastral": "INDISPONIVEL", "dados": {}}

    dados = resp.json()
    situacao = (dados.get("descricao_situacao_cadastral") or "").upper()
    return {"situacao_cadastral": situacao or "INDISPONIVEL", "dados": dados}