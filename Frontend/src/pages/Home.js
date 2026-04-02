import React, { useEffect, useState } from "react";
import "./Home.css";

const API_URL = "http://localhost:3001";

function Home() {
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarResumoDashboard();
  }, []);

  function mostrarMensagem(texto, tipo = "sucesso") {
    setMensagem(texto);
    setTipoMensagem(tipo);

    setTimeout(() => {
      setMensagem("");
      setTipoMensagem("");
    }, 3000);
  }

  async function buscarResumoDashboard() {
    try {
      setCarregando(true);

      const resposta = await fetch(`${API_URL}/dashboard/materiais-resumo`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(dados.erro || "Erro ao carregar gráfico", "erro");
        return;
      }

      setDadosGrafico(dados);
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao carregar gráfico", "erro");
    } finally {
      setCarregando(false);
    }
  }

  const totalDisponiveis = dadosGrafico.reduce(
    (acc, item) => acc + Number(item.disponiveis || 0),
    0
  );

  const totalEmprestados = dadosGrafico.reduce(
    (acc, item) => acc + Number(item.emprestados || 0),
    0
  );

  return (
    <div className="home-page">
      {mensagem && (
        <div
          className={`mensagem-topo ${
            tipoMensagem === "erro" ? "mensagem-erro" : "mensagem-sucesso"
          }`}
        >
          {mensagem}
        </div>
      )}

      <section className="home-header">
        <h2>Sistema de Empréstimo de Materiais</h2>
        <p>Painel geral dos materiais disponíveis e emprestados.</p>
      </section>

      <section className="cards-resumo">
        <div className="card-resumo">
          <span className="titulo-card">Itens disponíveis</span>
          <strong>{totalDisponiveis}</strong>
        </div>

        <div className="card-resumo">
          <span className="titulo-card">Itens emprestados</span>
          <strong>{totalEmprestados}</strong>
        </div>

        <div className="card-resumo">
          <span className="titulo-card">Total geral</span>
          <strong>{totalDisponiveis + totalEmprestados}</strong>
        </div>
      </section>

      <section className="grafico-section">
        <div className="grafico-topo">
          <h3>Gráfico de Materiais</h3>
          <button onClick={buscarResumoDashboard}>Atualizar</button>
        </div>

        {carregando ? (
          <p className="texto-centralizado">Carregando gráfico...</p>
        ) : dadosGrafico.length === 0 ? (
          <p className="texto-centralizado">Nenhum material cadastrado.</p>
        ) : (
          <div className="grafico-lista">
            {dadosGrafico.map((item) => {
              const disponiveis = Number(item.disponiveis || 0);
              const emprestados = Number(item.emprestados || 0);
              const total = Number(item.total || 0);

              const larguraDisponiveis =
                total > 0 ? (disponiveis / total) * 100 : 0;

              const larguraEmprestados =
                total > 0 ? (emprestados / total) * 100 : 0;

              return (
                <div className="grafico-item" key={item.id}>
                  <div className="grafico-item-topo">
                    <div>
                      <h4>{item.nome}</h4>
                      <p>{item.tipo || "Sem tipo"}</p>
                    </div>

                    <div className="grafico-numeros">
                      <span>Disponíveis: {disponiveis}</span>
                      <span>Emprestados: {emprestados}</span>
                    </div>
                  </div>

                  <div className="barra-dupla">
                    <div
                      className="barra-disponiveis"
                      style={{ width: `${larguraDisponiveis}%` }}
                    >
                      {larguraDisponiveis > 8 ? disponiveis : ""}
                    </div>

                    <div
                      className="barra-emprestados"
                      style={{ width: `${larguraEmprestados}%` }}
                    >
                      {larguraEmprestados > 8 ? emprestados : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;