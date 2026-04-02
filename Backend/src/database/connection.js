//configura conexão com bd
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tcc_emprestimos',
  password: 'POSTGRES',
  port: 5432,
});

module.exports = pool;