require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const {
  authRouter,
  exigirAutenticacao,
} = require("./auth");

require("./notificacoes");

const app = express();


// ======================================================
// CORS
// ======================================================

const origensPermitidas = [
  "http://localhost:3000",

  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (
      origin,
      callback
    ) {
      /*
        Requisições sem Origin são permitidas
        para chamadas internas e ferramentas.
      */

      if (!origin) {
        return callback(
          null,
          true
        );
      }

      if (
        origensPermitidas.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new Error(
          "Origem não permitida pelo CORS"
        )
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

console.log(
  "SERVIDOR RODANDO"
);


// ======================================================
// ROTA PÚBLICA DE TESTE
// ======================================================

app.get("/", (req, res) => {
  res.send("BACKEND ON");
});


// ======================================================
// AUTENTICAÇÃO
// ======================================================

app.use(
  "/auth",
  authRouter
);


// ======================================================
// TODAS AS ROTAS ABAIXO EXIGEM LOGIN
// ======================================================

app.use(
  exigirAutenticacao
);


// ======================================================
// DASHBOARD / HOME
// ======================================================

app.get(
  "/dashboard/materiais-resumo",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            m.id,
            m.nome,
            m.tipo,

            COALESCE(
              m.quantidade,
              0
            ) AS disponiveis,

            COALESCE(
              (
                SELECT COUNT(*)

                FROM emprestimos e

                WHERE
                  e.material_id =
                    m.id

                  AND e.devolvido =
                    FALSE
              ),
              0
            ) AS emprestados

          FROM materiais m

          ORDER BY
            m.nome ASC
        `);

      const dados =
        resultado.rows.map(
          (item) => ({
            ...item,

            total:
              Number(
                item.disponiveis
              ) +
              Number(
                item.emprestados
              ),
          })
        );

      res.json(dados);
    } catch (erro) {
      console.error(
        "Erro ao buscar resumo do dashboard:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao buscar resumo do dashboard",

        detalhe:
          erro.message,
      });
    }
  }
);


// ======================================================
// PROFESSORES
// ======================================================

app.get(
  "/professores",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(
          `
          SELECT *
          FROM professores
          ORDER BY id DESC
          `
        );

      res.json(
        resultado.rows
      );
    } catch (erro) {
      console.error(
        "Erro ao buscar professores:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao buscar professores",

        detalhe:
          erro.message,
      });
    }
  }
);


app.post(
  "/professores",
  async (req, res) => {
    try {
      const {
        nome,
        email,
      } = req.body;

      if (
        !nome ||
        !email
      ) {
        return res.status(400).json({
          erro:
            "Nome e email são obrigatórios",
        });
      }

      const resultado =
        await pool.query(
          `
          INSERT INTO professores
          (
            nome,
            email
          )

          VALUES
          (
            $1,
            $2
          )

          RETURNING *
          `,
          [
            nome,
            email,
          ]
        );

      res
        .status(201)
        .json(
          resultado.rows[0]
        );
    } catch (erro) {
      console.error(
        "Erro ao cadastrar professor:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao cadastrar professor",

        detalhe:
          erro.message,
      });
    }
  }
);


app.put(
  "/professores/:id",
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const {
        nome,
        email,
      } = req.body;

      if (
        !nome ||
        !email
      ) {
        return res.status(400).json({
          erro:
            "Nome e email são obrigatórios",
        });
      }

      const resultado =
        await pool.query(
          `
          UPDATE professores

          SET
            nome = $1,
            email = $2

          WHERE id = $3

          RETURNING *
          `,
          [
            nome,
            email,
            id,
          ]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res.status(404).json({
          erro:
            "Professor não encontrado",
        });
      }

      res.json(
        resultado.rows[0]
      );
    } catch (erro) {
      console.error(
        "Erro ao atualizar professor:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao atualizar professor",

        detalhe:
          erro.message,
      });
    }
  }
);


app.delete(
  "/professores/:id",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const {
        id,
      } = req.params;

      const professorId =
        Number(id);

      if (!professorId) {
        return res.status(400).json({
          erro:
            "ID do professor inválido",
        });
      }

      await client.query(
        "BEGIN"
      );

      const professorExiste =
        await client.query(
          `
          SELECT id
          FROM professores
          WHERE id = $1
          `,
          [professorId]
        );

      if (
        professorExiste.rows
          .length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          erro:
            "Professor não encontrado",
        });
      }

      const emprestimosAtivos =
        await client.query(
          `
          SELECT
            material_id,

            COUNT(*)::INTEGER
              AS quantidade

          FROM emprestimos

          WHERE
            professor_id = $1

            AND devolvido =
              FALSE

          GROUP BY
            material_id
          `,
          [professorId]
        );

      for (
        const item of
        emprestimosAtivos.rows
      ) {
        await client.query(
          `
          UPDATE materiais

          SET quantidade =
            quantidade + $1

          WHERE id = $2
          `,
          [
            Number(
              item.quantidade
            ),

            Number(
              item.material_id
            ),
          ]
        );
      }

      await client.query(
        `
        DELETE FROM emprestimos
        WHERE professor_id = $1
        `,
        [professorId]
      );

      const resultado =
        await client.query(
          `
          DELETE FROM professores
          WHERE id = $1
          RETURNING *
          `,
          [professorId]
        );

      await client.query(
        "COMMIT"
      );

      res.json({
        mensagem:
          "Professor excluído com sucesso",

        professor:
          resultado.rows[0],
      });
    } catch (erro) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao excluir professor:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao excluir professor",

        detalhe:
          erro.message,
      });
    } finally {
      client.release();
    }
  }
);


// ======================================================
// TIPOS DE MATERIAIS
// ======================================================

app.get(
  "/tipos-materiais",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT *
          FROM tipos_materiais
          ORDER BY nome ASC
        `);

      res.json(
        resultado.rows
      );
    } catch (erro) {
      console.error(
        "Erro ao buscar tipos de materiais:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao buscar tipos de materiais",

        detalhe:
          erro.message,
      });
    }
  }
);


