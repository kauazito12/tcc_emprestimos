const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const pool = require("./db");

const authRouter = express.Router();

const TEMPO_SESSAO_MINUTOS = 60;


// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function gerarToken() {
  return crypto
    .randomBytes(48)
    .toString("hex");
}

function gerarHashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function obterTokenRequisicao(req) {
  const authorization =
    req.headers.authorization;

  if (!authorization) {
    return null;
  }

  const partes =
    authorization.split(" ");

  if (
    partes.length !== 2 ||
    partes[0] !== "Bearer"
  ) {
    return null;
  }

  return partes[1];
}


// ======================================================
// AUTENTICAÇÃO
// ======================================================

async function exigirAutenticacao(
  req,
  res,
  next
) {
  try {
    const token =
      obterTokenRequisicao(req);

    if (!token) {
      return res.status(401).json({
        erro: "Usuário não autenticado",
        codigo: "NAO_AUTENTICADO",
      });
    }

    const tokenHash =
      gerarHashToken(token);

    const resultado =
      await pool.query(
        `
        SELECT
          s.id AS sessao_id,
          s.usuario_id,
          s.ultima_atividade,

          u.id,
          u.nome,
          u.usuario,
          u.ativo,
          u.administrador

        FROM sessoes s

        INNER JOIN usuarios u
          ON u.id = s.usuario_id

        WHERE s.token_hash = $1
        `,
        [tokenHash]
      );

    if (
      resultado.rows.length === 0
    ) {
      return res.status(401).json({
        erro:
          "Sessão inválida ou encerrada",
        codigo:
          "SESSAO_INVALIDA",
      });
    }

    const sessao =
      resultado.rows[0];

    if (!sessao.ativo) {
      await pool.query(
        `
        DELETE FROM sessoes
        WHERE id = $1
        `,
        [sessao.sessao_id]
      );

      return res.status(401).json({
        erro:
          "Usuário desativado",
        codigo:
          "USUARIO_INATIVO",
      });
    }

    const ultimaAtividade =
      new Date(
        sessao.ultima_atividade
      );

    const agora =
      new Date();

    const diferencaMs =
      agora.getTime() -
      ultimaAtividade.getTime();

    const limiteMs =
      TEMPO_SESSAO_MINUTOS *
      60 *
      1000;

    if (
      diferencaMs >= limiteMs
    ) {
      await pool.query(
        `
        DELETE FROM sessoes
        WHERE id = $1
        `,
        [sessao.sessao_id]
      );

      return res.status(401).json({
        erro:
          "Sua sessão expirou por inatividade",
        codigo:
          "SESSAO_EXPIRADA",
      });
    }

    req.auth = {
      sessao_id:
        sessao.sessao_id,

      usuario_id:
        sessao.usuario_id,

      nome:
        sessao.nome,

      usuario:
        sessao.usuario,

      administrador:
        sessao.administrador,
    };

    next();
  } catch (erro) {
    console.error(
      "Erro ao validar autenticação:",
      erro.message
    );

    res.status(500).json({
      erro:
        "Erro ao validar autenticação",
    });
  }
}


// ======================================================
// SOMENTE ADMINISTRADOR
// ======================================================

function exigirAdministrador(
  req,
  res,
  next
) {
  if (!req.auth?.administrador) {
    return res.status(403).json({
      erro:
        "Acesso permitido somente para administradores",
    });
  }

  next();
}


// ======================================================
// LOGIN
// ======================================================

authRouter.post(
  "/login",
  async (req, res) => {
    try {
      const {
        usuario,
        senha,
      } = req.body;

      const usuarioLimpo =
        String(
          usuario || ""
        ).trim();

      const senhaInformada =
        String(
          senha || ""
        );

      if (
        !usuarioLimpo ||
        !senhaInformada
      ) {
        return res
          .status(400)
          .json({
            erro:
              "Informe usuário e senha",
          });
      }

      const resultado =
        await pool.query(
          `
          SELECT
            id,
            nome,
            usuario,
            senha_hash,
            ativo,
            administrador

          FROM usuarios

          WHERE LOWER(usuario) =
            LOWER($1)
          `,
          [usuarioLimpo]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res
          .status(401)
          .json({
            erro:
              "Usuário ou senha incorretos",
          });
      }

      const usuarioBanco =
        resultado.rows[0];

      if (!usuarioBanco.ativo) {
        return res
          .status(403)
          .json({
            erro:
              "Este usuário está desativado",
          });
      }

      const senhaCorreta =
        await bcrypt.compare(
          senhaInformada,
          usuarioBanco.senha_hash
        );

      if (!senhaCorreta) {
        return res
          .status(401)
          .json({
            erro:
              "Usuário ou senha incorretos",
          });
      }

      await pool.query(
        `
        DELETE FROM sessoes

        WHERE usuario_id = $1

          AND ultima_atividade <
            NOW() -
            INTERVAL '60 minutes'
        `,
        [usuarioBanco.id]
      );

      const token =
        gerarToken();

      const tokenHash =
        gerarHashToken(token);

      await pool.query(
        `
        INSERT INTO sessoes
        (
          usuario_id,
          token_hash,
          criada_em,
          ultima_atividade
        )

        VALUES
        (
          $1,
          $2,
          NOW(),
          NOW()
        )
        `,
        [
          usuarioBanco.id,
          tokenHash,
        ]
      );

      res.json({
        mensagem:
          "Login realizado com sucesso",

        token,

        usuario: {
          id:
            usuarioBanco.id,

          nome:
            usuarioBanco.nome,

          usuario:
            usuarioBanco.usuario,

          administrador:
            usuarioBanco.administrador,
        },

        sessao: {
          expira_apos_minutos_sem_atividade:
            TEMPO_SESSAO_MINUTOS,
        },
      });
    } catch (erro) {
      console.error(
        "Erro ao realizar login:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao realizar login",
      });
    }
  }
);


