import { useState, useEffect } from "react";
import styles from "../styles/Adicionar-fornecedor.module.css"
import { useNavigate, useParams } from "react-router-dom";
import { useEmpresa } from "../context/EmpresaContext";

function CadastrarFornecedor() {

    const { idEmpresa, idAdmin } = useEmpresa();
    const navigate = useNavigate();
    const { id } = useParams();
    const modoEdicao = Boolean(id);

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

    const [catalogo, setCatalogo] = useState([]);
    const [produtosSelecionados, setProdutosSelecionados] = useState([]);
    const [buscaProduto, setBuscaProduto] = useState("");

    const [carregandoFornecedor, setCarregandoFornecedor] = useState(modoEdicao);

    function atualizarCampo(campo, valor) {
        setForm((prev) => ({ ...prev, [campo]: valor }));
    }

    // Busca o catálogo geral da empresa (igual já era)
    useEffect(() => {
        if (!idEmpresa) return;

        fetch(`http://localhost:8000/api/empresa/${idEmpresa}/catalogo/`)
            .then((res) => res.json())
            .then((data) => setCatalogo(data))
            .catch((err) => console.error(err));

    }, [idEmpresa]);

    // NOVO: se estiver em modo edição, busca os dados do fornecedor e preenche o form
    useEffect(() => {
        if (!modoEdicao) return;

        fetch(`http://localhost:8000/api/fornecedor/${id}/`)
            .then((res) => {
                if (!res.ok) throw new Error("Fornecedor não encontrado");
                return res.json();
            })
            .then((data) => {
                setForm({
                    razao_social_fn: data.razao_social_fn || "",
                    nome_fantasia_fn: data.nome_fantasia_fn || "",
                    cnpj_fn: data.cnpj_fn || "",
                    cep: data.cep || "",
                    logradouro: data.logradouro || "",
                    bairro: data.bairro || "",
                    cidade: data.cidade || "",
                    uf: data.uf || "",
                    numero: data.numero || "",
                    complemento: data.complemento || "",
                    email_fn: data.email_fn || "",
                    nome_responsavel: data.nome_responsavel || "",
                    telefone_fn: data.telefone_fn || "",
                    ativo: data.ativo,
                });
                setProdutosSelecionados(data.produtos_info || []);
            })
            .catch((err) => {
                console.error(err);
                alert("Erro ao carregar dados do fornecedor");
            })
            .finally(() => setCarregandoFornecedor(false));

    }, [id, modoEdicao]);

    async function calcularCep(e) {
        e.preventDefault();
        const cepLimpo = form.cep.replace(/\D/g, "");

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

    function selecionarProduto(item) {
        if (produtosSelecionados.some((p) => p.id === item.id)) return;
        setProdutosSelecionados((prev) => [...prev, item]);
        setBuscaProduto("");
    }

    function removerProduto(id) {
        setProdutosSelecionados((prev) => prev.filter((p) => p.id !== id));
    }

    async function criarNovoProduto() {
        const nome = buscaProduto.trim();
        if (!nome) return;

        try {
            const response = await fetch("http://localhost:8000/api/catalogo/criar/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, id_empresa: idEmpresa }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.erro || "Erro ao criar produto");
                return;
            }

            setCatalogo((prev) => [...prev, { id: data.id, nome: data.nome }]);
            selecionarProduto({ id: data.id, nome: data.nome });

        } catch (error) {
            console.error(error);
            alert("Erro ao criar produto");
        }
    }

    const sugestoes = catalogo.filter(
        (item) =>
            item.nome.toLowerCase().includes(buscaProduto.toLowerCase()) &&
            !produtosSelecionados.some((p) => p.id === item.id)
    );

    const existeExato = catalogo.some(
        (item) => item.nome.toLowerCase() === buscaProduto.trim().toLowerCase()
    );

    async function handleSubmit(e) {
        e.preventDefault();

        const corpo = {
            ...form,
            id_empresa: idEmpresa,
            id_admin: idAdmin,
            produtos_ids: produtosSelecionados.map((p) => p.id),
        };

        const url = modoEdicao
            ? `http://localhost:8000/api/fornecedor/${id}/atualizar/`
            : "http://localhost:8000/api/fornecedor/criar/";
        const metodo = modoEdicao ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(corpo),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.erro || "Erro ao salvar fornecedor");
                return;
            }

            alert(modoEdicao ? "Fornecedor atualizado com sucesso!" : "Fornecedor cadastrado com sucesso!");
            navigate("/edição/fornecedores");

        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor");
        }
    }

    if (carregandoFornecedor) {
        return <p>Carregando dados do fornecedor...</p>;
    }

    return (
        <>
            <main>
                <label>{modoEdicao ? "Editar Fornecedor" : "Cadastrar Fornecedor"}</label>
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

                    <div className={styles.secaoProdutos}>
                        <label>Produtos Fornecidos</label>

                        <div className={styles.tagsSelecionadas}>
                            {produtosSelecionados.map((p) => (
                                <span key={p.id} className={styles.tag}>
                                    {p.nome}
                                    <button type="button" onClick={() => removerProduto(p.id)}>×</button>
                                </span>
                            ))}
                        </div>

                        <input
                            type="text"
                            placeholder="Buscar ou criar produto..."
                            value={buscaProduto}
                            onChange={(e) => setBuscaProduto(e.target.value)}
                        />

                        {buscaProduto && (
                            <ul className={styles.listaSugestoes}>
                                {sugestoes.map((item) => (
                                    <li key={item.id}>
                                        <button type="button" onClick={() => selecionarProduto(item)}>
                                            {item.nome}
                                        </button>
                                    </li>
                                ))}

                                {!existeExato && buscaProduto.trim() && (
                                    <li>
                                        <button type="button" onClick={criarNovoProduto}>
                                            Criar "{buscaProduto.trim()}"
                                        </button>
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>

                    <button type="submit">{modoEdicao ? "Salvar Alterações" : "Cadastrar"}</button>
                </form>
            </main>
        </>
    )
}

export default CadastrarFornecedor;