app.post(
  "/tipos-materiais",
  async (req, res) => {
    try {
      const {
        nome,
      } = req.body;

      const nomeLimpo =
        String(
          nome || ""
        ).trim();

      if (!nomeLimpo) {
        return res.status(400).json({
          erro:
            "Informe o nome do tipo de material",
        });
      }

      const existente =
        await pool.query(
          `
          SELECT id

          FROM tipos_materiais

          WHERE LOWER(nome) =
            LOWER($1)
          `,
          [nomeLimpo]
        );

      if (
        existente.rows.length > 0
      ) {
        return res.status(400).json({
          erro:
            "Esse tipo de material já está cadastrado",
        });
      }

      const resultado =
        await pool.query(
          `
          INSERT INTO tipos_materiais
          (
            nome
          )

          VALUES
          (
            $1
          )

          RETURNING *
          `,
          [nomeLimpo]
        );

      res
        .status(201)
        .json(
          resultado.rows[0]
        );
    } catch (erro) {
      console.error(
        "Erro ao cadastrar tipo de material:",
        erro.message
      );

      if (
        erro.code ===
        "23505"
      ) {
        return res.status(400).json({
          erro:
            "Esse tipo de material já está cadastrado",
        });
      }

      res.status(500).json({
        erro:
          "Erro ao cadastrar tipo de material",

        detalhe:
          erro.message,
      });
    }
  }
);