// ======================================================
// USUÁRIO LOGADO
// ======================================================

authRouter.get(
  "/me",
  exigirAutenticacao,
  async (req, res) => {
    res.json({
      autenticado: true,

      usuario: {
        id:
          req.auth.usuario_id,

        nome:
          req.auth.nome,

        usuario:
          req.auth.usuario,

        administrador:
          req.auth.administrador,
      },
    });
  }
);


// ======================================================
// ATIVIDADE
// ======================================================

authRouter.put(
  "/atividade",
  exigirAutenticacao,
  async (req, res) => {
    try {
      await pool.query(
        `
        UPDATE sessoes

        SET ultima_atividade =
          NOW()

        WHERE id = $1
        `,
        [
          req.auth.sessao_id,
        ]
      );

      res.json({
        mensagem:
          "Atividade registrada",
      });
    } catch (erro) {
      console.error(
        "Erro ao registrar atividade:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao registrar atividade",
      });
    }
  }
);


// ======================================================
// LOGOUT
// ======================================================

authRouter.post(
  "/logout",
  exigirAutenticacao,
  async (req, res) => {
    try {
      await pool.query(
        `
        DELETE FROM sessoes
        WHERE id = $1
        `,
        [
          req.auth.sessao_id,
        ]
      );

      res.json({
        mensagem:
          "Logout realizado com sucesso",
      });
    } catch (erro) {
      console.error(
        "Erro ao realizar logout:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao realizar logout",
      });
    }
  }
);


// ======================================================
// LISTAR USUÁRIOS
// ======================================================

authRouter.get(
  "/usuarios",
  exigirAutenticacao,
  exigirAdministrador,
  async (req, res) => {
    try {
      const resultado =
        await pool.query(
          `
          SELECT
            id,
            nome,
            usuario,
            ativo,
            administrador,
            criado_em

          FROM usuarios

          ORDER BY nome ASC
          `
        );

      res.json(resultado.rows);
    } catch (erro) {
      console.error(
        "Erro ao buscar usuários:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao buscar usuários",
      });
    }
  }
);


// ======================================================
// CADASTRAR USUÁRIO
// ======================================================

authRouter.post(
  "/usuarios",
  exigirAutenticacao,
  exigirAdministrador,
  async (req, res) => {
    try {
      const {
        nome,
        usuario,
        senha,
        administrador,
      } = req.body;

      const nomeLimpo =
        String(nome || "").trim();

      const usuarioLimpo =
        String(usuario || "").trim();

      const senhaLimpa =
        String(senha || "");

      if (
        !nomeLimpo ||
        !usuarioLimpo ||
        !senhaLimpa
      ) {
        return res.status(400).json({
          erro:
            "Nome, usuário e senha são obrigatórios",
        });
      }

      if (senhaLimpa.length < 8) {
        return res.status(400).json({
          erro:
            "A senha deve possuir pelo menos 8 caracteres",
        });
      }

      const existente =
        await pool.query(
          `
          SELECT id
          FROM usuarios
          WHERE LOWER(usuario) =
            LOWER($1)
          `,
          [usuarioLimpo]
        );

      if (
        existente.rows.length > 0
      ) {
        return res.status(400).json({
          erro:
            "Já existe um usuário com esse login",
        });
      }

      const senhaHash =
        await bcrypt.hash(
          senhaLimpa,
          12
        );

      const resultado =
        await pool.query(
          `
          INSERT INTO usuarios
          (
            nome,
            usuario,
            senha_hash,
            ativo,
            administrador
          )

          VALUES
          (
            $1,
            $2,
            $3,
            TRUE,
            $4
          )

          RETURNING
            id,
            nome,
            usuario,
            ativo,
            administrador,
            criado_em
          `,
          [
            nomeLimpo,
            usuarioLimpo,
            senhaHash,
            Boolean(administrador),
          ]
        );

      res.status(201).json(
        resultado.rows[0]
      );
    } catch (erro) {
      console.error(
        "Erro ao cadastrar usuário:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao cadastrar usuário",
      });
    }
  }
);


// ======================================================
// EDITAR USUÁRIO
// ======================================================

