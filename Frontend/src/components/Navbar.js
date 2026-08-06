import React from "react";

function Navbar({ paginaAtual, setPaginaAtual }) {
  const itensMenu = [
    {
      id: "inicio",
      titulo: "Início",
      descricao: "Visão geral",
    },
    {
      id: "professores",
      titulo: "Professores",
      descricao: "Cadastros",
    },
    {
      id: "materiais",
      titulo: "Materiais",
      descricao: "Estoque",
    },
    {
      id: "emprestimos",
      titulo: "Empréstimos",
      descricao: "Controle",
    },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-menu">
        <span className="sidebar-menu-titulo">MENU PRINCIPAL</span>

        {itensMenu.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-item ${
              paginaAtual === item.id ? "sidebar-item-ativo" : ""
            }`}
            onClick={() => setPaginaAtual(item.id)}
          >
            <span className="sidebar-item-texto">
              <strong>{item.titulo}</strong>
              <small>{item.descricao}</small>
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Navbar;