app.put(
  "/tipos-materiais/:id",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const {
        id,
      } = req.params;

      const {
        nome,
      } = req.body;

      const tipoId =
        Number(id);

      const nomeNovo =
        String(
          nome || ""
        ).trim();

      if (!tipoId) {
        return res.status(400).json({
          erro:
            "ID do tipo de material inválido",
        });
      }

      if (!nomeNovo) {
        return res.status(400).json({
          erro:
            "Informe o nome do tipo de material",
        });
      }

      await client.query(
        "BEGIN"
      );

      const tipoAtual =
        await client.query(
          `
          SELECT *
          FROM tipos_materiais
          WHERE id = $1
          `,
          [tipoId]
        );

      if (
        tipoAtual.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          erro:
            "Tipo de material não encontrado",
        });
      }

      const nomeAntigo =
        tipoAtual.rows[0].nome;

      const duplicado =
        await client.query(
          `
          SELECT id

          FROM tipos_materiais

          WHERE
            LOWER(nome) =
              LOWER($1)

            AND id <> $2
          `,
          [
            nomeNovo,
            tipoId,
          ]
        );

      if (
        duplicado.rows.length > 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          erro:
            "Já existe outro tipo com esse nome",
        });
      }

      const resultado =
        await client.query(
          `
          UPDATE tipos_materiais

          SET nome = $1

          WHERE id = $2

          RETURNING *
          `,
          [
            nomeNovo,
            tipoId,
          ]
        );

      await client.query(
        `
        UPDATE materiais

        SET tipo = $1

        WHERE LOWER(tipo) =
          LOWER($2)
        `,
        [
          nomeNovo,
          nomeAntigo,
        ]
      );

      await client.query(
        "COMMIT"
      );

      res.json({
        mensagem:
          "Tipo de material atualizado com sucesso",

        tipo:
          resultado.rows[0],
      });
    } catch (erro) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao atualizar tipo de material:",
        erro.message
      );

      if (
        erro.code ===
        "23505"
      ) {
        return res.status(400).json({
          erro:
            "Já existe outro tipo com esse nome",
        });
      }

      res.status(500).json({
        erro:
          "Erro ao atualizar tipo de material",

        detalhe:
          erro.message,
      });
    } finally {
      client.release();
    }
  }
);


app.delete(
  "/tipos-materiais/:id",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const {
        id,
      } = req.params;

      const tipoId =
        Number(id);

      if (!tipoId) {
        return res.status(400).json({
          erro:
            "ID do tipo de material inválido",
        });
      }

      await client.query(
        "BEGIN"
      );

      const tipoExiste =
        await client.query(
          `
          SELECT *
          FROM tipos_materiais
          WHERE id = $1
          `,
          [tipoId]
        );

      if (
        tipoExiste.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          erro:
            "Tipo de material não encontrado",
        });
      }

      const tipo =
        tipoExiste.rows[0];

      const materiaisUsandoTipo =
        await client.query(
          `
          SELECT
            COUNT(*)::INTEGER
              AS quantidade

          FROM materiais

          WHERE LOWER(tipo) =
            LOWER($1)
          `,
          [tipo.nome]
        );

      const quantidadeEmUso =
        Number(
          materiaisUsandoTipo
            .rows[0]
            .quantidade || 0
        );

      if (
        quantidadeEmUso > 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          erro:
            `Não é possível excluir o tipo "${tipo.nome}" porque ele está sendo usado por ${quantidadeEmUso} material(is).`,
        });
      }

      const resultado =
        await client.query(
          `
          DELETE FROM tipos_materiais

          WHERE id = $1

          RETURNING *
          `,
          [tipoId]
        );

      await client.query(
        "COMMIT"
      );

      res.json({
        mensagem:
          "Tipo de material excluído com sucesso",

        tipo:
          resultado.rows[0],
      });
    } catch (erro) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao excluir tipo de material:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao excluir tipo de material",

        detalhe:
          erro.message,
      });
    } finally {
      client.release();
    }
  }
);


// ======================================================
// MATERIAIS
// ======================================================

app.get(
  "/materiais",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(
          `
          SELECT *
          FROM materiais
          ORDER BY id DESC
          `
        );

      res.json(
        resultado.rows
      );
    } catch (erro) {
      console.error(
        "Erro ao buscar materiais:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao buscar materiais",

        detalhe:
          erro.message,
      });
    }
  }
);


