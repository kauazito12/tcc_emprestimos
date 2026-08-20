/* eslint-disable react-hooks/exhaustive-deps */

import React, {
  useEffect,
  useState,
} from "react";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:3001";

const INTERVALO_ATUALIZACAO = 5000;

function Usuarios() {
  const [usuarios, setUsuarios] =
    useState([]);

  const [nome, setNome] =
    useState("");

  const [login, setLogin] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [
    administrador,
    setAdministrador,
  ] = useState(false);

  const [
    editandoId,
    setEditandoId,
  ] = useState(null);

  const [
    redefinindoSenhaId,
    setRedefinindoSenhaId,
  ] = useState(null);

  const [
    novaSenha,
    setNovaSenha,
  ] = useState("");

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    tipoMensagem,
    setTipoMensagem,
  ] = useState("");

  useEffect(() => {
    buscarUsuarios();

    const intervalo =
      setInterval(() => {
        buscarUsuarios(true);
      }, INTERVALO_ATUALIZACAO);

    return () => {
      clearInterval(intervalo);
    };
  }, []);

  function obterToken() {
    return localStorage.getItem(
      "tcc_auth_token"
    );
  }

  function headersAuth(
    incluirJson = false
  ) {
    const headers = {
      Authorization:
        `Bearer ${obterToken()}`,
    };

    if (incluirJson) {
      headers["Content-Type"] =
        "application/json";
    }

    return headers;
  }

  function mostrarMensagem(
    texto,
    tipo = "sucesso"
  ) {
    setMensagem(texto);
    setTipoMensagem(tipo);

    setTimeout(() => {
      setMensagem("");
      setTipoMensagem("");
    }, 3000);
  }

  async function buscarUsuarios(
    silencioso = false
  ) {
    try {
      const resposta =
        await fetch(
          `${API_URL}/auth/usuarios`,
          {
            headers:
              headersAuth(),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        if (!silencioso) {
          mostrarMensagem(
            dados.erro ||
              "Erro ao buscar usuários",
            "erro"
          );
        }

        return;
      }

      setUsuarios(
        Array.isArray(dados)
          ? dados
          : []
      );
    } catch (error) {
      console.error(error);

      if (!silencioso) {
        mostrarMensagem(
          "Erro ao buscar usuários",
          "erro"
        );
      }
    }
  }

  function limparFormulario() {
    setNome("");
    setLogin("");
    setSenha("");
    setAdministrador(false);
    setEditandoId(null);
  }

  async function salvarUsuario(e) {
    e.preventDefault();

    if (
      !nome.trim() ||
      !login.trim()
    ) {
      mostrarMensagem(
        "Preencha nome e usuário",
        "erro"
      );

      return;
    }

    if (
      !editandoId &&
      senha.length < 8
    ) {
      mostrarMensagem(
        "A senha deve possuir pelo menos 8 caracteres",
        "erro"
      );

      return;
    }

    try {
      let resposta;

      if (editandoId) {
        resposta = await fetch(
          `${API_URL}/auth/usuarios/${editandoId}`,
          {
            method: "PUT",

            headers:
              headersAuth(true),

            body:
              JSON.stringify({
                nome:
                  nome.trim(),

                usuario:
                  login.trim(),

                administrador,
              }),
          }
        );
      } else {
        resposta = await fetch(
          `${API_URL}/auth/usuarios`,
          {
            method: "POST",

            headers:
              headersAuth(true),

            body:
              JSON.stringify({
                nome:
                  nome.trim(),

                usuario:
                  login.trim(),

                senha,

                administrador,
              }),
          }
        );
      }

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao salvar usuário",
          "erro"
        );

        return;
      }

      mostrarMensagem(
        editandoId
          ? "Usuário atualizado com sucesso"
          : "Usuário cadastrado com sucesso",
        "sucesso"
      );

      limparFormulario();

      await buscarUsuarios(true);
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao salvar usuário",
        "erro"
      );
    }
  }

  function editarUsuario(usuario) {
    setNome(usuario.nome || "");

    setLogin(
      usuario.usuario || ""
    );

    setAdministrador(
      Boolean(
        usuario.administrador
      )
    );

    setSenha("");

    setEditandoId(
      usuario.id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function abrirRedefinirSenha(
    usuario
  ) {
    setRedefinindoSenhaId(
      usuario.id
    );

    setNovaSenha("");
  }

  function cancelarNovaSenha() {
    setRedefinindoSenhaId(null);
    setNovaSenha("");
  }

  async function salvarNovaSenha(
    id
  ) {
    if (
      novaSenha.length < 8
    ) {
      mostrarMensagem(
        "A nova senha deve possuir pelo menos 8 caracteres",
        "erro"
      );

      return;
    }

    try {
      const resposta =
        await fetch(
          `${API_URL}/auth/usuarios/${id}/senha`,
          {
            method: "PUT",

            headers:
              headersAuth(true),

            body:
              JSON.stringify({
                senha:
                  novaSenha,
              }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao redefinir senha",
          "erro"
        );

        return;
      }

      cancelarNovaSenha();

      mostrarMensagem(
        "Senha atualizada com sucesso",
        "sucesso"
      );
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao redefinir senha",
        "erro"
      );
    }
  }

  async function alterarStatus(
    usuario
  ) {
    try {
      const resposta =
        await fetch(
          `${API_URL}/auth/usuarios/${usuario.id}/ativo`,
          {
            method: "PUT",

            headers:
              headersAuth(true),

            body:
              JSON.stringify({
                ativo:
                  !usuario.ativo,
              }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao alterar acesso",
          "erro"
        );

        return;
      }

      await buscarUsuarios(true);

      mostrarMensagem(
        dados.ativo
          ? "Usuário ativado com sucesso"
          : "Usuário desativado com sucesso",
        "sucesso"
      );
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao alterar acesso",
        "erro"
      );
    }
  }

  async function excluirUsuario(id) {
    try {
      const resposta =
        await fetch(
          `${API_URL}/auth/usuarios/${id}`,
          {
            method: "DELETE",

            headers:
              headersAuth(),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao excluir usuário",
          "erro"
        );

        return;
      }

      if (editandoId === id) {
        limparFormulario();
      }

      await buscarUsuarios(true);

      mostrarMensagem(
        "Usuário excluído com sucesso",
        "sucesso"
      );
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao excluir usuário",
        "erro"
      );
    }
  }

  return (
    <div className="usuarios-page">
      <style>
        {`
          .usuarios-page {
            width: 100%;
          }

          .usuarios-card {
            background: #ffffff;
            border: 1px solid #dce6eb;
            border-top: 4px solid #216493;
            border-radius: 9px;
            padding: 24px;
            box-sizing: border-box;
            margin-bottom: 18px;
          }

          .usuarios-card-lista {
            border-top-color: #2f8f5b;
          }

          .usuarios-identificacao {
            display: block;
            color: #216493;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
            margin-bottom: 7px;
          }

          .usuarios-card-lista
          .usuarios-identificacao {
            color: #2f8f5b;
          }

          .usuarios-card h2 {
            margin: 0 0 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e4ebef;
            color: #172d3b;
            font-size: 19px;
          }

          .usuarios-form {
            display: grid;
            grid-template-columns:
              1.3fr 1fr 1fr 0.8fr auto;
            gap: 10px;
            align-items: end;
          }

          .usuarios-campo {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .usuarios-campo label {
            font-size: 11px;
            font-weight: 700;
            color: #314957;
          }

          .usuarios-campo input,
          .usuarios-campo select {
            height: 40px;
            border: 1px solid #c7d4dc;
            border-radius: 6px;
            padding: 0 11px;
            box-sizing: border-box;
            outline: none;
            background: #fff;
            font-size: 12px;
          }

          .usuarios-campo input:focus,
          .usuarios-campo select:focus {
            border-color: #216493;
            box-shadow:
              0 0 0 3px
              rgba(33, 100, 147, 0.10);
          }

          .usuarios-botao-principal {
            height: 40px;
            padding: 0 16px;
            border: none;
            border-radius: 6px;
            background: #216493;
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
          }

          .usuarios-cancelar {
            margin-top: 12px;
          }

          .usuarios-cancelar button {
            height: 34px;
            border: 1px solid #aebdc5;
            border-radius: 6px;
            background: #fff;
            color: #455e6c;
            padding: 0 12px;
            cursor: pointer;
            font-size: 11px;
          }

          .usuarios-tabela-wrapper {
            overflow-x: auto;
          }

          .usuarios-tabela {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }

          .usuarios-tabela th {
            padding: 12px;
            text-align: left;
            color: #607482;
            background: #f5f8fa;
            border-bottom: 1px solid #dce6eb;
            font-size: 10px;
            letter-spacing: 0.5px;
          }

          .usuarios-tabela td {
            padding: 13px 12px;
            border-bottom: 1px solid #e4ebef;
            color: #253640;
          }

          .usuario-status {
            display: inline-flex;
            align-items: center;
            padding: 4px 9px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
          }

          .usuario-ativo {
            background: #e9f6ef;
            color: #25734a;
          }

          .usuario-inativo {
            background: #f6eeee;
            color: #a64343;
          }

          .usuario-admin {
            color: #216493;
            font-weight: 700;
          }

          .usuario-comum {
            color: #657985;
          }

          .usuarios-acoes {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .usuarios-acoes button {
            height: 30px;
            border-radius: 5px;
            padding: 0 9px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 600;
            background: #fff;
          }

          .usuario-btn-editar {
            border: 1px solid #216493;
            color: #216493;
          }

          .usuario-btn-senha {
            border: 1px solid #778d99;
            color: #4c6573;
          }

          .usuario-btn-status {
            border: 1px solid #d59b37;
            color: #9a6812;
          }

          .usuario-btn-excluir {
            border: 1px solid #d85a5a;
            color: #c34343;
          }

          .usuario-redefinir {
            margin-top: 8px;
            display: flex;
            gap: 6px;
          }

          .usuario-redefinir input {
            height: 32px;
            min-width: 180px;
            border: 1px solid #c7d4dc;
            border-radius: 5px;
            padding: 0 8px;
            outline: none;
          }

          .usuario-redefinir button {
            height: 32px;
          }

          .usuario-salvar-senha {
            border: none !important;
            background: #216493 !important;
            color: #fff !important;
          }

          .usuario-cancelar-senha {
            border: 1px solid #aab7bf !important;
          }

          .usuarios-vazio {
            padding: 25px;
            text-align: center;
            color: #73858f;
          }

          @media (max-width: 1050px) {
            .usuarios-form {
              grid-template-columns:
                1fr 1fr;
            }
          }

          @media (max-width: 650px) {
            .usuarios-form {
              grid-template-columns:
                1fr;
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

      <div className="usuarios-card">
        <span className="usuarios-identificacao">
          CONTROLE DE ACESSO
        </span>

        <h2>
          {editandoId
            ? "Editar Usuário"
            : "Cadastrar Novo Usuário"}
        </h2>

        <form
          className="usuarios-form"
          onSubmit={salvarUsuario}
        >
          <div className="usuarios-campo">
            <label>Nome</label>

            <input
              type="text"
              placeholder="Nome do usuário"
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
            />
          </div>

          <div className="usuarios-campo">
            <label>Login</label>

            <input
              type="text"
              placeholder="Login"
              value={login}
              onChange={(e) =>
                setLogin(e.target.value)
              }
            />
          </div>

          {!editandoId && (
            <div className="usuarios-campo">
              <label>Senha</label>

              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={senha}
                onChange={(e) =>
                  setSenha(e.target.value)
                }
              />
            </div>
          )}

          <div className="usuarios-campo">
            <label>Tipo de acesso</label>

            <select
              value={
                administrador
                  ? "administrador"
                  : "usuario"
              }
              onChange={(e) =>
                setAdministrador(
                  e.target.value ===
                    "administrador"
                )
              }
            >
              <option value="usuario">
                Usuário
              </option>

              <option value="administrador">
                Administrador
              </option>
            </select>
          </div>

          <button
            type="submit"
            className="usuarios-botao-principal"
          >
            {editandoId
              ? "Salvar Alterações"
              : "Cadastrar Usuário"}
          </button>
        </form>

        {editandoId && (
          <div className="usuarios-cancelar">
            <button
              type="button"
              onClick={
                limparFormulario
              }
            >
              Cancelar edição
            </button>
          </div>
        )}
      </div>

      <div className="usuarios-card usuarios-card-lista">
        <span className="usuarios-identificacao">
          USUÁRIOS REGISTRADOS
        </span>

        <h2>Usuários do Sistema</h2>

        {usuarios.length === 0 ? (
          <div className="usuarios-vazio">
            Nenhum usuário cadastrado.
          </div>
        ) : (
          <div className="usuarios-tabela-wrapper">
            <table className="usuarios-tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Login</th>
                  <th>Acesso</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map(
                  (usuario) => (
                    <tr key={usuario.id}>
                      <td>
                        {usuario.id}
                      </td>

                      <td>
                        {usuario.nome}
                      </td>

                      <td>
                        {usuario.usuario}
                      </td>

                      <td>
                        <span
                          className={
                            usuario.administrador
                              ? "usuario-admin"
                              : "usuario-comum"
                          }
                        >
                          {usuario.administrador
                            ? "Administrador"
                            : "Usuário"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`usuario-status ${
                            usuario.ativo
                              ? "usuario-ativo"
                              : "usuario-inativo"
                          }`}
                        >
                          {usuario.ativo
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </td>

                      <td>
                        <div className="usuarios-acoes">
                          <button
                            type="button"
                            className="usuario-btn-editar"
                            onClick={() =>
                              editarUsuario(
                                usuario
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="usuario-btn-senha"
                            onClick={() =>
                              abrirRedefinirSenha(
                                usuario
                              )
                            }
                          >
                            Senha
                          </button>

                          <button
                            type="button"
                            className="usuario-btn-status"
                            onClick={() =>
                              alterarStatus(
                                usuario
                              )
                            }
                          >
                            {usuario.ativo
                              ? "Desativar"
                              : "Ativar"}
                          </button>

                          <button
                            type="button"
                            className="usuario-btn-excluir"
                            onClick={() =>
                              excluirUsuario(
                                usuario.id
                              )
                            }
                          >
                            Excluir
                          </button>
                        </div>

                        {redefinindoSenhaId ===
                          usuario.id && (
                          <div className="usuario-redefinir">
                            <input
                              type="password"
                              placeholder="Nova senha"
                              value={novaSenha}
                              onChange={(e) =>
                                setNovaSenha(
                                  e.target.value
                                )
                              }
                            />

                            <button
                              type="button"
                              className="usuario-salvar-senha"
                              onClick={() =>
                                salvarNovaSenha(
                                  usuario.id
                                )
                              }
                            >
                              Salvar
                            </button>

                            <button
                              type="button"
                              className="usuario-cancelar-senha"
                              onClick={
                                cancelarNovaSenha
                              }
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
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

export default Usuarios;