from datetime import datetime

from django.core.exceptions import ValidationError
from django.db.models import Q


def filtrar(request, qs, campos_texto, campos_data=None, campos_exatos=None):
    """
    Lê ?busca=...&campo=... e filtra o queryset.
      campos_texto:  {"nome": ["catalogo__nome"], ...}  -> contém (icontains), vários lookups = OU
      campos_data:   {"data": "data_fabricacao"}        -> data exata (YYYY-MM-DD)
      campos_exatos: {"situacao": "situacao"}           -> valor exato
    campo="todos" procura em todos os campos de texto.
    """
    busca = (request.GET.get("busca") or "").strip()
    campo = request.GET.get("campo") or "todos"

    if not busca:
        return qs

    if campos_data and campo in campos_data:
        try:
            data = datetime.strptime(busca, "%Y-%m-%d").date()
        except ValueError:
            return qs.none()
        return qs.filter(**{campos_data[campo]: data})

    if campos_exatos and campo in campos_exatos:
        try:
            return qs.filter(**{campos_exatos[campo]: busca})
        except (ValueError, ValidationError):
            return qs.none()

    if campo == "todos":
        lookups = [l for ls in campos_texto.values() for l in ls]
    elif campo in campos_texto:
        lookups = campos_texto[campo]
    else:
        return qs

    condicao = Q()
    for lookup in lookups:
        condicao |= Q(**{f"{lookup}__icontains": busca})
    return qs.filter(condicao)