app.post(
  "/materiais",
  async (req, res) => {
    try {
      const {
        nome,
        tipo,
        quantidade,
      } = req.body;

      if (
        !nome ||
        !tipo ||
        quantidade ===
          undefined ||
        quantidade ===
          null
      ) {
        return res.status(400).json({
          erro:
            "Nome, tipo e quantidade são obrigatórios",
        });
      }

      if (
        Number(quantidade) < 0
      ) {
        return res.status(400).json({
          erro:
            "Quantidade não pode ser negativa",
        });
      }

      const tipoExiste =
        await pool.query(
          `
          SELECT
            id,
            nome

          FROM tipos_materiais

          WHERE LOWER(nome) =
            LOWER($1)
          `,
          [tipo]
        );

      if (
        tipoExiste.rows.length === 0
      ) {
        return res.status(400).json({
          erro:
            "O tipo de material selecionado não está cadastrado",
        });
      }

      const nomeTipo =
        tipoExiste.rows[0].nome;

      const resultado =
        await pool.query(
          `
          INSERT INTO materiais
          (
            nome,
            tipo,
            quantidade
          )

          VALUES
          (
            $1,
            $2,
            $3
          )

          RETURNING *
          `,
          [
            nome,
            nomeTipo,
            Number(
              quantidade
            ),
          ]
        );

      res
        .status(201)
        .json(
          resultado.rows[0]
        );
    } catch (erro) {
      console.error(
        "Erro ao cadastrar material:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao cadastrar material",

        detalhe:
          erro.message,
      });
    }
  }
);


app.put(
  "/materiais/:id",
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const {
        nome,
        tipo,
        quantidade,
      } = req.body;

      if (
        !nome ||
        !tipo ||
        quantidade ===
          undefined ||
        quantidade ===
          null
      ) {
        return res.status(400).json({
          erro:
            "Nome, tipo e quantidade são obrigatórios",
        });
      }

      if (
        Number(quantidade) < 0
      ) {
        return res.status(400).json({
          erro:
            "Quantidade não pode ser negativa",
        });
      }

      const tipoExiste =
        await pool.query(
          `
          SELECT
            id,
            nome

          FROM tipos_materiais

          WHERE LOWER(nome) =
            LOWER($1)
          `,
          [tipo]
        );

      if (
        tipoExiste.rows.length === 0
      ) {
        return res.status(400).json({
          erro:
            "O tipo de material selecionado não está cadastrado",
        });
      }

      const nomeTipo =
        tipoExiste.rows[0].nome;

      const resultado =
        await pool.query(
          `
          UPDATE materiais

          SET
            nome = $1,
            tipo = $2,
            quantidade = $3

          WHERE id = $4

          RETURNING *
          `,
          [
            nome,
            nomeTipo,
            Number(
              quantidade
            ),
            id,
          ]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res.status(404).json({
          erro:
            "Material não encontrado",
        });
      }

      res.json(
        resultado.rows[0]
      );
    } catch (erro) {
      console.error(
        "Erro ao atualizar material:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao atualizar material",

        detalhe:
          erro.message,
      });
    }
  }
);


app.delete(
  "/materiais/:id",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const {
        id,
      } = req.params;

      const materialId =
        Number(id);

      if (!materialId) {
        return res.status(400).json({
          erro:
            "ID do material inválido",
        });
      }

      await client.query(
        "BEGIN"
      );

      const materialExiste =
        await client.query(
          `
          SELECT id
          FROM materiais
          WHERE id = $1
          `,
          [materialId]
        );

      if (
        materialExiste.rows
          .length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          erro:
            "Material não encontrado",
        });
      }

      await client.query(
        `
        DELETE FROM emprestimos
        WHERE material_id = $1
        `,
        [materialId]
      );

      const resultado =
        await client.query(
          `
          DELETE FROM materiais
          WHERE id = $1
          RETURNING *
          `,
          [materialId]
        );

      await client.query(
        "COMMIT"
      );

      res.json({
        mensagem:
          "Material excluído com sucesso",

        material:
          resultado.rows[0],
      });
    } catch (erro) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao excluir material:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao excluir material",

        detalhe:
          erro.message,
      });
    } finally {
      client.release();
    }
  }
);


