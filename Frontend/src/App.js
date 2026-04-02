// navegação entre pg
import React, { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Professores from "./pages/Professores";
import Materiais from "./pages/Materiais";
import Emprestimos from "./pages/Emprestimos";

function App() {
  const [paginaAtual, setPaginaAtual] = useState("inicio");

  function renderizarPagina() {
    switch (paginaAtual) {
      case "inicio":
        return <Home />;
      case "professores":
        return <Professores />;
      case "materiais":
        return <Materiais />;
      case "emprestimos":
        return <Emprestimos />;
      default:
        return <Home />;
    }
  }

  return (
    <div className="app-page">
      <div className="app-container">
        <h1>Sistema de Empréstimo de Materiais</h1>

        <Navbar setPaginaAtual={setPaginaAtual} />

        <div className="conteudo-pagina">{renderizarPagina()}</div>
      </div>
    </div>
  );
}

export default App;