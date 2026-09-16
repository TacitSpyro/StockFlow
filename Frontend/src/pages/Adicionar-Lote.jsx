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
                    <input type="text" placeholder="Lote do Fornecedor" className={styles.loteF}/>
                    <input type="number" placeholder="Quantidade Total"/>
                    <div className={styles.sdd}>
                        <Dropdown
                            as="div"
                            name=""
                            label="Situação"
                            items={situacao}
                        />
                    </div>
                    <label className={styles.label}>Data Do Recebimento</label>
                    <input type="date"/>
                    <div className={styles.segura}>
                        <Dropdown
                            as="div"
                            label={modo ? tipos.find(o => o.value === modo).label : "Categoria"}
                            items={tipos}
                            selected={modo}
                            onSelect={setModo}
                        />
                    </div>
                    <select>
                        <option>Adicionar lista de fornecedores quando tiver o db</option>
                    </select>
                </div>
                <button type="submit" id="add" className={styles.add}>Confirmar Registro</button>
            </form>
        </>
    )
}

export default adicionarLote;