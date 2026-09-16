import Dropdown from "../components/Dropdown";
import { useState } from "react";
import styles from "../styles/Adicionar-lote.module.css";
import retornar from "../assets/Retornar.png"

function adicionarLote(){

    const [modo, setModo] = useState('madeira')

    const tipos = [
        {value: "madeira", label:"Madeira"},
        {value: "ferro", label:"Ferro"}
    ]

    const situacao = [
        {value: "ativo", label:"Ativo"},
        {value: "inspecao", label:"Em inspeção"},
        {value: "bloqueado", label:"Bloqueado"}
    ]

    function registrarLote(e){
        e.preventDefault();

        alert("ta funfando");
    }


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
                                label={modo ? tipos.find(o => o.value === modo).label : "Categoria"}
                                items={tipos}
                                selected={modo}
                                onSelect={setModo}
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
                            <input type="text" placeholder="Deixe em branco para usar a data de hoje"/>
                        </div>
                        <div className={styles.linha4}>
                            <label>Fornecido Por:</label>
                            <select>
                                <option>Adicionar lista de fornecedores quando tiver o db</option>
                            </select>
                        </div>
                    </div>
                    <label className={styles.label}>Data Do Recebimento</label>
                    <input type="date"/>
                </div>
                <button type="submit" id="add" className={styles.add}>Confirmar Registro</button>
            </form>
        </>
    )
}

export default adicionarLote;