// ======================================================
// EMPRÉSTIMOS
// ======================================================

app.post(
  "/emprestimos",
  async (req, res) => {
    try {
      const {
        professor_id,
        material_id,
      } = req.body;

      if (
        !professor_id ||
        !material_id
      ) {
        return res.status(400).json({
          erro:
            "professor_id e material_id são obrigatórios",
        });
      }

      const professorExiste =
        await pool.query(
          `
          SELECT *
          FROM professores
          WHERE id = $1
          `,
          [
            Number(
              professor_id
            ),
          ]
        );

      if (
        professorExiste.rows
          .length === 0
      ) {
        return res.status(404).json({
          erro:
            "Professor não encontrado",
        });
      }

      const materialResult =
        await pool.query(
          `
          SELECT *
          FROM materiais
          WHERE id = $1
          `,
          [
            Number(
              material_id
            ),
          ]
        );

      if (
        materialResult.rows
          .length === 0
      ) {
        return res.status(404).json({
          erro:
            "Material não encontrado",
        });
      }

      const material =
        materialResult.rows[0];

      if (
        Number(
          material.quantidade
        ) <= 0
      ) {
        return res.status(400).json({
          erro:
            "Material sem estoque",
        });
      }

      const resultado =
        await pool.query(
          `
          INSERT INTO emprestimos
          (
            professor_id,
            material_id,
            data_emprestimo,
            data_limite,
            devolvido,
            email_enviado
          )

          VALUES
          (
            $1,
            $2,
            NOW(),
            NOW() +
              INTERVAL '1 day',
            FALSE,
            FALSE
          )

          RETURNING *
          `,
          [
            Number(
              professor_id
            ),

            Number(
              material_id
            ),
          ]
        );

      await pool.query(
        `
        UPDATE materiais

        SET quantidade =
          quantidade - 1

        WHERE id = $1
        `,
        [
          Number(
            material_id
          ),
        ]
      );

      res
        .status(201)
        .json(
          resultado.rows[0]
        );
    } catch (erro) {
      console.error(
        "Erro ao registrar empréstimo:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao registrar empréstimo",

        detalhe:
          erro.message,
      });
    }
  }
);


app.post(
  "/emprestimos/lote",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const {
        professor_id,
        itens,
      } = req.body;

      if (
        !professor_id ||
        !Array.isArray(
          itens
        ) ||
        itens.length === 0
      ) {
        return res.status(400).json({
          erro:
            "professor_id e itens são obrigatórios",
        });
      }

      const professorExiste =
        await client.query(
          `
          SELECT *
          FROM professores
          WHERE id = $1
          `,
          [
            Number(
              professor_id
            ),
          ]
        );

      if (
        professorExiste.rows
          .length === 0
      ) {
        return res.status(404).json({
          erro:
            "Professor não encontrado",
        });
      }

      const somaPorMaterial = {};

      for (
        const item of itens
      ) {
        const materialId =
          Number(
            item.material_id
          );

        const quantidade =
          Number(
            item.quantidade
          );

        if (
          !materialId ||
          !quantidade ||
          quantidade < 1
        ) {
          return res.status(400).json({
            erro:
              "Cada item deve ter material_id e quantidade válida",
          });
        }

        somaPorMaterial[
          materialId
        ] =
          (
            somaPorMaterial[
              materialId
            ] || 0
          ) +
          quantidade;
      }

      await client.query(
        "BEGIN"
      );

      for (
        const materialId of
        Object.keys(
          somaPorMaterial
        )
      ) {
        const materialResult =
          await client.query(
            `
            SELECT *
            FROM materiais
            WHERE id = $1
            `,
            [
              Number(
                materialId
              ),
            ]
          );

        if (
          materialResult.rows
            .length === 0
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(404).json({
            erro:
              `Material ${materialId} não encontrado`,
          });
        }

        const material =
          materialResult.rows[0];

        if (
          Number(
            material.quantidade
          ) <
          Number(
            somaPorMaterial[
              materialId
            ]
          )
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            erro:
              `Quantidade maior que o estoque para o material ${material.nome}`,
          });
        }
      }

      for (
        const item of itens
      ) {
        const materialId =
          Number(
            item.material_id
          );

        const quantidade =
          Number(
            item.quantidade
          );

        for (
          let i = 0;
          i < quantidade;
          i++
        ) {
          await client.query(
            `
            INSERT INTO emprestimos
            (
              professor_id,
              material_id,
              data_emprestimo,
              data_limite,
              devolvido,
              email_enviado
            )

            VALUES
            (
              $1,
              $2,
              NOW(),
              NOW() +
                INTERVAL '1 day',
              FALSE,
              FALSE
            )
            `,
            [
              Number(
                professor_id
              ),

              materialId,
            ]
          );
        }

        await client.query(
          `
          UPDATE materiais

          SET quantidade =
            quantidade - $1

          WHERE id = $2
          `,
          [
            quantidade,
            materialId,
          ]
        );
      }

      await client.query(
        "COMMIT"
      );

      res.json({
        mensagem:
          "Empréstimo registrado com sucesso",
      });
    } catch (erro) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao registrar empréstimo em lote:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao registrar empréstimo em lote",

        detalhe:
          erro.message,
      });
    } finally {
      client.release();
    }
  }
);


