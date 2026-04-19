import React, { useEffect, useState } from "react";
import "./Materiais.css";

const API_URL = "http://localhost:3001";

function Materiais() {
  const [materiais, setMateriais] = useState([]);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");

  useEffect(() => {
    buscarMateriais();
  }, []);

  function mostrarMensagem(texto, tipoMsg = "sucesso") {
    setMensagem(texto);
    setTipoMensagem(tipoMsg);

    setTimeout(() => {
      setMensagem("");
      setTipoMensagem("");
    }, 3000);
  }

  async function buscarMateriais() {
    try {
      const resposta = await fetch(`${API_URL}/materiais`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(dados.erro || "Erro ao buscar materiais", "erro");
        return;
      }

      setMateriais(dados);
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao buscar materiais", "erro");
    }
  }

  function limparFormulario() {
    setNome("");
    setTipo("");
    setQuantidade("");
    setEditandoId(null);
  }

  async function salvarMaterial(e) {
    e.preventDefault();

    if (!nome.trim() || !tipo.trim() || quantidade === "") {
      mostrarMensagem("Preencha nome, tipo e quantidade", "erro");
      return;
    }

    try {
      let resposta;

      const body = JSON.stringify({
        nome,
        tipo,
        quantidade: Number(quantidade),
      });

      if (editandoId) {
        resposta = await fetch(`${API_URL}/materiais/${editandoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });
      } else {
        resposta = await fetch(`${API_URL}/materiais`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
      }

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(dados.erro || "Erro ao salvar material", "erro");
        return;
      }

      mostrarMensagem(
        editandoId
          ? "Material atualizado com sucesso"
          : "Material cadastrado com sucesso",
        "sucesso"
      );

      limparFormulario();
      buscarMateriais();
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao salvar material", "erro");
    }
  }

  function editarMaterial(material) {
    setNome(material.nome || "");
    setTipo(material.tipo || "");
    setQuantidade(material.quantidade ?? "");
    setEditandoId(material.id);
  }

  async function excluirMaterial(id) {
    try {
      const resposta = await fetch(`${API_URL}/materiais/${id}`, {
        method: "DELETE",
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(dados.erro || "Erro ao excluir material", "erro");
        return;
      }

      mostrarMensagem("Material excluído com sucesso", "sucesso");

      if (editandoId === id) {
        limparFormulario();
      }

      buscarMateriais();
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao excluir material", "erro");
    }
  }

  return (
    <div className="materiais-page">
      {mensagem && (
        <div
          className={`mensagem-topo ${
            tipoMensagem === "erro" ? "mensagem-erro" : "mensagem-sucesso"
          }`}
        >
          {mensagem}
        </div>
      )}

      <div className="materiais-card">
        <h2>Gerenciamento de Materiais</h2>

        <form className="materiais-form" onSubmit={salvarMaterial}>
          <input
            type="text"
            placeholder="Nome do material"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Selecione o tipo</option>
            <option value="Lápis">Lápis</option>
            <option value="Caneta">Caneta</option>
            <option value="Borracha">Borracha</option>
            <option value="Giz">Giz</option>
            <option value="Tesoura">Tesoura</option>
            <option value="Tinta">Tinta</option>
            <option value="Tablet">Tablet</option>
            <option value="Notebook">Notebook</option>
            <option value="Outro">Outro</option>
          </select>

          <input
            type="number"
            placeholder="Quantidade"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />

          <button type="submit">
            {editandoId ? "Atualizar Item" : "Adicionar Item"}
          </button>
        </form>
      </div>

      <div className="materiais-card">
        <h2>Materiais Cadastrados</h2>

        {materiais.length === 0 ? (
          <p className="texto-vazio">Nenhum material cadastrado.</p>
        ) : (
          <div className="tabela-wrapper">
            <table className="tabela-materiais">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {materiais.map((material) => (
                  <tr key={material.id}>
                    <td>{material.id}</td>
                    <td>{material.nome}</td>
                    <td>{material.tipo}</td>
                    <td>{material.quantidade}</td>
                    <td>
                      <div className="acoes-linha">
                        <button onClick={() => editarMaterial(material)}>
                          Editar
                        </button>
                        <button
                          className="btn-excluir"
                          onClick={() => excluirMaterial(material.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editandoId && (
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <button
              onClick={limparFormulario}
              style={{
                height: "38px",
                border: "1px solid #999",
                borderRadius: "6px",
                background: "white",
                cursor: "pointer",
                padding: "0 14px",
                fontSize: "13px",
              }}
            >
              Cancelar edição
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Materiais;