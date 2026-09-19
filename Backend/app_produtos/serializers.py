from rest_framework import serializers
from .models import Produto

class ProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = [
            "id", "nome", "lote", "estoque_atual", "estoque_capacidade",
            "situacao", "data_fabricacao", "ala", "secao", "prateleira",
            "descricao",
        ]