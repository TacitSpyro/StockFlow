import { href } from "react-router-dom";

export const homeLinks = [
  {
    label: "Ferramentas de analise",
    items: [
      { href: "/visualizar-relatorios", label: "Relatórios" },
      { href: "/tabela-produtos", label: "Produtos" },
      { href: "/tabela-fornecedores", label: "Fornecedores" },
      { href: "/tabela-pedidos", label: "Pedidos" },
    ],
  },
  {
    label: "Ferramentas de edição",
    items: [
      { href: "/edição/produtos", label: "Editar estoque" },
      { href: "/edição/fornecedores", label: "Editar Fornecimento" },
      { href: "/edição-pedidos", label: "Abrir pedidos" },
    ],
  },
];