require("dotenv").config();

const bcrypt = require("bcryptjs");
const readline = require("readline");
const pool = require("./db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function perguntar(pergunta) {
  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => {
      resolve(resposta.trim());
    });
  });
}

async function criarUsuario() {
  try {
    console.log("");
    console.log("======================================");
    console.log("   CRIAÇÃO DE USUÁRIO DO SISTEMA");
    console.log("======================================");
    console.log("");

    const nome = await perguntar(
      "Nome do usuário: "
    );

    const usuario = await perguntar(
      "Login: "
    );

    const senha = await perguntar(
      "Senha: "
    );

    const confirmarSenha = await perguntar(
      "Confirme a senha: "
    );

    if (!nome) {
      console.log("");
      console.log("Erro: informe o nome.");
      return;
    }

    if (!usuario) {
      console.log("");
      console.log("Erro: informe o login.");
      return;
    }

    if (!senha) {
      console.log("");
      console.log("Erro: informe a senha.");
      return;
    }

    if (senha.length < 8) {
      console.log("");
      console.log(
        "Erro: a senha deve possuir pelo menos 8 caracteres."
      );
      return;
    }

    if (senha !== confirmarSenha) {
      console.log("");
      console.log(
        "Erro: as senhas informadas não são iguais."
      );
      return;
    }

    const usuarioExistente = await pool.query(
      `
      SELECT id
      FROM usuarios
      WHERE LOWER(usuario) = LOWER($1)
      `,
      [usuario]
    );

    if (usuarioExistente.rows.length > 0) {
      console.log("");
      console.log(
        "Erro: já existe um usuário com esse login."
      );
      return;
    }

    const senhaHash = await bcrypt.hash(
      senha,
      12
    );

    const resultado = await pool.query(
      `
      INSERT INTO usuarios
      (
        nome,
        usuario,
        senha_hash,
        ativo
      )
      VALUES
      (
        $1,
        $2,
        $3,
        TRUE
      )
      RETURNING
        id,
        nome,
        usuario,
        ativo,
        criado_em
      `,
      [
        nome,
        usuario,
        senhaHash,
      ]
    );

    const usuarioCriado =
      resultado.rows[0];

    console.log("");
    console.log("======================================");
    console.log("USUÁRIO CRIADO COM SUCESSO");
    console.log("======================================");

    console.log(
      `ID: ${usuarioCriado.id}`
    );

    console.log(
      `Nome: ${usuarioCriado.nome}`
    );

    console.log(
      `Login: ${usuarioCriado.usuario}`
    );

    console.log(
      `Ativo: ${usuarioCriado.ativo ? "Sim" : "Não"}`
    );

    console.log("");
  } catch (erro) {
    console.error("");
    console.error(
      "Erro ao criar usuário:"
    );

    console.error(
      erro.message
    );
  } finally {
    rl.close();

    await pool.end();
  }
}

criarUsuario();