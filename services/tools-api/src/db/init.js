const { pool } = require('./index')

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mutual_fund_sessions (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT,
      client_id TEXT NOT NULL,
      tax_year TEXT NOT NULL,
      resident_state TEXT,
      fund_name TEXT,
      amount NUMERIC(14, 2) DEFAULT 0,
      percentage NUMERIC(8, 4) DEFAULT 0,
      state_exempt NUMERIC(14, 2) DEFAULT 0,
      state_taxable NUMERIC(14, 2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  console.log('Mutual Fund table ready')
}

module.exports = {
  initializeDatabase,
}