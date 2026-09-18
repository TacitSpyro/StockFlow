import styles from "../styles/Adicionar-fornecedor.module.css"

function cadastrarFornecedor(){

    function calcularCep(e){
        e.preventDefault();

        alert("bom dia")
    }

    return(
        <>
            <main>
                <label>Cadastrar Fornecedor</label>
                <div className={styles.secao1}>
                    <div className={styles.coluna1}>
                        <input type="text" placeholder="Razão Social" />
                        <input type="text" placeholder="Nome" />
                        <input type="text" placeholder="CNPJ" />
                    </div>
                    <div className={styles.coluna2}>
                        <input type="text" placeholder="CEP" />
                        <button type="button" onClick={calcularCep}>Calcular Endereço</button>
                    </div>
                    <div className={styles.secao2}>
                        <div className={styles.coluna3}>
                            <input type="text" placeholder="Nome do Responsável"/>
                            <input type="number" placeholder="Telefone"/>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}

export default cadastrarFornecedor;