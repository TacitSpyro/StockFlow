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
        {value: "Ativo", label: "Ativo"},
        {value: "Inspecao", label: "Em Inspeção"},
        {value: "Bloqueado", label: "Bloqueado"}
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
                    <select name="status">
                        <option value=""></option>
                    </select>
                    <label className={styles.label}>Data Do Recebimento</label>
                    <input type="date"/>
                    <div className={styles.segura}>
                        <Dropdown
                            as="div"
                            label={modo ? situacao.find(o => o.value === modo).label : "Categoria"}
                            items={situacao}
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