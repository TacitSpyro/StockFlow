# app_pedidos/management/commands/importar_indices.py
from datetime import date
from django.core.management.base import BaseCommand
from pedidos.indices_service import SERIES, importar_indice


class Command(BaseCommand):
    help = "Importa IPCA, IGP-M e dólar do Banco Central"

    def add_arguments(self, parser):
        parser.add_argument("--inicio", default="2023-01-01")

    def handle(self, *args, **opts):
        inicio = date.fromisoformat(opts["inicio"])
        for nome in SERIES:
            qtd = importar_indice(nome, inicio, date.today())
            if qtd is None:
                self.stderr.write(f"{nome}: API indisponível")
            else:
                self.stdout.write(f"{nome}: {qtd} meses gravados")