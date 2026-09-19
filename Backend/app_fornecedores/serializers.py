from rest_framework import serializers
from .models import Fornecedor

class FornecedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fornecedor
        fields = [
            "id_fornecedor", "razao_social_fn", "nome_fantasia_fn", "cnpj_fn",
            "cidade", "uf", "email_fn", "nome_responsavel", "telefone_fn", "ativo",
        ]