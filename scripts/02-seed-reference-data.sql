-- ============================================================
-- SEED REFERENCE DATA
-- ============================================================

-- Insert Countries
INSERT INTO country (country_id, country_name) VALUES 
(1, 'India'),
(2, 'France'),
(3, 'USA')
ON CONFLICT (country_id) DO NOTHING;

-- Insert Currencies
INSERT INTO currency (currency_code, currency_name) VALUES 
('INR', 'Indian Rupee'),
('EUR', 'Euro'),
('USD', 'US Dollar')
ON CONFLICT (currency_code) DO NOTHING;

-- Insert Payroll Types
INSERT INTO payroll_type (payroll_type_id, type_name) VALUES 
(1, 'Monthly'),
(2, 'Bi-weekly'),
(3, 'Weekly'),
(4, 'Quarterly')
ON CONFLICT (payroll_type_id) DO NOTHING;

-- Insert Sample Pay Periods
INSERT INTO pay_period (pay_period_id, period_start, period_end) VALUES 
(1, '2024-01-01', '2024-01-31'),
(2, '2024-02-01', '2024-02-29'),
(3, '2024-03-01', '2024-03-31')
ON CONFLICT (pay_period_id) DO NOTHING;
