// conexão com BD

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "tcc_emprestimos", 
  password: "123456",   
  port: 5432,
});

module.exports = pool;

