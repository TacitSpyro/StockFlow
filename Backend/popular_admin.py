from django.contrib.auth.hashers import make_password
from app_empresas.models import Empresa
from app_admin.models import Admin

# Busca as empresas já cadastradas
empresas = list(Empresa.objects.all()[:2])
empresa1 = empresas[0]
empresa2 = empresas[1] if len(empresas) > 1 else empresas[0]

admins = [
    Admin.objects.create(
        empresa=empresa1,
        matricula=10001,
        nome_admin="João Pedro Alves",
        senha=make_password("senha123"),
    ),
    Admin.objects.create(
        empresa=empresa2,
        matricula=10002,
        nome_admin="Fernanda Costa Lima",
        senha=make_password("senha456"),
    ),
]

print(f"{Admin.objects.count()} admins cadastrados!")