app.get(
  "/emprestimos",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            e.id,
            e.professor_id,
            e.material_id,

            p.nome
              AS professor_nome,

            m.nome
              AS material_nome,

            m.tipo
              AS material_tipo,

            e.data_emprestimo,
            e.devolvido

          FROM emprestimos e

          LEFT JOIN professores p
            ON p.id =
              e.professor_id

          LEFT JOIN materiais m
            ON m.id =
              e.material_id

          ORDER BY
            e.id DESC
        `);

      res.json(
        resultado.rows
      );
    } catch (erro) {
      console.error(
        "Erro ao buscar empréstimos:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao buscar empréstimos",

        detalhe:
          erro.message,
      });
    }
  }
);


app.get(
  "/emprestimos/ativos",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            e.id,
            e.professor_id,
            e.material_id,

            p.nome
              AS professor_nome,

            m.nome
              AS material_nome,

            m.tipo
              AS material_tipo,

            e.data_emprestimo,
            e.devolvido

          FROM emprestimos e

          LEFT JOIN professores p
            ON p.id =
              e.professor_id

          LEFT JOIN materiais m
            ON m.id =
              e.material_id

          WHERE
            e.devolvido =
              FALSE

          ORDER BY
            e.id DESC
        `);

      res.json(
        resultado.rows
      );
    } catch (erro) {
      console.error(
        "Erro ao buscar empréstimos ativos:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao buscar empréstimos ativos",

        detalhe:
          erro.message,
      });
    }
  }
);


