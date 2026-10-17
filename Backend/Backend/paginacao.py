from django.core.paginator import Paginator
from rest_framework.response import Response

TAMANHO_PADRAO = 20
TAMANHO_MAXIMO = 100


def paginar(request, queryset, serializar):
    pagina = request.GET.get("pagina")

    # sem ?pagina= devolve tudo (Home, dropdowns e outras telas continuam funcionando)
    if not pagina:
        return Response(serializar(queryset))

    try:
        tamanho = int(request.GET.get("tamanho", TAMANHO_PADRAO))
    except ValueError:
        tamanho = TAMANHO_PADRAO
    tamanho = max(1, min(tamanho, TAMANHO_MAXIMO))

    paginator = Paginator(queryset, tamanho)
    page = paginator.get_page(pagina)  # página inválida/fora do limite vira a mais próxima válida

    return Response({
        "resultados": serializar(page.object_list),
        "total": paginator.count,
        "pagina": page.number,
        "total_paginas": paginator.num_pages,
    })