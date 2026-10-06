-- =========================================================
-- Tapreco - Initial database structure
-- Migration: 001_initial_schemas.sql
-- =========================================================


-- ---------------------------------------------------------
-- 1. Create schemas
-- ---------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS common;

CREATE SCHEMA IF NOT EXISTS mutual_fund;

CREATE SCHEMA IF NOT EXISTS entity_comparison;

CREATE SCHEMA IF NOT EXISTS estimated_tax;

CREATE SCHEMA IF NOT EXISTS audit_risk;


-- ---------------------------------------------------------
-- 2. Mutual Fund - Fund Companies
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS mutual_fund.fund_companies (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------
-- 3. Mutual Fund - Source Documents
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS mutual_fund.source_documents (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT
        REFERENCES mutual_fund.fund_companies(id)
        ON DELETE SET NULL,

    tax_year INTEGER NOT NULL,

    document_name VARCHAR(500) NOT NULL,

    document_type VARCHAR(100),

    source_url TEXT,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------
-- 4. Mutual Fund - Funds
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS mutual_fund.funds (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL
        REFERENCES mutual_fund.fund_companies(id)
        ON DELETE CASCADE,

    fund_name VARCHAR(500) NOT NULL,

    symbol VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_mutual_fund_company_fund
        UNIQUE (company_id, fund_name)
);


-- ---------------------------------------------------------
-- 5. Mutual Fund - Municipal percentages
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS mutual_fund.municipal_percentages (
    id BIGSERIAL PRIMARY KEY,

    fund_id BIGINT NOT NULL
        REFERENCES mutual_fund.funds(id)
        ON DELETE CASCADE,

    state VARCHAR(100) NOT NULL,

    percentage NUMERIC(8,4) NOT NULL,

    tax_year INTEGER NOT NULL,

    source_document_id BIGINT
        REFERENCES mutual_fund.source_documents(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_municipal_percentage
        CHECK (percentage >= 0 AND percentage <= 100),

    CONSTRAINT uq_municipal_fund_state_year
        UNIQUE (fund_id, state, tax_year)
);


-- ---------------------------------------------------------
-- 6. Mutual Fund - U.S. Government Obligations
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS mutual_fund.us_government_obligations (
    id BIGSERIAL PRIMARY KEY,

    fund_id BIGINT NOT NULL
        REFERENCES mutual_fund.funds(id)
        ON DELETE CASCADE,

    percentage NUMERIC(8,4) NOT NULL,

    tax_year INTEGER NOT NULL,

    qualifies BOOLEAN,

    qualification_note TEXT,

    source_document_id BIGINT
        REFERENCES mutual_fund.source_documents(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_us_government_percentage
        CHECK (percentage >= 0 AND percentage <= 100),

    CONSTRAINT uq_us_government_fund_year
        UNIQUE (fund_id, tax_year)
);


-- ---------------------------------------------------------
-- 7. Indexes for faster searching
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_funds_fund_name
ON mutual_fund.funds (fund_name);


CREATE INDEX IF NOT EXISTS idx_funds_symbol
ON mutual_fund.funds (symbol);


CREATE INDEX IF NOT EXISTS idx_funds_company_id
ON mutual_fund.funds (company_id);


CREATE INDEX IF NOT EXISTS idx_municipal_state
ON mutual_fund.municipal_percentages (state);


CREATE INDEX IF NOT EXISTS idx_municipal_tax_year
ON mutual_fund.municipal_percentages (tax_year);


CREATE INDEX IF NOT EXISTS idx_municipal_fund_id
ON mutual_fund.municipal_percentages (fund_id);


CREATE INDEX IF NOT EXISTS idx_us_government_tax_year
ON mutual_fund.us_government_obligations (tax_year);


CREATE INDEX IF NOT EXISTS idx_us_government_fund_id
ON mutual_fund.us_government_obligations (fund_id);


CREATE INDEX IF NOT EXISTS idx_source_documents_tax_year
ON mutual_fund.source_documents (tax_year);