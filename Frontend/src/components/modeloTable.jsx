import { useState } from "react";
import Dropdown from "../components/Dropdown";
import "./modeloTable.css"

function TabelaBase({
    titulo,
    opcoesOrdenacao,
    modoInicial
}) {

    const [modo, setModo] = useState(modoInicial || opcoesOrdenacao[0]?.value)


    return (
        <>
            <main className="main">
                <label htmlFor="fo">{titulo}</label>

                {/* isso é uma pratica horrivel de código mas eu não tenho paciencia pra deixar um projeto tão frivolo
                como esse absolutamente perfeito, assim eu altero o estilo só da div sem mexer com o css do Dropdown
                pq meu cerebro não pode conceber de que maneira eu alteraria a posição do dropdown exclusivamente 
                nessa pagina, seje grato que eu não vou criar um dropdown igual só com textos diferentes pra cada pagina */}

                <div className={"sdd"}>
                    <Dropdown
                        as="div"
                        label={modo ? opcoesOrdenacao.find(o => o.value === modo).label : "Categoria"}
                        items={opcoesOrdenacao}
                        selected={modo}
                        onSelect={setModo}
                    />
                </div>
            </main>
        </>
    )
}

export default TabelaBase;