import { createContext, useContext, useState } from "react";

const EmpresaContext = createContext();

export function EmpresaProvider({ children }) {
  const [idEmpresa, setIdEmpresa] = useState(() => {
    return localStorage.getItem("idEmpresa") || null;
  });

  const [matricula, setMatricula] = useState(() => {
    return localStorage.getItem("matricula") || null;
  });

  const [idAdmin, setIdAdmin] = useState(() => {
    return localStorage.getItem("idAdmin") || null;
  });

  function salvarIdEmpresa(id) {
    setIdEmpresa(id);
    localStorage.setItem("idEmpresa", id);
  }

  function salvarAdmin({ id_admin, matricula }) {
    setIdAdmin(id_admin);
    setMatricula(matricula);
    localStorage.setItem("idAdmin", id_admin);
    localStorage.setItem("matricula", matricula);
  }

  function limparSessao() {
    setIdEmpresa(null);
    setMatricula(null);
    setIdAdmin(null);
    localStorage.removeItem("idEmpresa");
    localStorage.removeItem("matricula");
    localStorage.removeItem("idAdmin");
  }

  return (
    <EmpresaContext.Provider
      value={{
        idEmpresa,
        matricula,
        idAdmin,
        salvarIdEmpresa,
        salvarAdmin,
        limparSessao,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  return useContext(EmpresaContext);
}