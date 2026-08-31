import { useState } from "react";
import Navbar from "../components/Navbar";
import { homeLinks } from "../data/navLinks";
import styles from "../styles/Home.module.css"

function Home() {

  const [modo, setModo] = useState('coluna')

  return (
    <>
      <Navbar links={homeLinks} />
      <main>
        <div id="cabeca">
          <label>Dados Recentes</label>
          <select value={modo} onChange={(e) => setModo(e.target.value)} className={styles.dropdown}>
            <option value="Coluna">Colunas</option>
            <option value="Linha">Linha</option>
          </select>
        </div>
        <div id="grafico-de-retirada" className={styles.chart}>
          <label>"Gráfico"</label>
        </div>
      </main>
    </>
  );
}

export default Home;