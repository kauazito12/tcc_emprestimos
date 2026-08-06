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
    <div className="app-layout">
      <Navbar
        paginaAtual={paginaAtual}
        setPaginaAtual={setPaginaAtual}
      />

      <main className="app-main">
        <div className="app-main-container">
          {renderizarPagina()}
        </div>
      </main>
    </div>
  );
}

export default App;