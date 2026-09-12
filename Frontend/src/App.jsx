import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import TabelaProdutos from "./pages/Tabela-Produtos"
import TabelaFornecedores from "./pages/Tabela-Fornecedores"
import TabelaRelatorios from "./pages/Tabela-Relatorios"
import EdicaoFornecedores from "./pages/Editar-Fornecedores"
import AdicionarFornecedor from "./pages/Adicionar-Fornecedor"
import AdicionarLote from "./pages/Adicionar-Lote"
import EdicaoProdutos from "./pages/Editar-Estoque"
import GerarRelatorio from "./pages/Gerar-Relatorio"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/tabela-produtos" element={<TabelaProdutos />}/>
        <Route path="/tabela-fornecedores" element={<TabelaFornecedores />} />
        <Route path="/visualizar-relatorios" element={<TabelaRelatorios />} />
        <Route path="/edição/fornecedores" element={<EdicaoFornecedores />} />
        <Route path="/edição/produtos" element={<EdicaoProdutos />} />
        <Route path="/cadastrar/fornecedor" element={<AdicionarFornecedor />} />
        <Route path="/cadastrar/lote" element={<AdicionarLote />} />
        <Route path="/gerar-relatorio" element={<GerarRelatorio />} />
      </Routes>
    </BrowserRouter>
  );
}

{/* comentários: modeloTable.jsx*/}

export default App;