from rest_framework import serializers
from .models import Produto

class ProdutoSerializer(serializers.ModelSerializer):
    nome = serializers.CharField(source='catalogo.nome', read_only=True)
    fornecedor_nome = serializers.CharField(source='fornecedor.nome_fantasia_fn', read_only=True)

    class Meta:
        model = Produto
        fields = [
            "id", "nome", "lote", "estoque_atual", "estoque_capacidade",
            "situacao", "data_fabricacao", "data_encerramento", "ala", "secao", "prateleira",
            "descricao", "fornecedor_nome",
        ]