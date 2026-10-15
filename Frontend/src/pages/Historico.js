/* eslint-disable react-hooks/exhaustive-deps */

import React, {
  useEffect,
  useState,
} from "react";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:3001";

const INTERVALO_ATUALIZACAO =
  5000;


function formatarData(data) {
  if (!data) {
    return "-";
  }

  return new Date(
    data
  ).toLocaleString(
    "pt-BR"
  );
}


export default function Historico() {
  const [
    historico,
    setHistorico,
  ] = useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");


  // ======================================================
  // CARREGAMENTO
  // ======================================================

  useEffect(() => {
    buscarHistorico();

    const intervalo =
      setInterval(
        () => {
          buscarHistorico(
            false
          );
        },
        INTERVALO_ATUALIZACAO
      );

    return () => {
      clearInterval(
        intervalo
      );
    };
  }, []);


  // ======================================================
  // BUSCAR HISTÓRICO
  // ======================================================

  async function buscarHistorico(
    mostrarCarregamento = true
  ) {
    try {
      if (
        mostrarCarregamento
      ) {
        setCarregando(
          true
        );
      }

      const resposta =
        await fetch(
          `${API_URL}/emprestimos/historico-recente`
        );

      if (!resposta.ok) {
        throw new Error(
          "Erro ao buscar histórico"
        );
      }

      const dados =
        await resposta.json();

      setHistorico(
        Array.isArray(
          dados
        )
          ? dados
          : []
      );

      setErro("");

    } catch (error) {
      console.error(
        "Erro ao buscar histórico:",
        error
      );

      setErro(
        "Não foi possível carregar o histórico."
      );

    } finally {
      if (
        mostrarCarregamento
      ) {
        setCarregando(
          false
        );
      }
    }
  }


  // ======================================================
  // INTERFACE
  // ======================================================

  return (
    <div>

      <style>
        {`
          .historico-pagina {
            width: 100%;
          }

          .historico-card {
            width: 100%;
            padding: 22px 24px;
            background: #ffffff;
            border: 1px solid #dce5ea;
            border-radius: 10px;
            box-shadow: 0 3px 12px rgba(30, 60, 80, 0.06);
            box-sizing: border-box;
          }

          .historico-cabecalho {
            margin-bottom: 18px;
          }

          .historico-cabecalho h2 {
            margin: 0 0 5px;
            color: #22343f;
            font-size: 19px;
            font-weight: 750;
          }

          .historico-cabecalho p {
            margin: 0;
            color: #75858f;
            font-size: 12px;
          }

          .historico-tabela-container {
            width: 100%;
            overflow-x: auto;
          }

          .historico-tabela {
            width: 100%;
            min-width: 760px;
            border-collapse: collapse;
          }

          .historico-tabela thead {
            background: #f3f7f9;
          }

          .historico-tabela th {
            padding: 12px 10px;
            border-bottom: 1px solid #e1e8ec;
            color: #667b87;
            font-size: 9px;
            font-weight: 800;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }

          .historico-tabela td {
            padding: 13px 10px;
            border-bottom: 1px solid #e7edef;
            color: #334750;
            font-size: 11px;
          }

          .historico-tabela tbody tr:last-child td {
            border-bottom: none;
          }

          .historico-tabela tbody tr:hover {
            background: #fafcfd;
          }

          .historico-usuario {
            font-weight: 700;
            color: #294d61;
          }

          .historico-quantidade {
            font-weight: 700;
          }

          .historico-vazio {
            padding: 28px 20px;
            background: #f8fafb;
            border: 1px dashed #d5e0e5;
            border-radius: 8px;
            color: #74858f;
            font-size: 12px;
            text-align: center;
          }

          .historico-carregando {
            padding: 28px;
            color: #71838e;
            font-size: 12px;
            text-align: center;
          }

          .historico-erro {
            padding: 14px 16px;
            background: #fff4f4;
            border: 1px solid #f0cece;
            border-radius: 7px;
            color: #a43b3b;
            font-size: 12px;
          }

          .historico-informacao {
            display: inline-flex;
            align-items: center;
            margin-top: 16px;
            padding: 8px 11px;
            background: #f5f8fa;
            border-radius: 6px;
            color: #71838e;
            font-size: 10px;
          }
        `}
      </style>


      <div className="historico-pagina">

        <section className="historico-card">

          <div className="historico-cabecalho">

            <h2>
              Histórico de Empréstimos
            </h2>

            <p>
              Registros realizados pelos usuários
              do sistema nas últimas 48 horas.
            </p>

          </div>


          {erro ? (

            <div className="historico-erro">
              {erro}
            </div>

          ) : carregando ? (

            <div className="historico-carregando">
              Carregando histórico...
            </div>

          ) : historico.length ===
          0 ? (

            <div className="historico-vazio">

              Nenhum empréstimo foi registrado
              nas últimas 48 horas.

            </div>

          ) : (

            <div className="historico-tabela-container">

              <table className="historico-tabela">

                <thead>

                  <tr>

                    <th>
                      Data e hora
                    </th>

                    <th>
                      Registrado por
                    </th>

                    <th>
                      Professor
                    </th>

                    <th>
                      Material
                    </th>

                    <th>
                      Quantidade
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {historico.map(
                    (registro) => (

                      <tr
                        key={
                          registro.id
                        }
                      >

                        <td>
                          {formatarData(
                            registro.criado_em
                          )}
                        </td>


                        <td
                          className="historico-usuario"
                        >
                          {
                            registro.usuario_nome
                          }
                        </td>


                        <td>
                          {
                            registro.professor_nome
                          }
                        </td>


                        <td>
                          {
                            registro.material_nome
                          }
                        </td>


                        <td
                          className="historico-quantidade"
                        >
                          {
                            registro.quantidade
                          }
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}


          <div className="historico-informacao">

            Os registros permanecem disponíveis
            durante 48 horas.

          </div>

        </section>

      </div>

    </div>
  );
}