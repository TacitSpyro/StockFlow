import Dropdown from "../components/Dropdown";
import { useState, useEffect} from "react";
import styles from "../styles/Adicionar-lote.module.css";
import retornar from "../assets/Retornar.png"
import { useEmpresa } from "../context/EmpresaContext";

function adicionarLote(){

    const { idEmpresa } = useEmpresa();

    const [fornecedores, setFornecedores] = useState([]);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState(null);

    const tipos = [
        {value: "madeira", label:"Madeira"},
        {value: "ferro", label:"Ferro"}
    ]

    const situacao = [
        {value: "ativo", label:"Ativo"},
        {value: "inspecao", label:"Em inspeção"},
        {value: "bloqueado", label:"Bloqueado"}
    ]

    const fornecedor = [
        {value: "não tem", label:"adicionar quando tive cadastro no db"}
    ]

    const ala = [
        {value: "A", label:"Ala 'B'"},
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

    function registrarLote(e){
        e.preventDefault();

        alert("ta funfando");
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
                // Transforma os dados do backend no formato que o Dropdown espera
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

    return(
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
                            <Dropdown
                                as="div"
                                name=""
                                label="Material"
                                items={tipos}
                            />
                    </div>
                        <div className={styles.linha2}>
                            <label>Quantidade Total</label>
                            <input type="number" placeholder="0/100" className={styles.quant}/>
                        </div>
                        <div className={styles.sdd}>
                            <Dropdown
                                as="div"
                                name=""
                                label="Situação"
                                items={situacao}
                            />
                        </div>
                    </div>
                    <div className={styles.linha3}>
                        <input type="text" placeholder="Lote do Fornecedor" className={styles.loteF}/>
                        <div className={styles.linha5}>
                            <label>Data de Registro</label>
                            <input type="date" className={styles.data}/>
                        </div>
                        <div>
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
                    </div>
                    <div className={styles.campodata}>
                        <div className={styles.linha6}>
                            <label>Data Do Recebimento</label>
                            <input type="date" className={styles.data}/>
                        </div>
                        <div className={styles.linha6}>
                            <label>Data Do Recebimento</label>
                            <input type="date" className={styles.data}/>
                        </div>
                    </div>
                </div>
                <button type="submit" id="add" className={styles.add}>Confirmar Registro</button>
            </form>
        </>
    )
}

export default adicionarLote;