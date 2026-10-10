import { useState, useEffect } from "react";
import styles from "../styles/Adicionar-fornecedor.module.css"
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEmpresa } from "../context/EmpresaContext";
import retornar from "../assets/Retornar.png"

function CadastrarFornecedor() {

    const { idEmpresa, idAdmin } = useEmpresa();
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const modoEdicao = Boolean(id) && location.pathname.startsWith("/adicionar-fornecedor");
    const somenteLeitura = Boolean(id) && location.pathname.startsWith("/visualizar-fornecedor");
    const precisaCarregarDados = modoEdicao || somenteLeitura;

    const handleClick = () => {
         navigate('/edição/fornecedores');
    }

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

    const [carregandoFornecedor, setCarregandoFornecedor] = useState(precisaCarregarDados);

    function atualizarCampo(campo, valor) {
        if (somenteLeitura) return;
        setForm((prev) => ({ ...prev, [campo]: valor }));
    }

    useEffect(() => {
        if (!idEmpresa) return;

        fetch(`http://localhost:8000/api/empresa/${idEmpresa}/catalogo/`)
            .then((res) => res.json())
            .then((data) => setCatalogo(data))
            .catch((err) => console.error(err));

    }, [idEmpresa]);

    // Busca os dados do fornecedor, tanto pra edição quanto pra visualização
    useEffect(() => {
        if (!precisaCarregarDados) return;

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

    }, [id, precisaCarregarDados]);

    async function calcularCep(e) {
        e.preventDefault();
        if (somenteLeitura) return;

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
        if (somenteLeitura) return;
        if (produtosSelecionados.some((p) => p.id === item.id)) return;
        setProdutosSelecionados((prev) => [...prev, item]);
        setBuscaProduto("");
    }

    function removerProduto(id) {
        if (somenteLeitura) return;
        setProdutosSelecionados((prev) => prev.filter((p) => p.id !== id));
    }

    async function criarNovoProduto() {
        if (somenteLeitura) return;
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
        if (somenteLeitura) return;

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

    const tituloTela = somenteLeitura ? "Visualizar Fornecedor" : modoEdicao ? "Editar Fornecedor" : "Cadastrar Fornecedor";

    return (
        <>

            <div className={styles.topbar}>
                <img src={retornar} alt="retornar" className="navbar-img"/>
                <a href="/edição/fornecedores">{somenteLeitura ? "Voltar" : "Retornar"}</a>
            </div>

            <main className={styles.main}>
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.emcima}>
                        <label>{tituloTela}</label>
                        <div style={{fontSize: '120%'}}>
                            <input
                                type="checkbox"
                                checked={form.ativo}
                                onChange={(e) => atualizarCampo("ativo", e.target.checked)}
                                name="ativo"
                                id="ativo"
                                disabled={somenteLeitura}
                                />
                            <label htmlFor="ativo">Ativo</label>
                        </div>
                    </div>
                    <div className={styles.secao1}>
                        <label>Dados da empresa</label>
                        <div className={styles.coluna1}>
                            <div className={styles.concatenar}>
                                <label>Razão Social</label>
                                <input
                                    className={styles.razao}
                                    type="text"
                                    placeholder="Razão Social"
                                    value={form.razao_social_fn}
                                    onChange={(e) => atualizarCampo("razao_social_fn", e.target.value)}
                                    disabled={somenteLeitura}
                                />
                            </div>
                            <div className={styles.concatenar}>
                                <label>Nome Fantasia</label>
                                <input
                                className={styles.nomeF}
                                    type="text"
                                    placeholder="Nome Fantasia"
                                    value={form.nome_fantasia_fn}
                                    onChange={(e) => atualizarCampo("nome_fantasia_fn", e.target.value)}
                                    disabled={somenteLeitura}
                                />
                            </div>
                            <div className={styles.concatenar}>
                                <label>CNPJ</label>
                                <input
                                    type="text"
                                    placeholder="CNPJ"
                                    value={form.cnpj_fn}
                                    onChange={(e) => atualizarCampo("cnpj_fn", e.target.value)}
                                    disabled={somenteLeitura}
                                />
                            </div>
                        </div>
                        <div className={styles.coluna2}>
                            <label>Endereço</label>
                            <div style={{display: 'flex', marginTop: '1%'}}>
                                <div className={styles.concatenar} style={{marginRight: '15%'}}>
                                    <label>CEP</label>
                                    <input
                                        type="text"
                                        placeholder="00000-000"
                                        value={form.cep}
                                        onChange={(e) => atualizarCampo("cep", e.target.value)}
                                        onBlur={calcularCep}
                                        disabled={somenteLeitura}
                                    />
                                </div>
                                <div className={styles.concatenar} style={{marginRight: '15%'}}>
                                    <label>Número</label>
                                    <input
                                        type="text"
                                        placeholder="Número"
                                        value={form.numero}
                                        onChange={(e) => atualizarCampo("numero", e.target.value)}
                                        disabled={somenteLeitura}
                                    />
                                </div>
                                <div className={styles.concatenar}>
                                    <label>Complemento(opcional)</label>
                                    <input
                                        type="text"
                                        placeholder="Complemento"
                                        value={form.complemento}
                                        onChange={(e) => atualizarCampo("complemento", e.target.value)}
                                        disabled={somenteLeitura}
                                        style={{width: '315%'}}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={styles.secao2}>
                            <label style={{marginBottom: '1%'}}>Contato</label>
                            <div className={styles.coluna3} style={{marginBottom: '3%'}}>
                                <div className={styles.concatenar} style={{marginRight: '25%'}}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={form.email_fn}
                                        onChange={(e) => atualizarCampo("email_fn", e.target.value)}
                                        disabled={somenteLeitura}
                                        style={{width: '170%'}}
                                    />
                                </div>
                                <div className={styles.concatenar} style={{marginRight: '35%'}}>
                                    <label>Nome do Responsável</label>
                                    <input
                                        type="text"
                                        placeholder="Nome do Responsável"
                                        value={form.nome_responsavel}
                                        onChange={(e) => atualizarCampo("nome_responsavel", e.target.value)}
                                        disabled={somenteLeitura}
                                        style={{width: '240%'}}
                                    />
                                </div>
                                <div className={styles.concatenar}>
                                    <label>Telefone</label>
                                    <input
                                        type="text"
                                        placeholder="(00) 00000-0000"
                                        value={form.telefone_fn}
                                        onChange={(e) => atualizarCampo("telefone_fn", e.target.value)}
                                        disabled={somenteLeitura}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.secaoProdutos}>
                        <label>Produtos Fornecidos</label>

                        <div className={styles.tagsSelecionadas}>
                            {produtosSelecionados.map((p) => (
                                <span key={p.id} className={styles.tag}>
                                    {p.nome}
                                    {!somenteLeitura && (
                                        <button type="button" onClick={() => removerProduto(p.id)}>×</button>
                                    )}
                                </span>
                            ))}
                        </div>

                        {!somenteLeitura && (
                            <>
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
                                                <button className={styles.botaoDaLista} type="button" onClick={() => selecionarProduto(item)}>
                                                    {item.nome}
                                                </button>
                                            </li>
                                        ))}

                                        {!existeExato && buscaProduto.trim() && (
                                            <li>
                                                <button className={styles.botaoCriar} type="button" onClick={criarNovoProduto}>
                                                    Criar "{buscaProduto.trim()}"
                                                </button>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </>
                        )}
                    </div>

                    <div style={{display: 'flex'}}>
                        <button className={styles.retornar} type="button" onClick={handleClick}>Cancelar</button>
                        {!somenteLeitura && (
                            <button className={styles.cadastrar} type="submit">{modoEdicao ? "Salvar Alterações" : "Cadastrar"}</button>
                        )}
                    </div>
                </form>
            </main>
        </>
    )
}

export default CadastrarFornecedor;