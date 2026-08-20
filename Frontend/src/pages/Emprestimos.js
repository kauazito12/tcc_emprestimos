/* eslint-disable react-hooks/exhaustive-deps */

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import "./Emprestimos.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001";

const INTERVALO_ATUALIZACAO = 5000;

function formatarData(data) {
  if (!data) return "-";

  return new Date(data).toLocaleString("pt-BR");
}

export default function Emprestimos() {
  const [professores, setProfessores] = useState([]);
  const [materiais, setMateriais] = useState([]);

  const [
    professorSelecionado,
    setProfessorSelecionado,
  ] = useState("");

  const [
    nomeProfessorSelecionado,
    setNomeProfessorSelecionado,
  ] = useState("");

  const [
    listaProfessoresAberta,
    setListaProfessoresAberta,
  ] = useState(false);

  const seletorProfessorRef = useRef(null);

  const [
    itensNovoEmprestimo,
    setItensNovoEmprestimo,
  ] = useState([
    {
      material_id: "",
      quantidade: 1,
    },
  ]);

  const [
    resumoEmprestimos,
    setResumoEmprestimos,
  ] = useState([]);

  const [carregando, setCarregando] =
    useState(false);

  const [
    quantidadesDevolucao,
    setQuantidadesDevolucao,
  ] = useState({});

  const [
    novosItensProfessor,
    setNovosItensProfessor,
  ] = useState({});

  const [mensagem, setMensagem] = useState("");

  const [tipoMensagem, setTipoMensagem] =
    useState("");

  useEffect(() => {
    carregarDadosIniciais();

    const intervalo = setInterval(() => {
      atualizarDadosAutomaticamente();
    }, INTERVALO_ATUALIZACAO);

    return () => {
      clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    function fecharListaAoClicarFora(event) {
      if (
        seletorProfessorRef.current &&
        !seletorProfessorRef.current.contains(
          event.target
        )
      ) {
        setListaProfessoresAberta(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharListaAoClicarFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharListaAoClicarFora
      );
    };
  }, []);

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

      mostrarMensagem(
        "Erro ao carregar dados",
        "erro"
      );
    } finally {
      setCarregando(false);
    }
  }

  async function atualizarDadosAutomaticamente() {
    try {
      await Promise.all([
        buscarProfessores(),
        buscarMateriais(),
        buscarResumoEmprestimos(),
      ]);
    } catch (error) {
      console.error(
        "Erro na atualização automática:",
        error
      );
    }
  }

  async function buscarProfessores() {
    const resposta = await fetch(
      `${API_URL}/professores`
    );

    if (!resposta.ok) {
      throw new Error(
        "Erro ao buscar professores"
      );
    }

    const dados = await resposta.json();

    const professoresOrdenados =
      Array.isArray(dados)
        ? [...dados].sort((a, b) =>
            String(
              a.nome || ""
            ).localeCompare(
              String(b.nome || ""),
              "pt-BR",
              {
                sensitivity: "base",
              }
            )
          )
        : [];

    setProfessores(professoresOrdenados);
  }

  async function buscarMateriais() {
    const resposta = await fetch(
      `${API_URL}/materiais`
    );

    if (!resposta.ok) {
      throw new Error(
        "Erro ao buscar materiais"
      );
    }

    const dados = await resposta.json();

    setMateriais(
      Array.isArray(dados) ? dados : []
    );
  }

  async function buscarResumoEmprestimos() {
    const resposta = await fetch(
      `${API_URL}/emprestimos/ativos/resumo`
    );

    if (!resposta.ok) {
      throw new Error(
        "Erro ao buscar empréstimos"
      );
    }

    const dados = await resposta.json();

    setResumoEmprestimos(
      Array.isArray(dados) ? dados : []
    );
  }

  function alterarPesquisaProfessor(valor) {
    setNomeProfessorSelecionado(valor);

    setProfessorSelecionado("");

    setListaProfessoresAberta(true);

    const professorExato = professores.find(
      (professor) =>
        String(professor.nome || "")
          .trim()
          .toLowerCase() ===
        valor.trim().toLowerCase()
    );

    if (professorExato) {
      setProfessorSelecionado(
        String(professorExato.id)
      );
    }
  }

  function selecionarProfessor(professor) {
    setProfessorSelecionado(
      String(professor.id)
    );

    setNomeProfessorSelecionado(
      professor.nome
    );

    setListaProfessoresAberta(false);
  }

  function adicionarLinhaNovoEmprestimo() {
    setItensNovoEmprestimo([
      ...itensNovoEmprestimo,
      {
        material_id: "",
        quantidade: 1,
      },
    ]);
  }

  function atualizarLinhaNovoEmprestimo(
    index,
    campo,
    valor
  ) {
    const copia = [...itensNovoEmprestimo];

    copia[index][campo] = valor;

    setItensNovoEmprestimo(copia);
  }

  function removerLinhaNovoEmprestimo(index) {
    const copia = [...itensNovoEmprestimo];

    copia.splice(index, 1);

    setItensNovoEmprestimo(
      copia.length
        ? copia
        : [
            {
              material_id: "",
              quantidade: 1,
            },
          ]
    );
  }

  async function salvarEmprestimo() {
    try {
      if (!professorSelecionado) {
        mostrarMensagem(
          "Selecione um professor válido",
          "erro"
        );

        return;
      }

      const itensFiltrados =
        itensNovoEmprestimo.filter(
          (item) =>
            item.material_id &&
            Number(item.quantidade) > 0
        );

      if (itensFiltrados.length === 0) {
        mostrarMensagem(
          "Adicione pelo menos um item válido",
          "erro"
        );

        return;
      }

      const resposta = await fetch(
        `${API_URL}/emprestimos/lote`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            professor_id: Number(
              professorSelecionado
            ),

            itens: itensFiltrados.map(
              (item) => ({
                material_id: Number(
                  item.material_id
                ),

                quantidade: Number(
                  item.quantidade
                ),
              })
            ),
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao registrar empréstimo",
          "erro"
        );

        return;
      }

      setProfessorSelecionado("");

      setNomeProfessorSelecionado("");

      setListaProfessoresAberta(false);

      setItensNovoEmprestimo([
        {
          material_id: "",
          quantidade: 1,
        },
      ]);

      await Promise.all([
        buscarMateriais(),
        buscarResumoEmprestimos(),
      ]);

      mostrarMensagem(
        "Empréstimo registrado com sucesso",
        "sucesso"
      );
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao salvar empréstimo",
        "erro"
      );
    }
  }

  function agruparPorProfessor(lista) {
    const grupos = {};

    for (const item of lista) {
      const professorId =
        item.professor_id;

      if (!grupos[professorId]) {
        grupos[professorId] = {
          professor_id:
            item.professor_id,

          professor_nome:
            item.professor_nome,

          ultima_movimentacao:
            item.ultimo_emprestimo,

          itens: [],

          total_itens: 0,
        };
      }

      grupos[professorId].itens.push(
        item
      );

      grupos[
        professorId
      ].total_itens += Number(
        item.quantidade || 0
      );

      const dataItem = new Date(
        item.ultimo_emprestimo
      ).getTime();

      const dataGrupo = new Date(
        grupos[
          professorId
        ].ultima_movimentacao
      ).getTime();

      if (dataItem > dataGrupo) {
        grupos[
          professorId
        ].ultima_movimentacao =
          item.ultimo_emprestimo;
      }
    }

    return Object.values(grupos).sort(
      (a, b) => {
        const dataA = new Date(
          a.ultima_movimentacao
        ).getTime();

        const dataB = new Date(
          b.ultima_movimentacao
        ).getTime();

        return dataB - dataA;
      }
    );
  }

  async function devolverItem(
    professorId,
    materialId
  ) {
    try {
      const chave =
        `${professorId}-${materialId}`;

      const quantidade = Number(
        quantidadesDevolucao[chave] || 1
      );

      if (quantidade < 1) {
        mostrarMensagem(
          "Quantidade inválida",
          "erro"
        );

        return;
      }

      const resposta = await fetch(
        `${API_URL}/emprestimos/devolver-parcial`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            professor_id: Number(
              professorId
            ),

            material_id: Number(
              materialId
            ),

            quantidade: Number(
              quantidade
            ),
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao devolver item",
          "erro"
        );

        return;
      }

      setQuantidadesDevolucao(
        (prev) => ({
          ...prev,
          [chave]: 1,
        })
      );

      await Promise.all([
        buscarMateriais(),
        buscarResumoEmprestimos(),
      ]);

      mostrarMensagem(
        dados.mensagem ||
          "Item devolvido com sucesso",
        "sucesso"
      );
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao devolver item",
        "erro"
      );
    }
  }

  async function devolverTudo(
    professorId
  ) {
    try {
      const resposta = await fetch(
        `${API_URL}/emprestimos/devolver-tudo/${professorId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao devolver tudo",
          "erro"
        );

        return;
      }

      await Promise.all([
        buscarMateriais(),
        buscarResumoEmprestimos(),
      ]);

      mostrarMensagem(
        dados.mensagem ||
          "Todos os itens foram devolvidos",
        "sucesso"
      );
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao devolver tudo",
        "erro"
      );
    }
  }

  function atualizarNovoItemProfessor(
    professorId,
    campo,
    valor
  ) {
    setNovosItensProfessor((prev) => ({
      ...prev,

      [professorId]: {
        material_id:
          prev[professorId]?.material_id ||
          "",

        quantidade:
          prev[professorId]?.quantidade ||
          1,

        [campo]: valor,
      },
    }));
  }

  async function adicionarItemParaProfessor(
    professorId
  ) {
    try {
      const dadosProfessor =
        novosItensProfessor[professorId];

      if (
        !dadosProfessor?.material_id ||
        Number(
          dadosProfessor?.quantidade
        ) < 1
      ) {
        mostrarMensagem(
          "Selecione um material e informe uma quantidade válida",
          "erro"
        );

        return;
      }

      const resposta = await fetch(
        `${API_URL}/emprestimos/lote`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            professor_id: Number(
              professorId
            ),

            itens: [
              {
                material_id: Number(
                  dadosProfessor.material_id
                ),

                quantidade: Number(
                  dadosProfessor.quantidade
                ),
              },
            ],
          }),
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
            "Erro ao adicionar item",
          "erro"
        );

        return;
      }

      setNovosItensProfessor(
        (prev) => ({
          ...prev,

          [professorId]: {
            material_id: "",
            quantidade: 1,
          },
        })
      );

      await Promise.all([
        buscarMateriais(),
        buscarResumoEmprestimos(),
      ]);

      mostrarMensagem(
        "Item adicionado com sucesso",
        "sucesso"
      );
    } catch (error) {
      console.error(error);

      mostrarMensagem(
        "Erro ao adicionar item",
        "erro"
      );
    }
  }

  const professoresFiltrados =
    professores.filter((professor) => {
      const pesquisa =
        nomeProfessorSelecionado
          .trim()
          .toLowerCase();

      if (!pesquisa) {
        return true;
      }

      return String(
        professor.nome || ""
      )
        .toLowerCase()
        .includes(pesquisa);
    });

  const grupos =
    agruparPorProfessor(
      resumoEmprestimos
    );

  return (
    <div className="emprestimos-page">
      <style>
        {`
          .seletor-professor-personalizado {
            position: relative;
            width: 100%;
          }

          .seletor-professor-personalizado input {
            width: 100%;
            height: 44px;
            padding: 0 14px;
            border: 1px solid #b7c8d2;
            border-radius: 7px;
            background: #ffffff;
            color: #1f2d36;
            font-size: 12px;
            outline: none;
            box-sizing: border-box;
          }

          .seletor-professor-personalizado input:focus {
            border-color: #216493;
            box-shadow: 0 0 0 3px rgba(33, 100, 147, 0.10);
          }

          .lista-professores-personalizada {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            right: 0;
            width: 100%;
            max-height: 360px;
            overflow-y: auto;
            background: #ffffff;
            border: 1px solid #b7c8d2;
            border-radius: 7px;
            box-shadow: 0 10px 28px rgba(31, 61, 81, 0.18);
            z-index: 9999;
          }

          .opcao-professor-personalizada {
            width: 100%;
            display: block;
            padding: 11px 14px;
            border: none;
            border-bottom: 1px solid #edf1f3;
            background: #ffffff;
            color: #1f2d36;
            font-size: 12px;
            font-weight: 600;
            text-align: left;
            cursor: pointer;
          }

          .opcao-professor-personalizada:last-child {
            border-bottom: none;
          }

          .opcao-professor-personalizada:hover {
            background: #eaf3f9;
            color: #174f7d;
          }

          .nenhum-professor-encontrado {
            padding: 16px;
            color: #687983;
            font-size: 12px;
            text-align: center;
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

      <section className="bloco-cadastro">
        <h2>Novo Empréstimo</h2>

        <div className="form-group">
          <label>Professor</label>

          <div
            className="seletor-professor-personalizado"
            ref={seletorProfessorRef}
          >
            <input
              type="text"
              placeholder="Selecione ou digite o nome do professor"
              autoComplete="off"
              value={
                nomeProfessorSelecionado
              }
              onFocus={() =>
                setListaProfessoresAberta(
                  true
                )
              }
              onChange={(e) =>
                alterarPesquisaProfessor(
                  e.target.value
                )
              }
            />

            {listaProfessoresAberta && (
              <div className="lista-professores-personalizada">
                {professoresFiltrados.length ===
                0 ? (
                  <div className="nenhum-professor-encontrado">
                    Nenhum professor encontrado.
                  </div>
                ) : (
                  professoresFiltrados.map(
                    (professor) => (
                      <button
                        type="button"
                        key={professor.id}
                        className="opcao-professor-personalizada"
                        onMouseDown={(e) => {
                          e.preventDefault();

                          selecionarProfessor(
                            professor
                          );
                        }}
                      >
                        {professor.nome}
                      </button>
                    )
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lista-itens-cadastro">
          {itensNovoEmprestimo.map(
            (item, index) => (
              <div
                className="linha-item-cadastro"
                key={index}
              >
                <select
                  value={
                    item.material_id
                  }
                  onChange={(e) =>
                    atualizarLinhaNovoEmprestimo(
                      index,
                      "material_id",
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Selecione um material
                  </option>

                  {materiais.map(
                    (material) => (
                      <option
                        key={
                          material.id
                        }
                        value={
                          material.id
                        }
                      >
                        {material.nome} (
                        {
                          material.quantidade
                        }{" "}
                        em estoque)
                      </option>
                    )
                  )}
                </select>

                <input
                  type="number"
                  min="1"
                  value={
                    item.quantidade
                  }
                  onChange={(e) =>
                    atualizarLinhaNovoEmprestimo(
                      index,
                      "quantidade",
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className="btn-remover"
                  onClick={() =>
                    removerLinhaNovoEmprestimo(
                      index
                    )
                  }
                >
                  X
                </button>
              </div>
            )
          )}
        </div>

        <div className="acoes-cadastro">
          <button
            type="button"
            onClick={
              adicionarLinhaNovoEmprestimo
            }
          >
            Adicionar Linha
          </button>

          <button
            type="button"
            className="btn-principal"
            onClick={
              salvarEmprestimo
            }
          >
            Salvar Empréstimo
          </button>
        </div>
      </section>

      <section className="bloco-emprestados">
        <h2>Itens Emprestados</h2>

        {carregando ? (
          <p>Carregando...</p>
        ) : grupos.length === 0 ? (
          <p>
            Nenhum empréstimo ativo.
          </p>
        ) : (
          <div className="grid-cards-professores">
            {grupos.map((grupo) => (
              <div
                className="card-professor"
                key={grupo.professor_id}
              >
                <div className="card-professor-topo">
                  <div className="card-professor-header-info">
                    <h3>
                      {grupo.professor_nome}
                    </h3>

                    <p>
                      Última movimentação:{" "}
                      {formatarData(
                        grupo.ultima_movimentacao
                      )}
                    </p>
                  </div>

                  <button
                    className="btn-devolver-tudo"
                    onClick={() =>
                      devolverTudo(
                        grupo.professor_id
                      )
                    }
                  >
                    Devolver Tudo
                  </button>
                </div>

                <div className="card-resumo-professor">
                  <div className="mini-resumo">
                    <span>
                      Tipos de itens
                    </span>

                    <strong>
                      {grupo.itens.length}
                    </strong>
                  </div>

                  <div className="mini-resumo">
                    <span>
                      Total com professor
                    </span>

                    <strong>
                      {grupo.total_itens}
                    </strong>
                  </div>
                </div>

                <div className="lista-itens-professor">
                  {grupo.itens.map(
                    (item) => {
                      const chave =
                        `${item.professor_id}-${item.material_id}`;

                      return (
                        <div
                          className="item-professor"
                          key={chave}
                        >
                          <div className="item-info">
                            <strong>
                              {
                                item.material_nome
                              }
                            </strong>

                            <p>
                              Quantidade com o
                              professor:{" "}
                              {item.quantidade}
                            </p>
                          </div>

                          <div className="item-acoes">
                            <input
                              type="number"
                              min="1"
                              max={Number(
                                item.quantidade
                              )}
                              value={
                                quantidadesDevolucao[
                                  chave
                                ] || 1
                              }
                              onChange={(e) =>
                                setQuantidadesDevolucao(
                                  (prev) => ({
                                    ...prev,
                                    [chave]:
                                      e.target
                                        .value,
                                  })
                                )
                              }
                            />

                            <button
                              onClick={() =>
                                devolverItem(
                                  item.professor_id,
                                  item.material_id
                                )
                              }
                            >
                              Devolver
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="adicionar-mais-itens">
                  <h4>
                    Adicionar mais itens para{" "}
                    {grupo.professor_nome}
                  </h4>

                  <div className="adicionar-mais-itens-linha">
                    <select
                      value={
                        novosItensProfessor[
                          grupo
                            .professor_id
                        ]?.material_id ||
                        ""
                      }
                      onChange={(e) =>
                        atualizarNovoItemProfessor(
                          grupo.professor_id,
                          "material_id",
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Selecione um material
                      </option>

                      {materiais.map(
                        (material) => (
                          <option
                            key={
                              material.id
                            }
                            value={
                              material.id
                            }
                          >
                            {
                              material.nome
                            }{" "}
                            (
                            {
                              material.quantidade
                            }{" "}
                            em estoque)
                          </option>
                        )
                      )}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={
                        novosItensProfessor[
                          grupo
                            .professor_id
                        ]?.quantidade ||
                        1
                      }
                      onChange={(e) =>
                        atualizarNovoItemProfessor(
                          grupo.professor_id,
                          "quantidade",
                          e.target.value
                        )
                      }
                    />

                    <button
                      onClick={() =>
                        adicionarItemParaProfessor(
                          grupo.professor_id
                        )
                      }
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}