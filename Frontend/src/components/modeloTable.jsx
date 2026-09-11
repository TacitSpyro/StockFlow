import { useState } from "react";
import Dropdown from "../components/Dropdown";
import "./modeloTable.css"
import Logout from "../assets/Logout.png"
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function TabelaBase({
    titulo,
    opcoesOrdenacao,
    modoInicial,
    edicao,
    texto,
    urlDoCoiso
}) {

     const navigate = useNavigate();

        function handleEditar(e){
            e.preventDefault();

            console.log(urlDoCoiso)

            navigate(urlDoCoiso);
        }

        const [modo, setModo] = useState(modoInicial || opcoesOrdenacao[0]?.value)


    return (
        <>
            <div className="topbar">
                
                <div className="segura">
                    <img src={Logout} alt="desloga" className="img-Table"/>
                    <a href="/" className="-a">Desconectar</a>
                </div>
                

                {/* Verifica se foi chamada na pagina da edição, se foi libera opção de edição*/}
                { edicao ? ( 
                    <button type="button" className="botaoEditar" onClick={handleEditar}>
                        {texto}
                    </button>
                ) : null}
            </div>
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