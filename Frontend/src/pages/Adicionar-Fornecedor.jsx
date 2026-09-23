import { useState } from "react";
import styles from "../styles/Adicionar-fornecedor.module.css"
import { useEmpresa } from "../context/EmpresaContext";

function CadastrarFornecedor() {

    const { idEmpresa, idAdmin } = useEmpresa();

    const [form, setForm] = useState({
        razao_social_fn: "",
        nome_fantasia_fn: "",
        cnpj_fn: "",
        cep: "",
        logradouro: "",
        bairro: "",
        cidade: "",
        uf: "",
        numero: "",
        complemento: "",
        email_fn: "",
        nome_responsavel: "",
        telefone_fn: "",
        ativo: true,
    });

    function atualizarCampo(campo, valor) {
        setForm((prev) => ({ ...prev, [campo]: valor }));
    }

    async function calcularCep(e) {
        e.preventDefault();

        const cepLimpo = form.cep.replace(/\D/g, ""); // tira tudo que não é número

        if (cepLimpo.length !== 8) {
            alert("CEP inválido");
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();

            if (data.erro) {
                alert("CEP não encontrado");
                return;
            }

            setForm((prev) => ({
                ...prev,
                logradouro: data.logradouro || "",
                bairro: data.bairro || "",
                cidade: data.localidade || "",
                uf: data.uf || "",
            }));

        } catch (error) {
            console.error(error);
            alert("Erro ao buscar CEP");
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:8000/api/fornecedor/criar/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    id_empresa: idEmpresa,
                    id_admin: idAdmin,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.erro || "Erro ao cadastrar fornecedor");
                return;
            }

            alert("Fornecedor cadastrado com sucesso!");

        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor");
        }
    }

    return (
        <>
            <main>
                <label>Cadastrar Fornecedor</label>
                <form onSubmit={handleSubmit}>
                    <div className={styles.secao1}>
                        <div className={styles.coluna1}>
                            <input
                                type="text"
                                placeholder="Razão Social"
                                value={form.razao_social_fn}
                                onChange={(e) => atualizarCampo("razao_social_fn", e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Nome Fantasia"
                                value={form.nome_fantasia_fn}
                                onChange={(e) => atualizarCampo("nome_fantasia_fn", e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="CNPJ"
                                value={form.cnpj_fn}
                                onChange={(e) => atualizarCampo("cnpj_fn", e.target.value)}
                            />
                        </div>
                        <div className={styles.coluna2}>
                            <input
                                type="text"
                                placeholder="CEP"
                                value={form.cep}
                                onChange={(e) => atualizarCampo("cep", e.target.value)}
                                onBlur={calcularCep}
                            />
                            <input
                                type="text"
                                placeholder="Número"
                                value={form.numero}
                                onChange={(e) => atualizarCampo("numero", e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Complemento (opcional)"
                                value={form.complemento}
                                onChange={(e) => atualizarCampo("complemento", e.target.value)}
                            />
                        </div>
                        <div className={styles.secao2}>
                            <div className={styles.coluna3}>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={form.email_fn}
                                    onChange={(e) => atualizarCampo("email_fn", e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Nome do Responsável"
                                    value={form.nome_responsavel}
                                    onChange={(e) => atualizarCampo("nome_responsavel", e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Telefone"
                                    value={form.telefone_fn}
                                    onChange={(e) => atualizarCampo("telefone_fn", e.target.value)}
                                />
                                <input
                                    type="checkbox"
                                    checked={form.ativo}
                                    onChange={(e) => atualizarCampo("ativo", e.target.checked)}
                                    name="ativo"
                                    id="ativo"
                                />
                                <label htmlFor="ativo">Ativo</label>
                            </div>
                        </div>
                    </div>

                    <button type="submit">Cadastrar</button>
                </form>
            </main>
        </>
    )
}

export default CadastrarFornecedor;