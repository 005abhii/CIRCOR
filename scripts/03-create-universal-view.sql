-- ============================================================
-- UNIVERSAL VIEW (Employee + Payroll + Country-specific details)
-- ============================================================
CREATE OR REPLACE VIEW employee_universal AS
SELECT 
    e.employee_id,
    e.full_name,
    e.date_of_birth,
    e.start_date,
    c.country_name,
    e.currency_code,
    e.created_at,
    u.email          AS created_by_user,

    -- India Specific
    ei.aadhar_number,
    ei.pan,
    ei.bank_account  AS india_bank_account,
    ei.ifsc,

    -- France Specific
    ef.numero_securite_sociale,
    ef.bank_iban,
    ef.department_code,

    -- USA Specific
    eu.ssn,
    eu.bank_account  AS usa_bank_account,
    eu.routing_number,

    -- Core Payroll
    p.payroll_id,
    pp.period_start,
    pp.period_end,
    pt.type_name     AS payroll_type,
    p.basic_salary,
    p.bonus,
    p.overtime_hours,
    p.overtime_rate,
    p.net_pay,
    p.created_at     AS payroll_created_at,

    -- India Payroll
    pi.hra,
    pi.lta,
    pi.provident_fund,
    pi.esic,
    pi.professional_tax,
    pi.gratuity,

    -- France Payroll
    pf.thirteenth_month_bonus,
    pf.mutuelle_sante,
    pf.transport_allowance,
    pf.prevoyance,
    pf.social_security    AS fr_social_security,
    pf.retirement_contribution,
    pf.unemployment_insurance,

    -- USA Payroll
    pu.stock_options_value,
    pu.health_insurance,
    pu.dental_contribution,
    pu.vision_contribution,
    pu.union_dues,
    pu.city_tax,
    pu.social_security    AS us_social_security,
    pu.medicare,
    pu._401k,
    pu.federal_tax,
    pu.state_tax

FROM employee e
JOIN country c 
    ON e.country_id = c.country_id
LEFT JOIN users u 
    ON e.created_by = u.user_id

-- Employee details
LEFT JOIN employee_india ei 
    ON e.employee_id = ei.employee_id
LEFT JOIN employee_france ef 
    ON e.employee_id = ef.employee_id
LEFT JOIN employee_usa eu 
    ON e.employee_id = eu.employee_id

-- Payroll details
LEFT JOIN payroll p 
    ON e.employee_id = p.employee_id
LEFT JOIN pay_period pp 
    ON p.pay_period_id = pp.pay_period_id
LEFT JOIN payroll_type pt 
    ON p.payroll_type_id = pt.payroll_type_id

-- Country-specific payroll
LEFT JOIN payroll_india pi 
    ON p.payroll_id = pi.payroll_id
LEFT JOIN payroll_france pf 
    ON p.payroll_id = pf.payroll_id
LEFT JOIN payroll_usa pu 
    ON p.payroll_id = pu.payroll_id

-- Order India → France → USA → Others
ORDER BY 
    CASE 
        WHEN c.country_name ILIKE 'India'  THEN 1
        WHEN c.country_name ILIKE 'France' THEN 2
        WHEN c.country_name ILIKE 'USA'    THEN 3
        ELSE 4
    END,
    e.employee_id;
