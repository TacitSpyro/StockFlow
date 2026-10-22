from rest_framework import serializers
from .models import Fornecedor

class FornecedorSerializer(serializers.ModelSerializer):

    cnpj_formatado = serializers.ReadOnlyField()

    class Meta:
        model = Fornecedor
        fields = [
            "id_fornecedor", "razao_social_fn", "nome_fantasia_fn", "cnpj_fn","cnpj_formatado",
            "cidade", "uf", "email_fn", "nome_responsavel", "telefone_fn", "ativo", "data_cadastro","situacao_cadastral",
        ]