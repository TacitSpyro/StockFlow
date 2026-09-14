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

    function registrarLote(e){
        e.preventDefault();

        alert("ta funfando");
    }


    return(
        <>
            <form onSubmit={registrarLote}>

                <div className={styles.topbar}>
                    <img src={retornar} alt="retornar" className="navbar-img"/>
                    <a href="/edição/produtos">Cancelar</a>
                </div>

                <input type="text" placeholder="Nome do Produto"/>
                <input type="text" placeholder="Lote do Fornecedor"/>
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
                <button type="submit" id="add" className={styles.add}>Confirmar Registro</button>
            </form>
        </>
    )
}

export default adicionarLote;