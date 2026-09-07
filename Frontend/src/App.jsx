import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import TabelaProdutos from "./pages/Tabela-Produtos"
import TabelaFornecedores from "./pages/Tabela-Fornecedores"
import TabelaRelatorios from "./pages/Tabela-Relatorios"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/tabela-produtos" element={<TabelaProdutos />}/>
        <Route path="/tabela-fornecedores" element={<TabelaFornecedores />} />
        <Route path="/visualizar-relatorios" element={<TabelaRelatorios />} />
      </Routes>
    </BrowserRouter>
  );
}

{/* comentários: tabela-produtos.jsx
  tabela-produtos.css*/}

export default App;