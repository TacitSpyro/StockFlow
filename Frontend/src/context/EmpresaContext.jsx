import { createContext, useContext, useState } from "react";

const EmpresaContext = createContext();

export function EmpresaProvider({ children }) {
  const [idEmpresa, setIdEmpresa] = useState(() => {
    const saved = localStorage.getItem("idEmpresa");
    return saved ? saved : null;
  });

  function salvarIdEmpresa(id) {
    setIdEmpresa(id);
    localStorage.setItem("idEmpresa", id);
  }

  function limparIdEmpresa() {
    setIdEmpresa(null);
    localStorage.removeItem("idEmpresa");
  }

  return (
    <EmpresaContext.Provider value={{ idEmpresa, salvarIdEmpresa, limparIdEmpresa }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  return useContext(EmpresaContext);
}