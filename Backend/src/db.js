const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não foi configurada no arquivo .env"
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("Conectado ao banco PostgreSQL online");
});

pool.on("error", (erro) => {
  console.error("Erro inesperado na conexão com o banco:", erro.message);
});

module.exports = pool;