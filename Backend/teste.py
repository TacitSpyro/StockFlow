from app_fornecedores.cnpj_service import consultar_cnpj
r = consultar_cnpj("24756311000143")
print(r["data_abertura"], r["porte"], r["capital_social"])
print(r["dados"].keys())   # se algum vier vazio, procure o nome certo aqui