import Dropdown from "../components/Dropdown";
import { useState, useEffect } from "react";
import styles from "../styles/Adicionar-lote.module.css";
import retornar from "../assets/Retornar.png"
import { useNavigate } from "react-router-dom";
import { useEmpresa } from "../context/EmpresaContext";

function AdicionarLote() {

    const { idEmpresa, idAdmin } = useEmpresa();
    const navigate = useNavigate();

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

    const [form, setForm] = useState({
        lote: "",
        estoque_atual: "",
        estoque_capacidade: "",
        data_fabricacao: "",
        data_encerramento: "",
        descricao: "",
    });

    const situacao = [
        {value: "ATIVO", label:"Ativo"},
        {value: "INSPECAO", label:"Em inspeção"},
        {value: "BLOQUEIO", label:"Bloqueado"},
        {value: "ENCERRADO", label:"Encerrado"},
    ]

    const ala = [
        {value: "A", label:"Ala 'A'"},
        {value: "B", label:"Ala 'B'"},
        {value: "C", label:"Ala 'C'"}
    ]

    const secao = [
        {value: "1", label:"Seção 1"},
        {value: "2", label:"Seção 2"},
        {value: "3", label:"Seção 3"},
        {value: "4", label:"Seção 4"}
    ]

    const prateleira = [
        {value: "1", label:"Primeira"},
        {value: "2", label:"Segunda"},
        {value: "3", label:"Terceira"},
        {value: "4", label:"Quarta"},
        {value: "5", label:"Quinta"},
        {value: "6", label:"Sexta"},
        {value: "7", label:"Sétima"},
        {value: "8", label:"Oitava"}
    ]

    function atualizarCampo(campo, valor) {
        setForm((prev) => ({ ...prev, [campo]: valor }));
    }

    useEffect(() => {
        if (!idEmpresa) return;

        setCarregando(true);
        setErro(null);

        fetch(`http://localhost:8000/api/empresa/${idEmpresa}/fornecedores/`)
            .then((res) => {
                if (!res.ok) throw new Error("Erro ao buscar fornecedores");
                return res.json();
            })
            .then((data) => {
                const opcoes = data.map((f) => ({
                    value: f.id_fornecedor,
                    label: f.razao_social_fn,
                }));
                setFornecedores(opcoes);
            })
            .catch((err) => {
                console.error(err);
                setErro("Não foi possível carregar os fornecedores");
                setFornecedores([]);
            })
            .finally(() => setCarregando(false));

    }, [idEmpresa]);

    useEffect(() => {
        if (!fornecedorSelecionado) {
            setTipos([]);
            setMaterialSelecionado(null);
            return;
        }

        setCarregandoTipos(true);
        setMaterialSelecionado(null);

        fetch(`http://localhost:8000/api/fornecedor/${fornecedorSelecionado}/catalogo/`)
            .then((res) => {
                if (!res.ok) throw new Error("Erro ao buscar catálogo do fornecedor");
                return res.json();
            })
            .then((data) => {
                const opcoes = data.map((p) => ({
                    value: p.id,
                    label: p.nome,
                }));
                setTipos(opcoes);
            })
            .catch((err) => {
                console.error(err);
                setTipos([]);
            })
            .finally(() => setCarregandoTipos(false));

    }, [fornecedorSelecionado]);

    async function registrarLote(e) {
        e.preventDefault();

        if (!fornecedorSelecionado || !materialSelecionado || !situacaoSelecionada) {
            alert("Preencha fornecedor, material e situação");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/produto/criar/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    catalogo: materialSelecionado,
                    fornecedor: fornecedorSelecionado,
                    situacao: situacaoSelecionada,
                    ala: alaSelecionada,
                    secao: secaoSelecionada,
                    prateleira: prateleiraSelecionada,
                    id_empresa: idEmpresa,
                    id_admin: idAdmin,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.erro || "Erro ao registrar lote");
                return;
            }

            alert("Lote registrado com sucesso!");
            navigate("/edição/produtos");

        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor");
        }
    }

    return (
        <>
            <div className={styles.topbar}>
                <img src={retornar} alt="retornar" className="navbar-img"/>
                <a href="/edição/produtos">Cancelar</a>
            </div>

            <form onSubmit={registrarLote} className={styles.container}>

                <label>Cadastrar Lote</label>

                <div className={styles.cadLot}>
                    <div className={styles.linha1}>
                        <div className={styles.segura}>
                            <label htmlFor="fornecedor">Fornecedor</label>

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
                                    onSelect={setFornecedorSelecionado}
                                />
                            )}
                        </div>

                        <div className={styles.segura}>
                            <label htmlFor="material">Material</label>

                            {!fornecedorSelecionado && <p>Selecione um fornecedor primeiro</p>}
                            {carregandoTipos && <p>Carregando produtos...</p>}

                            {fornecedorSelecionado && !carregandoTipos && (
                                <Dropdown
                                    as="div"
                                    label={
                                        materialSelecionado
                                            ? tipos.find(t => t.value === materialSelecionado)?.label
                                            : "Selecione um material"
                                    }
                                    items={tipos}
                                    selected={materialSelecionado}
                                    onSelect={setMaterialSelecionado}
                                />
                            )}
                        </div>

                        <div className={styles.linha2}>
                            <label>Estoque Atual</label>
                            <input
                                type="number"
                                placeholder="0"
                                className={styles.quant}
                                value={form.estoque_atual}
                                onChange={(e) => atualizarCampo("estoque_atual", e.target.value)}
                            />
                            <label>Capacidade</label>
                            <input
                                type="number"
                                placeholder="100"
                                className={styles.quant}
                                value={form.estoque_capacidade}
                                onChange={(e) => atualizarCampo("estoque_capacidade", e.target.value)}
                            />
                        </div>

                        <div className={styles.sdd}>
                            <label htmlFor="situacao">Situação</label>
                            <Dropdown
                                as="div"
                                label={
                                    situacaoSelecionada
                                        ? situacao.find(s => s.value === situacaoSelecionada)?.label
                                        : "Situação"
                                }
                                items={situacao}
                                selected={situacaoSelecionada}
                                onSelect={setSituacaoSelecionada}
                            />
                        </div>
                    </div>

                    
                    {situacaoSelecionada === "ENCERRADO" && (
                        <div className={styles.linha5}>
                            <label>Data de Encerramento (opcional)</label>
                            <input
                                type="date"
                                className={styles.data}
                                value={form.data_encerramento}
                                onChange={(e) => atualizarCampo("data_encerramento", e.target.value)}
                            />
                            <small>Se não preencher, será usada a data/hora do registro</small>
                        </div>
                    )}

                    <div className={styles.linha3}>
                        <input
                            type="text"
                            placeholder="Lote do Fornecedor"
                            className={styles.loteF}
                            value={form.lote}
                            onChange={(e) => atualizarCampo("lote", e.target.value)}
                        />

                        <div className={styles.segura}>
                            <label htmlFor="ala">Ala</label>
                            <Dropdown
                                as="div"
                                label={
                                    alaSelecionada
                                        ? ala.find(a => a.value === alaSelecionada)?.label
                                        : "Ala"
                                }
                                items={ala}
                                selected={alaSelecionada}
                                onSelect={setAlaSelecionada}
                            />
                        </div>

                        <div className={styles.segura}>
                            <label htmlFor="secao">Seção</label>
                            <Dropdown
                                as="div"
                                label={
                                    secaoSelecionada
                                        ? secao.find(s => s.value === secaoSelecionada)?.label
                                        : "Seção"
                                }
                                items={secao}
                                selected={secaoSelecionada}
                                onSelect={setSecaoSelecionada}
                            />
                        </div>

                        <div className={styles.segura}>
                            <label htmlFor="prateleira">Prateleira</label>
                            <Dropdown
                                as="div"
                                label={
                                    prateleiraSelecionada
                                        ? prateleira.find(p => p.value === prateleiraSelecionada)?.label
                                        : "Prateleira"
                                }
                                items={prateleira}
                                selected={prateleiraSelecionada}
                                onSelect={setPrateleiraSelecionada}
                            />
                        </div>
                    </div>

                    <div className={styles.campodata}>
                        <div className={styles.linha6}>
                            <label>Data de Fabricação</label>
                            <input
                                type="date"
                                className={styles.data}
                                value={form.data_fabricacao}
                                onChange={(e) => atualizarCampo("data_fabricacao", e.target.value)}
                            />
                        </div>
                        <div className={styles.linha6}>
                            <label>Descrição (opcional)</label>
                            <input
                                type="text"
                                className={styles.data}
                                value={form.descricao}
                                onChange={(e) => atualizarCampo("descricao", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <button type="submit" id="add" className={styles.add}>Confirmar Registro</button>
            </form>
        </>
    )
}

export default AdicionarLote;