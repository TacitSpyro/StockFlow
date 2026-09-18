from app_empresas.models import Empresa

Empresas = [
{
        "razao_social_emp": "Auto Peças Rápido Ltda",
        "nome_fantasia_emp": "Rápido Auto Peças",
        "cnpj_emp": "56.789.012/0001-34",
        "endereco_emp": "Av. dos Mecânicos, 654 - Porto Alegre/RS",
        "telefone_emp": "(51) 95678-9012",
        "email_emp": "contato@rapidoautopecas.com.br",
    },
{
        "razao_social_emp": "Construtora Horizonte Ltda",
        "nome_fantasia_emp": "Horizonte Construções",
        "cnpj_emp": "34.567.890/0001-12",
        "endereco_emp": "Rua Engenheiro Souza, 789 - Belo Horizonte/MG",
        "telefone_emp": "(31) 93456-7890",
        "email_emp": "contato@horizonteconstrucoes.com.br",
    },

]

for dados in Empresas:
    Empresa.objects.create(**dados)

print(f"{Empresa.objects.count()} empresas cadastradas!")