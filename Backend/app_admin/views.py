from django.contrib.auth.hashers import check_password
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Admin
from app_empresas.models import Empresa

@api_view(['POST'])
def login_admin(request):
    id_empresa = request.data.get("id_empresa")
    matricula = request.data.get("matricula")
    senha_digitada = request.data.get("senha")

    if not id_empresa or not matricula or not senha_digitada:
        return Response({"erro": "Preencha todos os campos"}, status=400)

    # 1. Confere se a empresa existe
    try:
        empresa = Empresa.objects.get(id_empresa=id_empresa)
    except Empresa.DoesNotExist:
        return Response({"erro": "Empresa não encontrada"}, status=404)

    # 2. Confere se existe um admin com essa matrícula NESSA empresa
    try:
        admin = Admin.objects.get(matricula=matricula, empresa=empresa)
    except Admin.DoesNotExist:
        return Response({"erro": "Matrícula não encontrada nessa empresa"}, status=404)

    # 3. Confere a senha
    if not check_password(senha_digitada, admin.senha):
        return Response({"erro": "Senha incorreta"}, status=401)

    # Tudo certo
    return Response({
        "sucesso": True,
        "id_admin": admin.id_admin,
        "nome_admin": admin.nome_admin,
        "matricula": admin.matricula,
        "id_empresa": empresa.id_empresa,
        "nome_fantasia_emp": empresa.nome_fantasia_emp,
    })