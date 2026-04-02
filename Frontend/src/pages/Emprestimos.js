import React, { useEffect, useState } from "react";
import "./Emprestimos.css";

const API_URL = "http://localhost:3001";

function formatarData(data) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

export default function Emprestimos() {
  const [professores, setProfessores] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [professorSelecionado, setProfessorSelecionado] = useState("");
  const [itensNovoEmprestimo, setItensNovoEmprestimo] = useState([
    { material_id: "", quantidade: 1 },
  ]);

  const [resumoEmprestimos, setResumoEmprestimos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const [quantidadesDevolucao, setQuantidadesDevolucao] = useState({});
  const [novosItensProfessor, setNovosItensProfessor] = useState({});

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  function mostrarMensagem(texto, tipo = "sucesso") {
    setMensagem(texto);
    setTipoMensagem(tipo);

    setTimeout(() => {
      setMensagem("");
      setTipoMensagem("");
    }, 3000);
  }

  async function carregarDadosIniciais() {
    setCarregando(true);
    try {
      await Promise.all([
        buscarProfessores(),
        buscarMateriais(),
        buscarResumoEmprestimos(),
      ]);
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao carregar dados", "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function buscarProfessores() {
    const resposta = await fetch(`${API_URL}/professores`);
    const dados = await resposta.json();
    setProfessores(dados);
  }

  async function buscarMateriais() {
    const resposta = await fetch(`${API_URL}/materiais`);
    const dados = await resposta.json();
    setMateriais(dados);
  }

  async function buscarResumoEmprestimos() {
    const resposta = await fetch(`${API_URL}/emprestimos/ativos/resumo`);
    const dados = await resposta.json();
    setResumoEmprestimos(dados);
  }

  function adicionarLinhaNovoEmprestimo() {
    setItensNovoEmprestimo([
      ...itensNovoEmprestimo,
      { material_id: "", quantidade: 1 },
    ]);
  }

  function atualizarLinhaNovoEmprestimo(index, campo, valor) {
    const copia = [...itensNovoEmprestimo];
    copia[index][campo] = valor;
    setItensNovoEmprestimo(copia);
  }

  function removerLinhaNovoEmprestimo(index) {
    const copia = [...itensNovoEmprestimo];
    copia.splice(index, 1);

    setItensNovoEmprestimo(
      copia.length ? copia : [{ material_id: "", quantidade: 1 }]
    );
  }

  async function salvarEmprestimo() {
    try {
      if (!professorSelecionado) {
        mostrarMensagem("Selecione um professor", "erro");
        return;
      }

      const itensFiltrados = itensNovoEmprestimo.filter(
        (item) => item.material_id && Number(item.quantidade) > 0
      );

      if (itensFiltrados.length === 0) {
        mostrarMensagem("Adicione pelo menos um item válido", "erro");
        return;
      }

      const resposta = await fetch(`${API_URL}/emprestimos/lote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professor_id: Number(professorSelecionado),
          itens: itensFiltrados.map((item) => ({
            material_id: Number(item.material_id),
            quantidade: Number(item.quantidade),
          })),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(dados.erro || "Erro ao registrar empréstimo", "erro");
        return;
      }

      setProfessorSelecionado("");
      setItensNovoEmprestimo([{ material_id: "", quantidade: 1 }]);

      await Promise.all([buscarMateriais(), buscarResumoEmprestimos()]);

      mostrarMensagem("Empréstimo registrado com sucesso", "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao salvar empréstimo", "erro");
    }
  }

  function agruparPorProfessor(lista) {
    const grupos = {};

    for (const item of lista) {
      const professorId = item.professor_id;

      if (!grupos[professorId]) {
        grupos[professorId] = {
          professor_id: item.professor_id,
          professor_nome: item.professor_nome,
          ultima_movimentacao: item.ultimo_emprestimo,
          itens: [],
        };
      }

      grupos[professorId].itens.push(item);

      if (
        new Date(item.ultimo_emprestimo).getTime() >
        new Date(grupos[professorId].ultima_movimentacao).getTime()
      ) {
        grupos[professorId].ultima_movimentacao = item.ultimo_emprestimo;
      }
    }

    return Object.values(grupos);
  }

  async function devolverItem(professorId, materialId) {
    try {
      const chave = `${professorId}-${materialId}`;
      const quantidade = Number(quantidadesDevolucao[chave] || 1);

      if (quantidade < 1) {
        mostrarMensagem("Quantidade inválida", "erro");
        return;
      }

      const resposta = await fetch(`${API_URL}/emprestimos/devolver-parcial`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professor_id: Number(professorId),
          material_id: Number(materialId),
          quantidade: Number(quantidade),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(dados.erro || "Erro ao devolver item", "erro");
        return;
      }

      setQuantidadesDevolucao((prev) => ({
        ...prev,
        [chave]: 1,
      }));

      await Promise.all([buscarMateriais(), buscarResumoEmprestimos()]);

      mostrarMensagem(dados.mensagem || "Item devolvido com sucesso", "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao devolver item", "erro");
    }
  }

  async function devolverTudo(professorId) {
    try {
      const resposta = await fetch(
        `${API_URL}/emprestimos/devolver-tudo/${professorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(dados.erro || "Erro ao devolver tudo", "erro");
        return;
      }

      await Promise.all([buscarMateriais(), buscarResumoEmprestimos()]);

      mostrarMensagem(
        dados.mensagem || "Todos os itens foram devolvidos",
        "sucesso"
      );
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao devolver tudo", "erro");
    }
  }

  function atualizarNovoItemProfessor(professorId, campo, valor) {
    setNovosItensProfessor((prev) => ({
      ...prev,
      [professorId]: {
        material_id: prev[professorId]?.material_id || "",
        quantidade: prev[professorId]?.quantidade || 1,
        [campo]: valor,
      },
    }));
  }

  async function adicionarItemParaProfessor(professorId) {
    try {
      const dadosProfessor = novosItensProfessor[professorId];

      if (!dadosProfessor?.material_id || Number(dadosProfessor?.quantidade) < 1) {
        mostrarMensagem(
          "Selecione um material e informe uma quantidade válida",
          "erro"
        );
        return;
      }

      const resposta = await fetch(`${API_URL}/emprestimos/lote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professor_id: Number(professorId),
          itens: [
            {
              material_id: Number(dadosProfessor.material_id),
              quantidade: Number(dadosProfessor.quantidade),
            },
          ],
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(dados.erro || "Erro ao adicionar item", "erro");
        return;
      }

      setNovosItensProfessor((prev) => ({
        ...prev,
        [professorId]: {
          material_id: "",
          quantidade: 1,
        },
      }));

      await Promise.all([buscarMateriais(), buscarResumoEmprestimos()]);

      mostrarMensagem("Item adicionado com sucesso", "sucesso");
    } catch (error) {
      console.error(error);
      mostrarMensagem("Erro ao adicionar item", "erro");
    }
  }

  const grupos = agruparPorProfessor(resumoEmprestimos);

  return (
    <div className="emprestimos-page">
      <div className="emprestimos-container">
        {mensagem && (
          <div
            className={`mensagem-topo ${
              tipoMensagem === "erro" ? "mensagem-erro" : "mensagem-sucesso"
            }`}
          >
            {mensagem}
          </div>
        )}

        <section className="bloco-cadastro">
          <h2>Novo Empréstimo</h2>

          <div className="form-group">
            <label>Professor</label>
            <select
              value={professorSelecionado}
              onChange={(e) => setProfessorSelecionado(e.target.value)}
            >
              <option value="">Selecione um professor</option>
              {professores.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="lista-itens-cadastro">
            {itensNovoEmprestimo.map((item, index) => (
              <div className="linha-item-cadastro" key={index}>
                <select
                  value={item.material_id}
                  onChange={(e) =>
                    atualizarLinhaNovoEmprestimo(index, "material_id", e.target.value)
                  }
                >
                  <option value="">Selecione um material</option>
                  {materiais.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.nome} ({material.quantidade} em estoque)
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.quantidade}
                  onChange={(e) =>
                    atualizarLinhaNovoEmprestimo(index, "quantidade", e.target.value)
                  }
                />

                <button
                  type="button"
                  className="btn-remover"
                  onClick={() => removerLinhaNovoEmprestimo(index)}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          <div className="acoes-cadastro">
            <button type="button" onClick={adicionarLinhaNovoEmprestimo}>
              Adicionar Linha
            </button>

            <button type="button" className="btn-principal" onClick={salvarEmprestimo}>
              Salvar Empréstimo
            </button>
          </div>
        </section>

        <section className="bloco-emprestados">
          <h2>Itens Emprestados</h2>

          {carregando ? (
            <p>Carregando...</p>
          ) : grupos.length === 0 ? (
            <p>Nenhum empréstimo ativo.</p>
          ) : (
            grupos.map((grupo) => (
              <div className="card-professor" key={grupo.professor_id}>
                <div className="card-professor-topo">
                  <div>
                    <h3>{grupo.professor_nome}</h3>
                    <p>
                      Última movimentação: {formatarData(grupo.ultima_movimentacao)}
                    </p>
                  </div>

                  <button
                    className="btn-devolver-tudo"
                    onClick={() => devolverTudo(grupo.professor_id)}
                  >
                    Devolver Tudo
                  </button>
                </div>

                <div className="lista-itens-professor">
                  {grupo.itens.map((item) => {
                    const chave = `${item.professor_id}-${item.material_id}`;

                    return (
                      <div className="item-professor" key={chave}>
                        <div className="item-info">
                          <strong>{item.material_nome}</strong>
                          <p>Quantidade com o professor: {item.quantidade}</p>
                        </div>

                        <div className="item-acoes">
                          <input
                            type="number"
                            min="1"
                            max={Number(item.quantidade)}
                            value={quantidadesDevolucao[chave] || 1}
                            onChange={(e) =>
                              setQuantidadesDevolucao((prev) => ({
                                ...prev,
                                [chave]: e.target.value,
                              }))
                            }
                          />

                          <button
                            onClick={() =>
                              devolverItem(item.professor_id, item.material_id)
                            }
                          >
                            Devolver
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="adicionar-mais-itens">
                  <h4>Adicionar mais itens para {grupo.professor_nome}</h4>

                  <div className="adicionar-mais-itens-linha">
                    <select
                      value={novosItensProfessor[grupo.professor_id]?.material_id || ""}
                      onChange={(e) =>
                        atualizarNovoItemProfessor(
                          grupo.professor_id,
                          "material_id",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Selecione um material</option>
                      {materiais.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.nome} ({material.quantidade} em estoque)
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={novosItensProfessor[grupo.professor_id]?.quantidade || 1}
                      onChange={(e) =>
                        atualizarNovoItemProfessor(
                          grupo.professor_id,
                          "quantidade",
                          e.target.value
                        )
                      }
                    />

                    <button
                      onClick={() => adicionarItemParaProfessor(grupo.professor_id)}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}