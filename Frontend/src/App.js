/* eslint-disable react-hooks/exhaustive-deps */

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import "./App.css";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Professores from "./pages/Professores";
import Materiais from "./pages/Materiais";
import Emprestimos from "./pages/Emprestimos";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:3001";

const CHAVE_TOKEN =
  "tcc_auth_token";

const CHAVE_USUARIO =
  "tcc_auth_usuario";

const INTERVALO_VALIDACAO_SESSAO =
  60000;

const INTERVALO_MINIMO_ATIVIDADE =
  60000;


// ======================================================
// FETCH GLOBAL AUTENTICADO
// ======================================================

if (
  typeof window !== "undefined" &&
  !window.__TCC_FETCH_AUTENTICADO__
) {
  const fetchOriginal =
    window.fetch.bind(window);

  window.fetch = async (
    recurso,
    opcoes = {}
  ) => {
    let url = "";

    if (
      typeof recurso === "string"
    ) {
      url = recurso;
    } else if (
      recurso &&
      recurso.url
    ) {
      url = recurso.url;
    }

    const requisicaoParaApi =
      url.startsWith(API_URL);

    const ehLogin =
      url.includes("/auth/login");

    const token =
      localStorage.getItem(
        CHAVE_TOKEN
      );

    let novasOpcoes = {
      ...opcoes,
    };

    if (
      requisicaoParaApi &&
      !ehLogin &&
      token
    ) {
      const headers =
        new Headers(
          opcoes.headers ||
            (
              recurso instanceof Request
                ? recurso.headers
                : undefined
            )
        );

      headers.set(
        "Authorization",
        `Bearer ${token}`
      );

      novasOpcoes = {
        ...opcoes,
        headers,
      };
    }

    const resposta =
      await fetchOriginal(
        recurso,
        novasOpcoes
      );

    if (
      requisicaoParaApi &&
      !ehLogin &&
      resposta.status === 401
    ) {
      localStorage.removeItem(
        CHAVE_TOKEN
      );

      localStorage.removeItem(
        CHAVE_USUARIO
      );

      window.dispatchEvent(
        new Event(
          "tcc-sessao-expirada"
        )
      );
    }

    return resposta;
  };

  window.__TCC_FETCH_AUTENTICADO__ =
    true;
}


