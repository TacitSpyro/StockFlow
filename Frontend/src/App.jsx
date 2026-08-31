import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import TabelaProdutos from "./pages/Tabela-Produtos"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/tabela-produtos" element={<TabelaProdutos />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;