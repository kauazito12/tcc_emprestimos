/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState } from "react";
import "./Home.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001";

const INTERVALO_ATUALIZACAO = 5000;

function formatarDataAtual() {
  const data = new Date();

  const diaSemana = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(data);

  const dia = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
  }).format(data);

  const mes = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
  }).format(data);

  const ano = new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
  }).format(data);

  return `${diaSemana}, ${dia} de ${mes} de ${ano}`.toLowerCase();
}

function Home() {
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarResumoDashboard();

    const intervalo = setInterval(() => {
      buscarResumoDashboard(true);
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

  async function buscarResumoDashboard(silencioso = false) {
    try {
      if (!silencioso) {
        setCarregando(true);
      }

      const resposta = await fetch(
        `${API_URL}/dashboard/materiais-resumo`
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        if (!silencioso) {
          mostrarMensagem(
            dados.erro || "Erro ao carregar os dados do painel.",
            "erro"
          );
        }

        return;
      }

      setDadosGrafico(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error(error);

      if (!silencioso) {
        mostrarMensagem(
          "Não foi possível conectar ao servidor.",
          "erro"
        );
      }
    } finally {
      if (!silencioso) {
        setCarregando(false);
      }
    }
  }

  const totalDisponiveis = dadosGrafico.reduce(
    (acumulador, item) =>
      acumulador + Number(item.disponiveis || 0),
    0
  );

  const totalEmprestados = dadosGrafico.reduce(
    (acumulador, item) =>
      acumulador + Number(item.emprestados || 0),
    0
  );

  const totalGeral = totalDisponiveis + totalEmprestados;

  const percentualDisponivel =
    totalGeral > 0
      ? Math.round((totalDisponiveis / totalGeral) * 100)
      : 0;

  const dataAtual = formatarDataAtual();

  return (
    <div className="home-page">
      {mensagem && (
        <div
          className={`mensagem-topo ${
            tipoMensagem === "erro"
              ? "mensagem-erro"
              : "mensagem-sucesso"
          }`}
        >
          <span className="mensagem-indicador" />
          {mensagem}
        </div>
      )}

      <header className="home-header">
        <div>
          <span className="home-identificacao">
            PAINEL DE CONTROLE
          </span>

          <h1>Visão geral</h1>

          <p>
            Acompanhe a disponibilidade dos materiais e os empréstimos
            realizados.
          </p>
        </div>

        <div className="home-data">
          <span>Data atual</span>
          <strong>{dataAtual}</strong>
        </div>
      </header>

      <section className="cards-resumo">
        <article className="card-resumo card-disponiveis">
          <div className="card-resumo-topo">
            <span className="card-resumo-status">
              Em estoque
            </span>
          </div>

          <div className="card-resumo-conteudo">
            <span className="titulo-card">
              Itens disponíveis
            </span>

            <strong>{totalDisponiveis}</strong>
          </div>

          <p>
            Materiais disponíveis para novos empréstimos.
          </p>
        </article>

        <article className="card-resumo card-emprestados">
          <div className="card-resumo-topo">
            <span className="card-resumo-status">
              Em uso
            </span>
          </div>

          <div className="card-resumo-conteudo">
            <span className="titulo-card">
              Itens emprestados
            </span>

            <strong>{totalEmprestados}</strong>
          </div>

          <p>
            Materiais que estão atualmente com professores.
          </p>
        </article>

        <article className="card-resumo card-total">
          <div className="card-resumo-topo">
            <span className="card-resumo-status">
              {percentualDisponivel}% disponível
            </span>
          </div>

          <div className="card-resumo-conteudo">
            <span className="titulo-card">
              Total de itens
            </span>

            <strong>{totalGeral}</strong>
          </div>

          <p>
            Quantidade total registrada no estoque da escola.
          </p>
        </article>
      </section>

      <section className="grafico-section">
        <div className="grafico-topo">
          <div>
            <span className="grafico-subtitulo">
              CONTROLE DE ESTOQUE
            </span>

            <h2>Resumo dos materiais</h2>

            <p>
              Comparativo entre itens disponíveis e itens emprestados.
            </p>
          </div>

          <button
            type="button"
            className="botao-atualizar"
            onClick={() => buscarResumoDashboard()}
            disabled={carregando}
          >
            <span className={carregando ? "icone-girando" : ""}>
              ↻
            </span>

            {carregando
              ? "Atualizando..."
              : "Atualizar dados"}
          </button>
        </div>

        <div className="grafico-legenda">
          <span>
            <i className="legenda-cor legenda-disponivel" />
            Disponíveis
          </span>

          <span>
            <i className="legenda-cor legenda-emprestado" />
            Emprestados
          </span>
        </div>

        {carregando ? (
          <div className="estado-painel">
            <span className="carregamento-circulo" />

            <p>Carregando informações do estoque...</p>
          </div>
        ) : dadosGrafico.length === 0 ? (
          <div className="estado-painel">
            <strong>Nenhum material cadastrado</strong>

            <p>
              Cadastre materiais para visualizar o resumo do estoque.
            </p>
          </div>
        ) : (
          <div className="grafico-lista">
            {dadosGrafico.map((item) => {
              const disponiveis = Number(item.disponiveis || 0);
              const emprestados = Number(item.emprestados || 0);

              const total =
                Number(item.total || 0) ||
                disponiveis + emprestados;

              const larguraDisponiveis =
                total > 0
                  ? (disponiveis / total) * 100
                  : 0;

              const larguraEmprestados =
                total > 0
                  ? (emprestados / total) * 100
                  : 0;

              const percentualItem =
                total > 0
                  ? Math.round((disponiveis / total) * 100)
                  : 0;

              return (
                <article
                  className="grafico-item"
                  key={item.id}
                >
                  <div className="grafico-item-topo">
                    <div className="grafico-material">
                      <div>
                        <h3>{item.nome}</h3>

                        <p>
                          {item.tipo ||
                            "Sem categoria informada"}
                        </p>
                      </div>
                    </div>

                    <div className="grafico-numeros">
                      <div>
                        <span>Disponíveis</span>
                        <strong>{disponiveis}</strong>
                      </div>

                      <div>
                        <span>Emprestados</span>
                        <strong>{emprestados}</strong>
                      </div>

                      <div>
                        <span>Total</span>
                        <strong>{total}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="barra-container">
                    <div className="barra-dupla">
                      <div
                        className="barra-disponiveis"
                        style={{
                          width: `${larguraDisponiveis}%`,
                        }}
                        title={`${disponiveis} disponíveis`}
                      />

                      <div
                        className="barra-emprestados"
                        style={{
                          width: `${larguraEmprestados}%`,
                        }}
                        title={`${emprestados} emprestados`}
                      />
                    </div>

                    <span className="barra-percentual">
                      {percentualItem}% disponível
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;