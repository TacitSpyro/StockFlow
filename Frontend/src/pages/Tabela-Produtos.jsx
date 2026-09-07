import styles from "../styles/Tabela-Produtos.module.css"
import { useState } from "react";
import { homeLinks } from "../data/navLinks";
import Navbar from "../components/Navbar";
import Dropdown from "../components/Dropdown";

function tabela() {

    const [modo, setModo] = useState('Recente')

    return(
        <>
            <div id="topBar">
                <select value={modo} onChange={(e) => setModo(e.target.value)} className={styles.dropdown}>
                    <option value="decrescente">Ordem Decrescente</option>
                    <option value="Crescente">Ordem Crescente</option>
                    <option value="recentes">Mais Recente</option>
                    <option value="antigo">Mais Antigo</option>
                </select>
            </div>
            <main>
                <label htmlFor="fo">foda</label>
            </main>
        </>
    )

}

export default tabela;