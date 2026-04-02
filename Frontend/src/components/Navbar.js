import React from "react";

function Navbar({ setPaginaAtual }) {
  return (
    <div className="menu-topo">
      <button onClick={() => setPaginaAtual("inicio")}>Início</button>
      <button onClick={() => setPaginaAtual("professores")}>Professores</button>
      <button onClick={() => setPaginaAtual("materiais")}>Materiais</button>
      <button onClick={() => setPaginaAtual("emprestimos")}>Empréstimos</button>
    </div>
  );
}

export default Navbar;