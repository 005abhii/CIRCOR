-- ============================================================
-- GLOBAL 3NF EMPLOYEE–PAYROLL SCHEMA (PostgreSQL)
-- ============================================================

-- ---------- Reference Tables ----------
CREATE TABLE IF NOT EXISTS country (
    country_id INTEGER PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS currency (
    currency_code CHAR(3) PRIMARY KEY,
    currency_name VARCHAR(100) NOT NULL
);

-- ---------- Users (for authentication) ----------
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Store hashed passwords
    role VARCHAR(50) NOT NULL CHECK (role IN ('employee', 'admin', 'india_admin', 'france_admin', 'us_admin', 'super_admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Core Employee ----------
CREATE TABLE IF NOT EXISTS employee (
    employee_id BIGINT PRIMARY KEY,
    country_id INTEGER NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    start_date DATE,
    currency_code CHAR(3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (country_id) REFERENCES country (country_id),
    FOREIGN KEY (currency_code) REFERENCES currency (currency_code),
    FOREIGN KEY (created_by) REFERENCES users (user_id)
);

-- ---------- Country-Specific Employee Details ----------
CREATE TABLE IF NOT EXISTS employee_india (
    employee_id BIGINT PRIMARY KEY,
    aadhar_number CHAR(12) UNIQUE,
    pan CHAR(10),
    bank_account VARCHAR(50),
    ifsc VARCHAR(11),
    FOREIGN KEY (employee_id) REFERENCES employee (employee_id)
);

CREATE TABLE IF NOT EXISTS employee_france (
    employee_id BIGINT PRIMARY KEY,
    numero_securite_sociale VARCHAR(15) UNIQUE,
    bank_iban VARCHAR(34),
    department_code CHAR(2),
    FOREIGN KEY (employee_id) REFERENCES employee (employee_id)
);

CREATE TABLE IF NOT EXISTS employee_usa (
    employee_id BIGINT PRIMARY KEY,
    ssn VARCHAR(11) UNIQUE, -- Format: XXX-XX-XXXX
    bank_account VARCHAR(50),
    routing_number VARCHAR(9),
    FOREIGN KEY (employee_id) REFERENCES employee (employee_id)
);

-- ---------- Payroll Period + Type ----------
CREATE TABLE IF NOT EXISTS pay_period (
    pay_period_id INTEGER PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    CHECK (period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS payroll_type (
    payroll_type_id INTEGER PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL
);

-- ---------- Core Payroll ----------
CREATE TABLE IF NOT EXISTS payroll (
    payroll_id BIGINT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    pay_period_id INTEGER NOT NULL,
    payroll_type_id INTEGER NOT NULL,
    basic_salary DECIMAL(15, 2),
    bonus DECIMAL(15, 2),
    overtime_hours DECIMAL(5, 2),
    overtime_rate DECIMAL(10, 2),
    net_pay DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee (employee_id),
    FOREIGN KEY (pay_period_id) REFERENCES pay_period (pay_period_id),
    FOREIGN KEY (payroll_type_id) REFERENCES payroll_type (payroll_type_id)
);

-- ---------- Country-Specific Payroll ----------
CREATE TABLE IF NOT EXISTS payroll_india (
    payroll_id BIGINT PRIMARY KEY,
    hra DECIMAL(15, 2),
    lta DECIMAL(15, 2),
    provident_fund DECIMAL(15, 2),
    esic DECIMAL(15, 2),
    professional_tax DECIMAL(15, 2),
    gratuity DECIMAL(15, 2),
    FOREIGN KEY (payroll_id) REFERENCES payroll (payroll_id)
);

CREATE TABLE IF NOT EXISTS payroll_france (
    payroll_id BIGINT PRIMARY KEY,
    thirteenth_month_bonus DECIMAL(15, 2),
    mutuelle_sante DECIMAL(15, 2),
    transport_allowance DECIMAL(15, 2),
    prevoyance DECIMAL(15, 2),
    social_security DECIMAL(15, 2),
    retirement_contribution DECIMAL(15, 2),
    unemployment_insurance DECIMAL(15, 2),
    FOREIGN KEY (payroll_id) REFERENCES payroll (payroll_id)
);

CREATE TABLE IF NOT EXISTS payroll_usa (
    payroll_id BIGINT PRIMARY KEY,
    stock_options_value DECIMAL(15, 2),
    health_insurance DECIMAL(15, 2),
    dental_contribution DECIMAL(15, 2),
    vision_contribution DECIMAL(15, 2),
    union_dues DECIMAL(15, 2),
    city_tax DECIMAL(15, 2),
    social_security DECIMAL(15, 2),
    medicare DECIMAL(15, 2),
    _401k DECIMAL(15, 2),
    federal_tax DECIMAL(15, 2),
    state_tax DECIMAL(15, 2),
    FOREIGN KEY (payroll_id) REFERENCES payroll (payroll_id)
);

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_employee_country_id ON employee (country_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll (employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_pay_period_id ON payroll (pay_period_id);
