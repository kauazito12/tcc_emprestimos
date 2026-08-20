/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState } from "react";
import "./professores.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001";

const INTERVALO_ATUALIZACAO = 5000;

function Professores() {
  const [professores, setProfessores] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");

  useEffect(() => {
    buscarProfessores();

    const intervalo = setInterval(() => {
      buscarProfessores(true);
    }, INTERVALO_ATUALIZACAO);

    return () => {
      clearInterval(intervalo);
    };
  }, []);

  function mostrarMensagem(texto, tipo = "sucesso") {
    setMensagem(texto);
    setTipoMensagem(tipo);

    setTimeout(() => {
      setMensagem("");
      setTipoMensagem("");
    }, 3000);
  }

  async function buscarProfessores(silencioso = false) {
    try {
      const resposta = await fetch(
        `${API_URL}/professores`
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        if (!silencioso) {
          mostrarMensagem(
            dados.erro ||
              "Erro ao buscar professores",
            "erro"
          );
        }

        return;
      }

      const professoresOrdenados =
        Array.isArray(dados)
          ? [...dados].sort((a, b) =>
              String(a.nome || "").localeCompare(
                String(b.nome || ""),
                "pt-BR",
                {
                  sensitivity: "base",
                }
              )
            )
          : [];

      setProfessores(professoresOrdenados);
    } catch (error) {
      console.error(error);

      if (!silencioso) {
        mostrarMensagem(
          "Erro ao buscar professores",
          "erro"
        );
      }
    }
  }

  function limparFormulario() {
    setNome("");
    setEmail("");
    setEditandoId(null);
  }

  async function salvarProfessor(e) {
    e.preventDefault();

    if (!nome.trim() || !email.trim()) {
      mostrarMensagem(
        "Preencha nome e email",
        "erro"
      );

      return;
    }

    try {
      let resposta;

      if (editandoId) {
        resposta = await fetch(
          `${API_URL}/professores/${editandoId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nome,
              email,
            }),
          }
        );
      } else {
        resposta = await fetch(
          `${API_URL}/professores`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nome,
              email,
            }),
          }
        );
      }

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao salvar professor",
          "erro"
        );

        return;
      }

      mostrarMensagem(
        editandoId
          ? "Professor atualizado com sucesso"
          : "Professor cadastrado com sucesso",
        "sucesso"
      );

      limparFormulario();

      await buscarProfessores(true);
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao salvar professor",
        "erro"
      );
    }
  }

  function editarProfessor(professor) {
    setNome(professor.nome || "");
    setEmail(professor.email || "");
    setEditandoId(professor.id);
  }

  async function excluirProfessor(id) {
    try {
      const resposta = await fetch(
        `${API_URL}/professores/${id}`,
        {
          method: "DELETE",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao excluir professor",
          "erro"
        );

        return;
      }

      mostrarMensagem(
        "Professor excluído com sucesso",
        "sucesso"
      );

      if (editandoId === id) {
        limparFormulario();
      }

      await buscarProfessores(true);
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao excluir professor",
        "erro"
      );
    }
  }

  return (
    <div className="professores-page">
      {mensagem && (
        <div
          className={`mensagem-topo ${
            tipoMensagem === "erro"
              ? "mensagem-erro"
              : "mensagem-sucesso"
          }`}
        >
          {mensagem}
        </div>
      )}

      <div className="professores-card">
        <h2>Cadastro de Professores</h2>

        <form
          className="professores-form"
          onSubmit={salvarProfessor}
        >
          <div className="form-group">
            <label>Nome</label>

            <input
              type="text"
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              placeholder="Digite o nome"
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Digite o email"
            />
          </div>

          <div className="form-acoes">
            <button type="submit">
              {editandoId
                ? "Atualizar Professor"
                : "Salvar Professor"}
            </button>

            {editandoId && (
              <button
                type="button"
                className="btn-secundario"
                onClick={limparFormulario}
              >
                Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="professores-card">
        <h2>Professores Cadastrados</h2>

        {professores.length === 0 ? (
          <p className="texto-vazio">
            Nenhum professor cadastrado.
          </p>
        ) : (
          <div className="tabela-wrapper">
            <table className="tabela-professores">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {professores.map(
                  (professor) => (
                    <tr key={professor.id}>
                      <td>{professor.id}</td>
                      <td>{professor.nome}</td>
                      <td>{professor.email}</td>

                      <td>
                        <div className="acoes-linha">
                          <button
                            onClick={() =>
                              editarProfessor(
                                professor
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            className="btn-excluir"
                            onClick={() =>
                              excluirProfessor(
                                professor.id
                              )
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Professores;