function App() {
  const [
    paginaAtual,
    setPaginaAtual,
  ] = useState("inicio");

  const [
    autenticado,
    setAutenticado,
  ] = useState(false);

  const [
    verificandoSessao,
    setVerificandoSessao,
  ] = useState(true);

  const [
    usuarioLogado,
    setUsuarioLogado,
  ] = useState(null);

  const ultimaAtividadeEnviadaRef =
    useRef(0);


  // ======================================================
  // VERIFICA SESSÃO AO ABRIR
  // ======================================================

  useEffect(() => {
    verificarSessaoInicial();
  }, []);


  // ======================================================
  // EVENTO GLOBAL DE SESSÃO EXPIRADA
  // ======================================================

  useEffect(() => {
    function sessaoExpirada() {
      limparSessao();
    }

    window.addEventListener(
      "tcc-sessao-expirada",
      sessaoExpirada
    );

    return () => {
      window.removeEventListener(
        "tcc-sessao-expirada",
        sessaoExpirada
      );
    };
  }, []);


  // ======================================================
  // INTERAÇÃO REAL DO USUÁRIO
  // ======================================================

  useEffect(() => {
    if (!autenticado) {
      return;
    }

    const eventos = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    function registrarInteracao() {
      registrarAtividade();
    }

    eventos.forEach(
      (evento) => {
        window.addEventListener(
          evento,
          registrarInteracao,
          {
            passive: true,
          }
        );
      }
    );

    return () => {
      eventos.forEach(
        (evento) => {
          window.removeEventListener(
            evento,
            registrarInteracao
          );
        }
      );
    };
  }, [autenticado]);


  // ======================================================
  // VALIDAÇÃO PERIÓDICA DA SESSÃO
  // ======================================================

  useEffect(() => {
    if (!autenticado) {
      return;
    }

    const intervalo =
      setInterval(() => {
        validarSessao();
      }, INTERVALO_VALIDACAO_SESSAO);

    return () => {
      clearInterval(intervalo);
    };
  }, [autenticado]);


  // ======================================================
  // BLOQUEIA USUÁRIOS PARA NÃO-ADMIN
  // ======================================================

  useEffect(() => {
    if (
      paginaAtual === "usuarios" &&
      !usuarioLogado?.administrador
    ) {
      setPaginaAtual("inicio");
    }
  }, [
    paginaAtual,
    usuarioLogado,
  ]);


  // ======================================================
  // TOKEN
  // ======================================================

  function obterToken() {
    return localStorage.getItem(
      CHAVE_TOKEN
    );
  }


  // ======================================================
  // SALVAR SESSÃO
  // ======================================================

  function salvarSessao(
    token,
    usuario
  ) {
    localStorage.setItem(
      CHAVE_TOKEN,
      token
    );

    localStorage.setItem(
      CHAVE_USUARIO,
      JSON.stringify(usuario)
    );

    setUsuarioLogado(
      usuario
    );

    setAutenticado(true);

    ultimaAtividadeEnviadaRef.current =
      Date.now();
  }


  // ======================================================
  // LIMPAR SESSÃO
  // ======================================================

  function limparSessao() {
    localStorage.removeItem(
      CHAVE_TOKEN
    );

    localStorage.removeItem(
      CHAVE_USUARIO
    );

    setAutenticado(false);

    setUsuarioLogado(null);

    setPaginaAtual("inicio");

    ultimaAtividadeEnviadaRef.current =
      0;
  }


  // ======================================================
  // VERIFICAR SESSÃO INICIAL
  // ======================================================

  async function verificarSessaoInicial() {
    const token =
      obterToken();

    if (!token) {
      setVerificandoSessao(false);

      return;
    }

    try {
      const resposta =
        await fetch(
          `${API_URL}/auth/me`
        );

      if (!resposta.ok) {
        limparSessao();

        return;
      }

      const dados =
        await resposta.json();

      setUsuarioLogado(
        dados.usuario
      );

      setAutenticado(true);

      ultimaAtividadeEnviadaRef.current =
        Date.now();
    } catch (error) {
      console.error(
        "Erro ao verificar sessão:",
        error
      );

      limparSessao();
    } finally {
      setVerificandoSessao(false);
    }
  }


  // ======================================================
  // VALIDAR SESSÃO
  // ======================================================

  async function validarSessao() {
    const token =
      obterToken();

    if (!token) {
      limparSessao();

      return;
    }

    try {
      const resposta =
        await fetch(
          `${API_URL}/auth/me`
        );

      if (
        resposta.status === 401
      ) {
        limparSessao();

        return;
      }

      if (!resposta.ok) {
        return;
      }

      const dados =
        await resposta.json();

      if (dados.usuario) {
        setUsuarioLogado(
          dados.usuario
        );
      }
    } catch (error) {
      console.error(
        "Erro ao validar sessão:",
        error
      );
    }
  }


  // ======================================================
  // REGISTRAR ATIVIDADE REAL
  // ======================================================

  async function registrarAtividade() {
    const agora =
      Date.now();

    if (
      agora -
        ultimaAtividadeEnviadaRef.current <
      INTERVALO_MINIMO_ATIVIDADE
    ) {
      return;
    }

    const token =
      obterToken();

    if (!token) {
      return;
    }

    ultimaAtividadeEnviadaRef.current =
      agora;

    try {
      const resposta =
        await fetch(
          `${API_URL}/auth/atividade`,
          {
            method: "PUT",
          }
        );

      if (
        resposta.status === 401
      ) {
        limparSessao();
      }
    } catch (error) {
      console.error(
        "Erro ao registrar atividade:",
        error
      );
    }
  }


  // ======================================================
  // LOGIN
  // ======================================================

  function aoRealizarLogin(
    token,
    usuario
  ) {
    salvarSessao(
      token,
      usuario
    );
  }


  // ======================================================
  // LOGOUT
  // ======================================================

  async function fazerLogout() {
    const token =
      obterToken();

    try {
      if (token) {
        await fetch(
          `${API_URL}/auth/logout`,
          {
            method: "POST",
          }
        );
      }
    } catch (error) {
      console.error(
        "Erro ao realizar logout:",
        error
      );
    } finally {
      limparSessao();
    }
  }


  // ======================================================
  // PÁGINAS
  // ======================================================

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

      case "usuarios":
        if (
          usuarioLogado?.administrador
        ) {
          return <Usuarios />;
        }

        return <Home />;

      default:
        return <Home />;
    }
  }


  // ======================================================
  // CARREGAMENTO
  // ======================================================

  if (verificandoSessao) {
    return (
      <div
        style={{
          minHeight: "100vh",

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "#f4f7f9",

          fontFamily:
            "Arial, sans-serif",

          color:
            "#334b5c",
        }}
      >
        Verificando sessão...
      </div>
    );
  }


  // ======================================================
  // LOGIN
  // ======================================================

  if (!autenticado) {
    return (
      <Login
        onLogin={
          aoRealizarLogin
        }
      />
    );
  }


  // ======================================================
  // SISTEMA
  // ======================================================

  return (
    <div className="app-layout">
      <Navbar
        paginaAtual={
          paginaAtual
        }

        setPaginaAtual={
          setPaginaAtual
        }

        usuarioLogado={
          usuarioLogado
        }
      />

      <main className="app-main">
        <div
          style={{
            display: "flex",

            justifyContent:
              "flex-end",

            alignItems:
              "center",

            gap: "12px",

            marginBottom:
              "12px",
          }}
        >
          {usuarioLogado && (
            <span
              style={{
                fontSize:
                  "12px",

                color:
                  "#647783",
              }}
            >
              Usuário:{" "}

              <strong>
                {
                  usuarioLogado.nome
                }
              </strong>

              {usuarioLogado
                .administrador &&
                " • Administrador"}
            </span>
          )}

          <button
            type="button"

            onClick={
              fazerLogout
            }

            style={{
              height:
                "34px",

              padding:
                "0 14px",

              border:
                "1px solid #d3dde3",

              borderRadius:
                "6px",

              background:
                "#ffffff",

              color:
                "#314957",

              cursor:
                "pointer",

              fontSize:
                "12px",

              fontWeight:
                "600",
            }}
          >
            Sair
          </button>
        </div>

        <div className="app-main-container">
          {renderizarPagina()}
        </div>
      </main>
    </div>
  );
}

export default App;