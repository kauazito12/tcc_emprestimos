/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState } from "react";
import "./Materiais.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001";

const INTERVALO_ATUALIZACAO = 5000;

function Materiais() {
  const [materiais, setMateriais] = useState([]);
  const [tiposMateriais, setTiposMateriais] = useState([]);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const [novoTipo, setNovoTipo] = useState("");
  const [editandoTipoId, setEditandoTipoId] = useState(null);
  const [nomeTipoEditando, setNomeTipoEditando] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");

  useEffect(() => {
    carregarDados();

    const intervalo = setInterval(() => {
      carregarDados(true);
    }, INTERVALO_ATUALIZACAO);

    return () => {
      clearInterval(intervalo);
    };
  }, []);

  function mostrarMensagem(texto, tipoMsg = "sucesso") {
    setMensagem(texto);
    setTipoMensagem(tipoMsg);

    setTimeout(() => {
      setMensagem("");
      setTipoMensagem("");
    }, 3000);
  }

  async function carregarDados(silencioso = false) {
    await Promise.all([
      buscarMateriais(silencioso),
      buscarTiposMateriais(silencioso),
    ]);
  }

  async function buscarMateriais(silencioso = false) {
    try {
      const resposta = await fetch(`${API_URL}/materiais`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        if (!silencioso) {
          mostrarMensagem(
            dados.erro || "Erro ao buscar materiais",
            "erro"
          );
        }

        return;
      }

      setMateriais(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error(error);

      if (!silencioso) {
        mostrarMensagem(
          "Erro ao buscar materiais",
          "erro"
        );
      }
    }
  }

  async function buscarTiposMateriais(silencioso = false) {
    try {
      const resposta = await fetch(
        `${API_URL}/tipos-materiais`
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        if (!silencioso) {
          mostrarMensagem(
            dados.erro ||
              "Erro ao buscar tipos de materiais",
            "erro"
          );
        }

        return;
      }

      const tiposOrdenados = Array.isArray(dados)
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

      setTiposMateriais(tiposOrdenados);
    } catch (error) {
      console.error(error);

      if (!silencioso) {
        mostrarMensagem(
          "Erro ao buscar tipos de materiais",
          "erro"
        );
      }
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

    if (
      !nome.trim() ||
      !tipo.trim() ||
      quantidade === ""
    ) {
      mostrarMensagem(
        "Preencha nome, tipo e quantidade",
        "erro"
      );

      return;
    }

    try {
      let resposta;

      const body = JSON.stringify({
        nome: nome.trim(),
        tipo,
        quantidade: Number(quantidade),
      });

      if (editandoId) {
        resposta = await fetch(
          `${API_URL}/materiais/${editandoId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body,
          }
        );
      } else {
        resposta = await fetch(
          `${API_URL}/materiais`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body,
          }
        );
      }

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro || "Erro ao salvar material",
          "erro"
        );

        return;
      }

      mostrarMensagem(
        editandoId
          ? "Material atualizado com sucesso"
          : "Material cadastrado com sucesso",
        "sucesso"
      );

      limparFormulario();

      await buscarMateriais(true);
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao salvar material",
        "erro"
      );
    }
  }

  function editarMaterial(material) {
    setNome(material.nome || "");
    setTipo(material.tipo || "");
    setQuantidade(material.quantidade ?? "");
    setEditandoId(material.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function excluirMaterial(id) {
    try {
      const resposta = await fetch(
        `${API_URL}/materiais/${id}`,
        {
          method: "DELETE",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro || "Erro ao excluir material",
          "erro"
        );

        return;
      }

      mostrarMensagem(
        "Material excluído com sucesso",
        "sucesso"
      );

      if (editandoId === id) {
        limparFormulario();
      }

      await buscarMateriais(true);
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao excluir material",
        "erro"
      );
    }
  }

  async function adicionarTipo(e) {
    e.preventDefault();

    if (!novoTipo.trim()) {
      mostrarMensagem(
        "Digite o nome do novo tipo",
        "erro"
      );

      return;
    }

    try {
      const resposta = await fetch(
        `${API_URL}/tipos-materiais`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: novoTipo.trim(),
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao cadastrar tipo de material",
          "erro"
        );

        return;
      }

      setNovoTipo("");

      await buscarTiposMateriais(true);

      mostrarMensagem(
        "Tipo de material cadastrado com sucesso",
        "sucesso"
      );
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao cadastrar tipo de material",
        "erro"
      );
    }
  }

  function iniciarEdicaoTipo(tipoMaterial) {
    setEditandoTipoId(tipoMaterial.id);
    setNomeTipoEditando(tipoMaterial.nome || "");
  }

  function cancelarEdicaoTipo() {
    setEditandoTipoId(null);
    setNomeTipoEditando("");
  }

  async function salvarEdicaoTipo(id) {
    if (!nomeTipoEditando.trim()) {
      mostrarMensagem(
        "Digite o nome do tipo",
        "erro"
      );

      return;
    }

    try {
      const resposta = await fetch(
        `${API_URL}/tipos-materiais/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: nomeTipoEditando.trim(),
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao atualizar tipo de material",
          "erro"
        );

        return;
      }

      cancelarEdicaoTipo();

      await Promise.all([
        buscarTiposMateriais(true),
        buscarMateriais(true),
      ]);

      mostrarMensagem(
        "Tipo de material atualizado com sucesso",
        "sucesso"
      );
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao atualizar tipo de material",
        "erro"
      );
    }
  }

  async function excluirTipo(id) {
    try {
      const resposta = await fetch(
        `${API_URL}/tipos-materiais/${id}`,
        {
          method: "DELETE",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao excluir tipo de material",
          "erro"
        );

        return;
      }

      if (editandoTipoId === id) {
        cancelarEdicaoTipo();
      }

      await buscarTiposMateriais(true);

      mostrarMensagem(
        "Tipo de material excluído com sucesso",
        "sucesso"
      );
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao excluir tipo de material",
        "erro"
      );
    }
  }

  return (
    <div className="materiais-page">
      <style>
        {`
          .materiais-layout-duplo {
            display: grid;
            grid-template-columns: minmax(520px, 1.65fr) minmax(320px, 0.85fr);
            gap: 18px;
            align-items: start;
            margin-top: 20px;
          }

          .materiais-layout-duplo .materiais-card {
            margin: 0;
          }

          .gerenciar-tipos-card,
          .materiais-lista-card {
            min-height: 100%;
          }

          .tipos-form {
            display: flex;
            gap: 8px;
            align-items: center;
            margin-top: 14px;
            margin-bottom: 14px;
          }

          .tipos-form input {
            flex: 1;
            min-width: 0;
            height: 38px;
            padding: 0 11px;
            border: 1px solid #c7d4dc;
            border-radius: 6px;
            outline: none;
            box-sizing: border-box;
            font-size: 12px;
          }

          .tipos-form input:focus {
            border-color: #216493;
            box-shadow: 0 0 0 3px rgba(33, 100, 147, 0.10);
          }

          .tipos-form button {
            height: 38px;
            padding: 0 14px;
            border: none;
            border-radius: 6px;
            background: #216493;
            color: white;
            cursor: pointer;
            font-weight: 600;
            font-size: 12px;
            white-space: nowrap;
          }

          .tipos-form button:hover {
            opacity: 0.92;
          }

          .lista-tipos {
            display: flex;
            flex-direction: column;
            gap: 6px;
            max-height: 470px;
            overflow-y: auto;
            padding-right: 4px;
          }

          .lista-tipos::-webkit-scrollbar {
            width: 6px;
          }

          .lista-tipos::-webkit-scrollbar-thumb {
            background: #cbd7de;
            border-radius: 10px;
          }

          .tipo-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 8px 10px;
            border: 1px solid #e1e8ec;
            border-radius: 6px;
            background: #ffffff;
          }

          .tipo-item-nome {
            flex: 1;
            font-size: 12px;
            font-weight: 600;
            color: #253640;
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .tipo-item-edicao {
            flex: 1;
          }

          .tipo-item-edicao input {
            width: 100%;
            height: 32px;
            padding: 0 9px;
            border: 1px solid #b7c8d2;
            border-radius: 5px;
            box-sizing: border-box;
            outline: none;
            font-size: 12px;
          }

          .tipo-item-edicao input:focus {
            border-color: #216493;
          }

          .tipo-item-acoes {
            display: flex;
            gap: 6px;
            flex-shrink: 0;
          }

          .tipo-item-acoes button {
            height: 30px;
            padding: 0 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
          }

          .btn-tipo-editar {
            border: 1px solid #216493;
            background: #ffffff;
            color: #216493;
          }

          .btn-tipo-salvar {
            border: none;
            background: #216493;
            color: #ffffff;
          }

          .btn-tipo-cancelar {
            border: 1px solid #999;
            background: #ffffff;
            color: #555;
          }

          .btn-tipo-excluir {
            border: 1px solid #c94c4c;
            background: #ffffff;
            color: #c94c4c;
          }

          .btn-tipo-editar:hover,
          .btn-tipo-excluir:hover,
          .btn-tipo-cancelar:hover {
            background: #f6f8f9;
          }

          .btn-tipo-salvar:hover {
            opacity: 0.92;
          }

          .materiais-lista-card .tabela-wrapper {
            max-height: 545px;
            overflow-y: auto;
          }

          .materiais-lista-card .tabela-wrapper::-webkit-scrollbar {
            width: 7px;
          }

          .materiais-lista-card .tabela-wrapper::-webkit-scrollbar-thumb {
            background: #cbd7de;
            border-radius: 10px;
          }

          @media (max-width: 1050px) {
            .materiais-layout-duplo {
              grid-template-columns: 1fr;
            }

            .lista-tipos,
            .materiais-lista-card .tabela-wrapper {
              max-height: none;
            }
          }

          @media (max-width: 700px) {
            .tipos-form {
              flex-direction: column;
              align-items: stretch;
            }

            .tipo-item {
              align-items: stretch;
              flex-direction: column;
            }

            .tipo-item-acoes {
              width: 100%;
            }

            .tipo-item-acoes button {
              flex: 1;
            }
          }
        `}
      </style>

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

      <div className="materiais-card">
        <h2>Gerenciamento de Materiais</h2>

        <form
          className="materiais-form"
          onSubmit={salvarMaterial}
        >
          <input
            type="text"
            placeholder="Nome do material"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">
              Selecione o tipo
            </option>

            {tiposMateriais.map((tipoMaterial) => (
              <option
                key={tipoMaterial.id}
                value={tipoMaterial.nome}
              >
                {tipoMaterial.nome}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            placeholder="Quantidade"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />

          <button type="submit">
            {editandoId
              ? "Atualizar Item"
              : "Adicionar Item"}
          </button>
        </form>

        {editandoId && (
          <div
            style={{
              textAlign: "center",
              marginTop: "12px",
            }}
          >
            <button
              type="button"
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

      <div className="materiais-layout-duplo">

        <div className="materiais-card materiais-lista-card">
          <h2>Materiais Cadastrados</h2>

          {materiais.length === 0 ? (
            <p className="texto-vazio">
              Nenhum material cadastrado.
            </p>
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
                          <button
                            type="button"
                            onClick={() =>
                              editarMaterial(material)
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="btn-excluir"
                            onClick={() =>
                              excluirMaterial(material.id)
                            }
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
        </div>

        <div className="materiais-card gerenciar-tipos-card">
          <h2>Gerenciar Tipos de Materiais</h2>

          <form
            className="tipos-form"
            onSubmit={adicionarTipo}
          >
            <input
              type="text"
              placeholder="Novo tipo de material"
              value={novoTipo}
              onChange={(e) =>
                setNovoTipo(e.target.value)
              }
            />

            <button type="submit">
              Adicionar
            </button>
          </form>

          {tiposMateriais.length === 0 ? (
            <p className="texto-vazio">
              Nenhum tipo cadastrado.
            </p>
          ) : (
            <div className="lista-tipos">
              {tiposMateriais.map((tipoMaterial) => (
                <div
                  className="tipo-item"
                  key={tipoMaterial.id}
                >
                  {editandoTipoId === tipoMaterial.id ? (
                    <div className="tipo-item-edicao">
                      <input
                        type="text"
                        value={nomeTipoEditando}
                        onChange={(e) =>
                          setNomeTipoEditando(
                            e.target.value
                          )
                        }
                      />
                    </div>
                  ) : (
                    <div className="tipo-item-nome">
                      {tipoMaterial.nome}
                    </div>
                  )}

                  <div className="tipo-item-acoes">
                    {editandoTipoId === tipoMaterial.id ? (
                      <>
                        <button
                          type="button"
                          className="btn-tipo-salvar"
                          onClick={() =>
                            salvarEdicaoTipo(
                              tipoMaterial.id
                            )
                          }
                        >
                          Salvar
                        </button>

                        <button
                          type="button"
                          className="btn-tipo-cancelar"
                          onClick={cancelarEdicaoTipo}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn-tipo-editar"
                          onClick={() =>
                            iniciarEdicaoTipo(
                              tipoMaterial
                            )
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="btn-tipo-excluir"
                          onClick={() =>
                            excluirTipo(
                              tipoMaterial.id
                            )
                          }
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Materiais;