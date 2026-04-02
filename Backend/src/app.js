const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

 
// ==ROTAS DE PROFESSORES==


// Lista todos os profesores cadastrados no sistema
app.get("/professores", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT id, nome, email, tipo, criado_em FROM usuarios WHERE tipo = $1 ORDER BY id DESC",
      ["Professor"]
    );

    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar professores" });
  }
});

// Cadastrar professor
app.post("/professores", async (req, res) => {
  try {
    const { nome, email } = req.body;

    await pool.query(
      "INSERT INTO usuarios (nome, email, senha, tipo) VALUES ($1, $2, $3, $4)",
      [nome, email, "123456", "Professor"]
    );

    res.json({ mensagem: "Professor cadastrado com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao cadastrar professor" });
  }
});

// Atualizar professor
app.put("/professores/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;

    await pool.query(
      "UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3 AND tipo = $4",
      [nome, email, id, "Professor"]
    );

    res.json({ mensagem: "Professor atualizado com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao atualizar professor" });
  }
});

// apaga professor
app.delete("/professores/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM usuarios WHERE id = $1 AND tipo = $2",
      [id, "Professor"]
    );

    res.json({ mensagem: "Professor excluído com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao excluir professor" });
  }
});

/*
   ==ROTAS DE MATERIAIS==
 */

// Listar materiais
app.get("/materiais", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM materiais ORDER BY id DESC"
    );

    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar materiais" });
  }
});

// Cadastrar material
app.post("/materiais", async (req, res) => {
  try {
    const { nome, tipo, quantidade } = req.body;

    await pool.query(
      "INSERT INTO materiais (nome, tipo, quantidade) VALUES ($1, $2, $3)",
      [nome, tipo, quantidade]
    );

    res.json({ mensagem: "Material cadastrado com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao cadastrar material" });
  }
});

// Atualizar material
app.put("/materiais/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo, quantidade } = req.body;

    await pool.query(
      "UPDATE materiais SET nome = $1, tipo = $2, quantidade = $3 WHERE id = $4",
      [nome, tipo, quantidade, id]
    );

    res.json({ mensagem: "Material atualizado com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao atualizar material" });
  }
});

// Excluir material
app.delete("/materiais/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM materiais WHERE id = $1", [id]);

    res.json({ mensagem: "Material excluído com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao excluir material" });
  }
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});