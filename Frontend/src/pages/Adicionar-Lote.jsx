import Dropdown from "../components/Dropdown";
import { useState, useEffect } from "react";
import styles from "../styles/Adicionar-lote.module.css";
import retornar from "../assets/Retornar.png"
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEmpresa } from "../context/EmpresaContext";

function AdicionarLote() {

    const { idEmpresa, idAdmin } = useEmpresa();
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const modoEdicao = Boolean(id) && location.pathname.startsWith("/adicionar-lote");
    const somenteLeitura = Boolean(id) && location.pathname.startsWith("/visualizar-lote");
    const precisaCarregarDados = modoEdicao || somenteLeitura;

    const [fornecedores, setFornecedores] = useState([]);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState(null);

    const [tipos, setTipos] = useState([]);
    const [materialSelecionado, setMaterialSelecionado] = useState(null);
    const [carregandoTipos, setCarregandoTipos] = useState(false);

    const [situacaoSelecionada, setSituacaoSelecionada] = useState(null);
    const [alaSelecionada, setAlaSelecionada] = useState(null);
    const [secaoSelecionada, setSecaoSelecionada] = useState(null);
    const [prateleiraSelecionada, setPrateleiraSelecionada] = useState(null);

    const handleClick = () => {
         navigate('/edição/produtos');
    }

    const [form, setForm] = useState({
        lote: "",
        estoque_atual: "",
        estoque_capacidade: "",
        data_fabricacao: "",
        data_encerramento: "",
        descricao: "",
    });

    const [carregandoProduto, setCarregandoProduto] = useState(precisaCarregarDados);

    const situacao = [
        {value: "ATIVO", label:"Ativo"},
        {value: "INSPECAO", label:"Em inspeção"},
        {value: "BLOQUEIO", label:"Bloqueado"},
        {value: "ENCERRADO", label:"Encerrado"},
    ]
    const ala = [
        {value: "A", label:"Ala 'A'"}, {value: "B", label:"Ala 'B'"}, {value: "C", label:"Ala 'C'"}
    ]
    const secao = [
        {value: "1", label:"Seção 1"}, {value: "2", label:"Seção 2"},
        {value: "3", label:"Seção 3"}, {value: "4", label:"Seção 4"}
    ]
    const prateleira = [
        {value: "1", label:"Primeira"}, {value: "2", label:"Segunda"},
        {value: "3", label:"Terceira"}, {value: "4", label:"Quarta"},
        {value: "5", label:"Quinta"}, {value: "6", label:"Sexta"},
        {value: "7", label:"Sétima"}, {value: "8", label:"Oitava"}
    ]

    function handleSelecionarFornecedor(valor) {
        if (somenteLeitura) return;
        setFornecedorSelecionado(valor);
        setMaterialSelecionado(null);
    }

    function atualizarCampo(campo, valor) {
        if (somenteLeitura) return; // trava edição
        setForm((prev) => ({ ...prev, [campo]: valor }));
    }

    function selecionarComTravar(setter) {
        return (valor) => {
            if (somenteLeitura) return;
            setter(valor);
        };
    }

    useEffect(() => {
        if (!idEmpresa) return;
        setCarregando(true);
        setErro(null);

        fetch(`http://localhost:8000/api/empresa/${idEmpresa}/fornecedores/`)
            .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
            .then((data) => {
                setFornecedores(data.map((f) => ({ value: f.id_fornecedor, label: f.razao_social_fn })));
            })
            .catch(() => { setErro("Não foi possível carregar os fornecedores"); setFornecedores([]); })
            .finally(() => setCarregando(false));
    }, [idEmpresa]);

    // Busca os dados do lote, tanto pra edição quanto pra visualização
    useEffect(() => {
        if (!precisaCarregarDados) return;

        fetch(`http://localhost:8000/api/produto/${id}/`)
            .then((res) => {
                if (!res.ok) throw new Error("Produto não encontrado");
                return res.json();
            })
            .then((data) => {
                setFornecedorSelecionado(data.fornecedor);
                setMaterialSelecionado(data.catalogo);
                setSituacaoSelecionada(data.situacao);
                setAlaSelecionada(data.ala);
                setSecaoSelecionada(data.secao);
                setPrateleiraSelecionada(data.prateleira);
                setForm({
                    lote: data.lote || "",
                    estoque_atual: data.estoque_atual ?? "",
                    estoque_capacidade: data.estoque_capacidade ?? "",
                    data_fabricacao: data.data_fabricacao || "",
                    data_encerramento: data.data_encerramento ? data.data_encerramento.slice(0, 10) : "",
                    descricao: data.descricao || "",
                });
            })
            .catch((err) => {
                console.error(err);
                alert("Erro ao carregar dados do lote");
            })
            .finally(() => setCarregandoProduto(false));

    }, [id, precisaCarregarDados]);

    useEffect(() => {
        if (!fornecedorSelecionado) {
            setTipos([]);
            return;
        }

        setCarregandoTipos(true);

        fetch(`http://localhost:8000/api/fornecedor/${fornecedorSelecionado}/catalogo/`)
            .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
            .then((data) => setTipos(data.map((p) => ({ value: p.id, label: p.nome }))))
            .catch(() => setTipos([]))
            .finally(() => setCarregandoTipos(false));

    }, [fornecedorSelecionado]);

    async function registrarLote(e) {
        e.preventDefault();
        if (somenteLeitura) return;

        if (!fornecedorSelecionado || !materialSelecionado || !situacaoSelecionada) {
            alert("Preencha fornecedor, material e situação");
            return;
        }

        const corpo = {
            ...form,
            catalogo: materialSelecionado,
            fornecedor: fornecedorSelecionado,
            situacao: situacaoSelecionada,
            ala: alaSelecionada,
            secao: secaoSelecionada,
            prateleira: prateleiraSelecionada,
            id_empresa: idEmpresa,
            id_admin: idAdmin,
        };

        const url = modoEdicao
            ? `http://localhost:8000/api/produto/${id}/atualizar/`
            : "http://localhost:8000/api/produto/criar/";
        const metodo = modoEdicao ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(corpo),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.erro || "Erro ao salvar lote");
                return;
            }

            alert(modoEdicao ? "Lote atualizado com sucesso!" : "Lote registrado com sucesso!");
            navigate("/edição/produtos");

        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor");
        }
    }

    if (carregandoProduto) {
        return <p>Carregando dados do lote...</p>;
    }

    const tituloTela = somenteLeitura ? "Visualizar Lote" : modoEdicao ? "Editar Lote" : "Cadastrar Lote";

    return (
        <>
            <div className={styles.topbar}>
                <img src={retornar} alt="retornar" className="navbar-img"/>
                <a href="/edição/produtos">{somenteLeitura ? "Voltar" : "Cancelar"}</a>
            </div>

            <form onSubmit={registrarLote} className={styles.container}>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <label style={{fontSize: '250%'}}>{tituloTela}</label>
                    <label htmlFor="Origem" style={{marginTop: '3%'}}>Origem</label>
                </div>
                    <div className={styles.linha1}>
            
                            <div className={styles.coluna}>
                                <small>Fornecedor</small>
                                <div className={styles.segura}>
                                    {carregando && <p>Carregando fornecedores...</p>}
                                    {erro && <p>{erro}</p>}
                                    {!carregando && !erro && (
                                        <Dropdown
                                            as="div"
                                            label={
                                                fornecedorSelecionado
                                                    ? fornecedores.find(f => f.value === fornecedorSelecionado)?.label
                                                    : "Selecione um fornecedor"
                                            }
                                            items={fornecedores}
                                            selected={fornecedorSelecionado}
                                            onSelect={handleSelecionarFornecedor}
                                            disabled={somenteLeitura}
                                        />
                                    )}
                                </div>
                            </div>
                        

                        <div>
                            <div className={styles.coluna}>
                                <small>Produto</small>
                                <div className={styles.segura}>
                                    {!fornecedorSelecionado && <p>Selecione um fornecedor primeiro</p>}
                                    {carregandoTipos && <p>Carregando produtos...</p>}
                                    {fornecedorSelecionado && !carregandoTipos && (
                                        <Dropdown
                                            as="div"
                                            label={
                                                materialSelecionado
                                                    ? tipos.find(t => t.value === materialSelecionado)?.label ?? "Selecione um material"
                                                    : "Selecione um material"
                                            }
                                            items={tipos}
                                            selected={materialSelecionado}
                                            onSelect={selecionarComTravar(setMaterialSelecionado)}
                                            disabled={somenteLeitura}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={styles.coluna}>
                            <div className={styles.coluna}>
                                <small>Lote do Fornecedor</small>
                                <input
                                    type="text"
                                    placeholder="Ex: L 2026 A24"
                                    className={styles.loteF}
                                    value={form.lote}
                                    onChange={(e) => atualizarCampo("lote", e.target.value)}
                                    disabled={somenteLeitura}
                                />
                            </div>
                        </div>
                        <div className={styles.linha6}>
                            <small>Data de Fabricação</small>
                            <input
                                type="date"
                                className={styles.data}
                                value={form.data_fabricacao}
                                onChange={(e) => atualizarCampo("data_fabricacao", e.target.value)}
                                disabled={somenteLeitura}
                            />
                        </div>
                    </div>            
                        <div className={styles.linha2}>
                            <label htmlFor="Estoque" style={{marginTop: '1%', marginBottom: '1%'}}>Estoque</label>
                            <div style={{display: 'flex'}}>
                                <div className={styles.coluna}>
                                    <small>Estoque Atual</small>
                                    <input
                                        style={{width: '500px', margin: '0'}}
                                        type="number"
                                        placeholder="0"
                                        className={styles.quant}
                                        value={form.estoque_atual}
                                        onChange={(e) => atualizarCampo("estoque_atual", e.target.value)}
                                        disabled={somenteLeitura}
                                    />
                                </div>
                                <div className={styles.coluna}>
                                    <small>Capacidade</small>
                                    <input
                                        style={{width: '500px', margin: '0'}}
                                        type="number"
                                        placeholder="100"
                                        className={styles.quant}
                                        value={form.estoque_capacidade}
                                        onChange={(e) => atualizarCampo("estoque_capacidade", e.target.value)}
                                        disabled={somenteLeitura}
                                    />
                                </div>
                                <div className={styles.coluna}>
                                    <small style={{marginBottom: '1%'}}>Situação</small>
                                    <div className={styles.sdd}>
                                        <Dropdown
                                            as="div"
                                            label={
                                                situacaoSelecionada
                                                    ? situacao.find(s => s.value === situacaoSelecionada)?.label
                                                    : "Situação"
                                            }
                                            items={situacao}
                                            selected={situacaoSelecionada}
                                            onSelect={selecionarComTravar(setSituacaoSelecionada)}
                                            disabled={somenteLeitura}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    {situacaoSelecionada === "ENCERRADO" && (
                        <div className={styles.linha5}>
                            <label style={{marginBottom: '1%'}}>Data de Encerramento</label>
                            <input
                                type="date"
                                className={styles.data}
                                value={form.data_encerramento}
                                onChange={(e) => atualizarCampo("data_encerramento", e.target.value)}
                                disabled={somenteLeitura}
                                style={{width: '94%'}}
                            />
                            {!somenteLeitura && <small>Se não preencher, será usada a data/hora do registro</small>}
                        </div>
                    )}

                    <div className={styles.linha3}>
                        <label htmlFor="Localizacao" style={{marginBottom: '1%'}}>Localização</label>
                        <div style={{display: 'flex', justifyContent: 'space-between', width: '70%'}}>
                            <div>
                                <small>Ala</small>
                                <div className={styles.segura}>
                                    <Dropdown
                                        as="div"
                                        label={alaSelecionada ? ala.find(a => a.value === alaSelecionada)?.label : "Ala"}
                                        items={ala}
                                        selected={alaSelecionada}
                                        onSelect={selecionarComTravar(setAlaSelecionada)}
                                        disabled={somenteLeitura}
                                    />
                                </div>
                            </div>
                            <div>
                                <small>Seção</small>
                                <div className={styles.segura}>
                                    <Dropdown
                                        as="div"
                                        label={secaoSelecionada ? secao.find(s => s.value === secaoSelecionada)?.label : "Seção"}
                                        items={secao}
                                        selected={secaoSelecionada}
                                        onSelect={selecionarComTravar(setSecaoSelecionada)}
                                        disabled={somenteLeitura}
                                    />
                                </div>
                            </div>
                            <div>
                                <small>Prateleira</small>
                                <div className={styles.segura}>
                                    <Dropdown
                                        as="div"
                                        label={prateleiraSelecionada ? prateleira.find(p => p.value === prateleiraSelecionada)?.label : "Prateleira"}
                                        items={prateleira}
                                        selected={prateleiraSelecionada}
                                        onSelect={selecionarComTravar(setPrateleiraSelecionada)}
                                        disabled={somenteLeitura}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.campodata}>
                        <div className={styles.linha6}>
                            <label style={{marginBottom: '3%'}}>Descrição (opcional)</label>
                            <input
                                type="text"
                                placeholder="Observações sobre o lote"
                                className={styles.data}
                                value={form.descricao}
                                onChange={(e) => atualizarCampo("descricao", e.target.value)}
                                disabled={somenteLeitura}
                                style={{width: '486%'}}
                            />
                        </div>
                    </div>
                <div style={{display: 'flex'}}>
                    <button className={styles.retornar} type="button" onClick={handleClick}>Cancelar</button>
                    {!somenteLeitura && (
                        <button type="submit" id="add" className={styles.add}>
                            {modoEdicao ? "Salvar Alterações" : "Confirmar Registro"}
                        </button>
                    )}
                </div>
            </form>
        </>
    )
}

export default AdicionarLote;