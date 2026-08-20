import React, { useState } from "react";
import "./Login.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001";

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function realizarLogin(e) {
    e.preventDefault();

    setMensagem("");

    if (
      !usuario.trim() ||
      !senha
    ) {
      setMensagem(
        "Informe o usuário e a senha."
      );

      return;
    }

    try {
      setCarregando(true);

      const resposta = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            usuario: usuario.trim(),
            senha,
          }),
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        setMensagem(
          dados.erro ||
            "Não foi possível realizar o login."
        );

        return;
      }

      if (
        !dados.token ||
        !dados.usuario
      ) {
        setMensagem(
          "Resposta inválida do servidor."
        );

        return;
      }

      onLogin(
        dados.token,
        dados.usuario
      );
    } catch (error) {
      console.error(
        "Erro no login:",
        error
      );

      setMensagem(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-identidade">
          <div className="login-marca">
            <span className="login-marca-circulo" />

            <span>
              SISTEMA DE EMPRÉSTIMOS
            </span>
          </div>

          <h1>
            Controle de materiais escolares
          </h1>

          <p>
            Acesso restrito aos usuários
            autorizados para gerenciamento de
            materiais, professores, empréstimos
            e devoluções.
          </p>

          <div className="login-informacao">
            <strong>
              Sessão protegida
            </strong>

            <span>
              O acesso é encerrado após 60
              minutos sem interação com o
              sistema.
            </span>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-topo">
            <span>
              ACESSO AO SISTEMA
            </span>

            <h2>Entrar</h2>

            <p>
              Informe suas credenciais para
              continuar.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={realizarLogin}
          >
            <div className="login-form-group">
              <label>
                Usuário
              </label>

              <input
                type="text"
                value={usuario}
                onChange={(e) =>
                  setUsuario(
                    e.target.value
                  )
                }
                placeholder="Digite seu usuário"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="login-form-group">
              <label>
                Senha
              </label>

              <input
                type="password"
                value={senha}
                onChange={(e) =>
                  setSenha(
                    e.target.value
                  )
                }
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
            </div>

            {mensagem && (
              <div className="login-mensagem-erro">
                {mensagem}
              </div>
            )}

            <button
              type="submit"
              className="login-botao"
              disabled={carregando}
            >
              {carregando
                ? "Entrando..."
                : "Entrar no sistema"}
            </button>
          </form>

          <div className="login-rodape">
            Sistema de controle de empréstimos
            de materiais escolares
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;