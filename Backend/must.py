# Rodar no shell do Django (python manage.py shell):
#   exec(open("checar_series.py", encoding="utf-8").read())
#
# O arquivo precisa estar na pasta de onde você abriu o shell (a do manage.py),
# ou use o caminho completo no open().

from django.db.models.functions import TruncMonth
from app_fornecedores.models import Fornecedor
from app_produtos.models import CatalogoProduto
from pedidos.models import ItemPedido

fornecedores = list(Fornecedor.objects.filter(cnpj_fn__startswith="99000000"))
catalogos = list(CatalogoProduto.objects.filter(nome__contains="sintético"))

print(f"{len(fornecedores)} fornecedores sintéticos | {len(catalogos)} itens sintéticos\n")

if not fornecedores or not catalogos:
    print("Nada encontrado: rode importar_historico antes (ou confira a empresa).")
else:
    problemas = 0
    for f in fornecedores:
        for c in catalogos:
            meses = (
                ItemPedido.objects
                .filter(
                    pedido__fornecedor=f,
                    catalogo=c,
                    pedido__status="RECEBIDO",
                    preco_unitario_final__isnull=False,
                )
                .annotate(ds=TruncMonth("pedido__data_pedido"))
                .values("ds")
                .distinct()
                .count()
            )
            marca = "OK " if meses >= 24 else "FALTA"
            if meses < 24:
                problemas += 1
            print(f"[{marca}] {f.nome_fantasia_fn} | {c.nome} | {meses} meses")

    print()
    print("Tudo certo." if problemas == 0 else f"{problemas} par(es) com menos de 24 meses.")