app.get(
  "/emprestimos/ativos/resumo",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            e.professor_id,

            p.nome
              AS professor_nome,

            e.material_id,

            m.nome
              AS material_nome,

            m.tipo
              AS material_tipo,

            COUNT(e.id)
              AS quantidade,

            MIN(
              e.data_emprestimo
            )
              AS primeiro_emprestimo,

            MAX(
              e.data_emprestimo
            )
              AS ultimo_emprestimo

          FROM emprestimos e

          INNER JOIN professores p
            ON p.id =
              e.professor_id

          INNER JOIN materiais m
            ON m.id =
              e.material_id

          WHERE
            e.devolvido =
              FALSE

          GROUP BY
            e.professor_id,
            p.nome,
            e.material_id,
            m.nome,
            m.tipo

          ORDER BY
            p.nome ASC,
            m.nome ASC
        `);

      res.json(
        resultado.rows
      );
    } catch (erro) {
      console.error(
        "Erro ao buscar resumo de empréstimos ativos:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao buscar resumo de empréstimos ativos",

        detalhe:
          erro.message,
      });
    }
  }
);


app.get(
  "/professores/:id/emprestimos-ativos",
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const professorExiste =
        await pool.query(
          `
          SELECT *
          FROM professores
          WHERE id = $1
          `,
          [
            Number(id),
          ]
        );

      if (
        professorExiste.rows
          .length === 0
      ) {
        return res.status(404).json({
          erro:
            "Professor não encontrado",
        });
      }

      const resultado =
        await pool.query(
          `
          SELECT
            e.professor_id,

            p.nome
              AS professor_nome,

            e.material_id,

            m.nome
              AS material_nome,

            m.tipo
              AS material_tipo,

            COUNT(e.id)
              AS quantidade,

            MIN(
              e.data_emprestimo
            )
              AS primeiro_emprestimo,

            MAX(
              e.data_emprestimo
            )
              AS ultimo_emprestimo

          FROM emprestimos e

          INNER JOIN professores p
            ON p.id =
              e.professor_id

          INNER JOIN materiais m
            ON m.id =
              e.material_id

          WHERE
            e.devolvido =
              FALSE

            AND
              e.professor_id =
                $1

          GROUP BY
            e.professor_id,
            p.nome,
            e.material_id,
            m.nome,
            m.tipo

          ORDER BY
            m.nome ASC
          `,
          [
            Number(id),
          ]
        );

      res.json(
        resultado.rows
      );
    } catch (erro) {
      console.error(
        "Erro ao buscar empréstimos ativos do professor:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao buscar empréstimos ativos do professor",

        detalhe:
          erro.message,
      });
    }
  }
);


app.put(
  "/emprestimos/devolver-lote",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const {
        ids,
      } = req.body;

      if (
        !Array.isArray(
          ids
        ) ||
        ids.length === 0
      ) {
        return res.status(400).json({
          erro:
            "Envie uma lista de ids para devolução",
        });
      }

      await client.query(
        "BEGIN"
      );

      const registros =
        await client.query(
          `
          SELECT
            id,
            material_id,
            devolvido

          FROM emprestimos

          WHERE id =
            ANY($1::int[])
          `,
          [ids]
        );

      if (
        registros.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          erro:
            "Nenhum empréstimo encontrado",
        });
      }

      const ativos =
        registros.rows.filter(
          (item) =>
            item.devolvido ===
              false
        );

      if (
        ativos.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          erro:
            "Todos os itens já foram devolvidos",
        });
      }

      const quantidadePorMaterial =
        {};

      for (
        const item of ativos
      ) {
        quantidadePorMaterial[
          item.material_id
        ] =
          (
            quantidadePorMaterial[
              item.material_id
            ] || 0
          ) + 1;
      }

      await client.query(
        `
        UPDATE emprestimos

        SET devolvido = TRUE

        WHERE
          id = ANY($1::int[])

          AND devolvido =
            FALSE
        `,
        [ids]
      );

      for (
        const materialId of
        Object.keys(
          quantidadePorMaterial
        )
      ) {
        await client.query(
          `
          UPDATE materiais

          SET quantidade =
            quantidade + $1

          WHERE id = $2
          `,
          [
            quantidadePorMaterial[
              materialId
            ],

            Number(
              materialId
            ),
          ]
        );
      }

      await client.query(
        "COMMIT"
      );

      res.json({
        mensagem:
          "Itens devolvidos com sucesso",

        quantidade_devolvida:
          ativos.length,
      });
    } catch (erro) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao devolver lote:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao devolver lote",

        detalhe:
          erro.message,
      });
    } finally {
      client.release();
    }
  }
);


app.put(
  "/emprestimos/devolver-parcial",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const {
        professor_id,
        material_id,
        quantidade,
      } = req.body;

      if (
        !professor_id ||
        !material_id ||
        !quantidade
      ) {
        return res.status(400).json({
          erro:
            "professor_id, material_id e quantidade são obrigatórios",
        });
      }

      if (
        Number(
          quantidade
        ) < 1
      ) {
        return res.status(400).json({
          erro:
            "A quantidade deve ser pelo menos 1",
        });
      }

      await client.query(
        "BEGIN"
      );

      const ativos =
        await client.query(
          `
          SELECT id

          FROM emprestimos

          WHERE
            professor_id = $1

            AND material_id =
              $2

            AND devolvido =
              FALSE

          ORDER BY id ASC

          LIMIT $3
          `,
          [
            Number(
              professor_id
            ),

            Number(
              material_id
            ),

            Number(
              quantidade
            ),
          ]
        );

      if (
        ativos.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          erro:
            "Nenhum item ativo encontrado para devolução",
        });
      }

      if (
        ativos.rows.length <
        Number(
          quantidade
        )
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          erro:
            "Quantidade para devolução maior do que a quantidade emprestada",
        });
      }

      const ids =
        ativos.rows.map(
          (item) =>
            item.id
        );

      await client.query(
        `
        UPDATE emprestimos

        SET devolvido = TRUE

        WHERE id =
          ANY($1::int[])
        `,
        [ids]
      );

      await client.query(
        `
        UPDATE materiais

        SET quantidade =
          quantidade + $1

        WHERE id = $2
        `,
        [
          Number(
            quantidade
          ),

          Number(
            material_id
          ),
        ]
      );

      await client.query(
        "COMMIT"
      );

      res.json({
        mensagem:
          "Devolução parcial realizada com sucesso",

        ids_devolvidos:
          ids,
      });
    } catch (erro) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao devolver parcialmente:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao devolver parcialmente",

        detalhe:
          erro.message,
      });
    } finally {
      client.release();
    }
  }
);


app.put(
  "/emprestimos/devolver-tudo/:professor_id",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const {
        professor_id,
      } = req.params;

      if (!professor_id) {
        return res.status(400).json({
          erro:
            "professor_id é obrigatório",
        });
      }

      await client.query(
        "BEGIN"
      );

      const professorExiste =
        await client.query(
          `
          SELECT *
          FROM professores
          WHERE id = $1
          `,
          [
            Number(
              professor_id
            ),
          ]
        );

      if (
        professorExiste.rows
          .length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          erro:
            "Professor não encontrado",
        });
      }

      const emprestimosAtivos =
        await client.query(
          `
          SELECT
            id,
            material_id

          FROM emprestimos

          WHERE
            professor_id = $1

            AND devolvido =
              FALSE
          `,
          [
            Number(
              professor_id
            ),
          ]
        );

      if (
        emprestimosAtivos.rows
          .length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          erro:
            "Esse professor não possui itens ativos para devolução",
        });
      }

      const quantidadePorMaterial =
        {};

      for (
        const item of
        emprestimosAtivos.rows
      ) {
        quantidadePorMaterial[
          item.material_id
        ] =
          (
            quantidadePorMaterial[
              item.material_id
            ] || 0
          ) + 1;
      }

      await client.query(
        `
        UPDATE emprestimos

        SET devolvido = TRUE

        WHERE
          professor_id = $1

          AND devolvido =
            FALSE
        `,
        [
          Number(
            professor_id
          ),
        ]
      );

      for (
        const materialId of
        Object.keys(
          quantidadePorMaterial
        )
      ) {
        await client.query(
          `
          UPDATE materiais

          SET quantidade =
            quantidade + $1

          WHERE id = $2
          `,
          [
            quantidadePorMaterial[
              materialId
            ],

            Number(
              materialId
            ),
          ]
        );
      }

      await client.query(
        "COMMIT"
      );

      res.json({
        mensagem:
          "Todos os itens foram devolvidos com sucesso",

        professor_id:
          Number(
            professor_id
          ),

        itens_devolvidos:
          emprestimosAtivos
            .rows.length,
      });
    } catch (erro) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Erro ao devolver tudo:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao devolver tudo",

        detalhe:
          erro.message,
      });
    } finally {
      client.release();
    }
  }
);


// ======================================================
// INICIAR SERVIDOR
// ======================================================

const PORT =
  process.env.PORT ||
  3001;

app.listen(
  PORT,
  () => {
    console.log(
      `Servidor rodando na porta ${PORT}`
    );
  }
);