authRouter.put(
  "/usuarios/:id",
  exigirAutenticacao,
  exigirAdministrador,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const {
        nome,
        usuario,
        administrador,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          erro:
            "ID do usuário inválido",
        });
      }

      const nomeLimpo =
        String(nome || "").trim();

      const usuarioLimpo =
        String(usuario || "").trim();

      if (
        !nomeLimpo ||
        !usuarioLimpo
      ) {
        return res.status(400).json({
          erro:
            "Nome e usuário são obrigatórios",
        });
      }

      const duplicado =
        await pool.query(
          `
          SELECT id
          FROM usuarios
          WHERE LOWER(usuario) =
            LOWER($1)
            AND id <> $2
          `,
          [
            usuarioLimpo,
            id,
          ]
        );

      if (
        duplicado.rows.length > 0
      ) {
        return res.status(400).json({
          erro:
            "Já existe outro usuário com esse login",
        });
      }

      if (
        id === req.auth.usuario_id &&
        administrador === false
      ) {
        return res.status(400).json({
          erro:
            "Você não pode remover sua própria permissão de administrador",
        });
      }

      const resultado =
        await pool.query(
          `
          UPDATE usuarios

          SET
            nome = $1,
            usuario = $2,
            administrador = $3

          WHERE id = $4

          RETURNING
            id,
            nome,
            usuario,
            ativo,
            administrador,
            criado_em
          `,
          [
            nomeLimpo,
            usuarioLimpo,
            Boolean(administrador),
            id,
          ]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res.status(404).json({
          erro:
            "Usuário não encontrado",
        });
      }

      res.json(resultado.rows[0]);
    } catch (erro) {
      console.error(
        "Erro ao atualizar usuário:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao atualizar usuário",
      });
    }
  }
);


// ======================================================
// REDEFINIR SENHA
// ======================================================

authRouter.put(
  "/usuarios/:id/senha",
  exigirAutenticacao,
  exigirAdministrador,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const {
        senha,
      } = req.body;

      const senhaNova =
        String(senha || "");

      if (!id) {
        return res.status(400).json({
          erro:
            "ID do usuário inválido",
        });
      }

      if (senhaNova.length < 8) {
        return res.status(400).json({
          erro:
            "A nova senha deve possuir pelo menos 8 caracteres",
        });
      }

      const senhaHash =
        await bcrypt.hash(
          senhaNova,
          12
        );

      const resultado =
        await pool.query(
          `
          UPDATE usuarios

          SET senha_hash = $1

          WHERE id = $2

          RETURNING id
          `,
          [
            senhaHash,
            id,
          ]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res.status(404).json({
          erro:
            "Usuário não encontrado",
        });
      }

      /*
        Encerra outras sessões após
        redefinição da senha.
      */
      await pool.query(
        `
        DELETE FROM sessoes

        WHERE usuario_id = $1

          AND id <> $2
        `,
        [
          id,
          req.auth.sessao_id,
        ]
      );

      res.json({
        mensagem:
          "Senha atualizada com sucesso",
      });
    } catch (erro) {
      console.error(
        "Erro ao redefinir senha:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao redefinir senha",
      });
    }
  }
);


// ======================================================
// ATIVAR / DESATIVAR
// ======================================================

authRouter.put(
  "/usuarios/:id/ativo",
  exigirAutenticacao,
  exigirAdministrador,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const {
        ativo,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          erro:
            "ID do usuário inválido",
        });
      }

      if (
        id === req.auth.usuario_id &&
        ativo === false
      ) {
        return res.status(400).json({
          erro:
            "Você não pode desativar sua própria conta",
        });
      }

      const resultado =
        await pool.query(
          `
          UPDATE usuarios

          SET ativo = $1

          WHERE id = $2

          RETURNING
            id,
            nome,
            usuario,
            ativo,
            administrador
          `,
          [
            Boolean(ativo),
            id,
          ]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res.status(404).json({
          erro:
            "Usuário não encontrado",
        });
      }

      if (!ativo) {
        await pool.query(
          `
          DELETE FROM sessoes
          WHERE usuario_id = $1
          `,
          [id]
        );
      }

      res.json(resultado.rows[0]);
    } catch (erro) {
      console.error(
        "Erro ao alterar acesso do usuário:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao alterar acesso do usuário",
      });
    }
  }
);


// ======================================================
// EXCLUIR USUÁRIO
// ======================================================

authRouter.delete(
  "/usuarios/:id",
  exigirAutenticacao,
  exigirAdministrador,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      if (!id) {
        return res.status(400).json({
          erro:
            "ID do usuário inválido",
        });
      }

      if (
        id === req.auth.usuario_id
      ) {
        return res.status(400).json({
          erro:
            "Você não pode excluir sua própria conta",
        });
      }

      const resultado =
        await pool.query(
          `
          DELETE FROM usuarios
          WHERE id = $1
          RETURNING
            id,
            nome,
            usuario
          `,
          [id]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res.status(404).json({
          erro:
            "Usuário não encontrado",
        });
      }

      res.json({
        mensagem:
          "Usuário excluído com sucesso",
      });
    } catch (erro) {
      console.error(
        "Erro ao excluir usuário:",
        erro.message
      );

      res.status(500).json({
        erro:
          "Erro ao excluir usuário",
      });
    }
  }
);


module.exports = {
  authRouter,
  exigirAutenticacao,
  exigirAdministrador,
};