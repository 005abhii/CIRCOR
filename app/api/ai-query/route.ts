// app/api/ai-query/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pool } from "@neondatabase/serverless";

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not found! Please provide a valid key.");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Database schema context for AI
const DB_SCHEMA_CONTEXT = `
You are an expert SQL query generator for an employee management system. Here's the database schema:

TABLES:
1. employee_universal - Main employee and payroll data view with columns:
   - employee_id (BIGINT) - Unique employee identifier
   - full_name (VARCHAR) - Employee full name
   - date_of_birth (DATE) - Birth date
   - start_date (DATE) - Employment start date
   - country_name (VARCHAR) - Country (India, France, USA)
   - currency_code (CHAR) - Currency code (INR, EUR, USD)
   - created_at (TIMESTAMP) - Record creation time
   
   Country-specific fields:
   - aadhar_number (India), numero_securite_sociale (France), ssn (USA)
   - pan (India), department_code (France), routing_number (USA)
   - Various bank account fields
   
   Payroll fields:
   - payroll_id, basic_salary, bonus, overtime_hours, net_pay
   - Country-specific: hra, lta, provident_fund (India), thirteenth_month_bonus, mutuelle_sante (France), health_insurance, _401k (USA)

2. country - Reference table for countries
3. currency - Reference table for currencies  
4. users - Authentication table
5. pay_period - Payroll periods
6. payroll_type - Types of payroll

IMPORTANT RULES:
1. Always use PostgreSQL syntax
2. Use employee_universal table for most queries as it's a comprehensive view
3. Use proper column names exactly as shown
4. For date comparisons, use proper DATE functions
5. Always include LIMIT clause for large result sets (default LIMIT 100)
6. Use ILIKE for case-insensitive string matching
7. Return only valid SELECT statements
8. No INSERT, UPDATE, DELETE, DROP operations allowed

Example queries:
- "Show employees named John" → SELECT * FROM employee_universal WHERE full_name ILIKE '%john%' LIMIT 100;
- "Average salary by country" → SELECT country_name, AVG(basic_salary) as avg_salary FROM employee_universal GROUP BY country_name;
- "Employees hired this year" → SELECT * FROM employee_universal WHERE EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE) LIMIT 100;
`;

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Generate SQL using Gemini AI with fallback models
    const modelNames = [
      "gemini-2.5-flash", // Primary choice - stable and fast
      "gemini-flash-latest", // Fallback 1 - latest version
      "gemini-2.5-pro", // Fallback 2 - more powerful but slower
    ];

    const prompt = `${DB_SCHEMA_CONTEXT}

Convert this natural language query to SQL:
"${query}"

Return ONLY the SQL query, no explanations or markdown formatting. The query should be a valid PostgreSQL SELECT statement.`;

    let result;
    let lastError;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        break; // Success, exit loop
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.log(`Model ${modelName} failed:`, errorMessage);
        lastError = error;
        continue; // Try next model
      }
    }

    if (!result) {
      throw lastError || new Error("All models failed");
    }
    const response = await result.response;
    let sqlQuery = await response.text();

    // Clean up the SQL query
    sqlQuery = sqlQuery
      .trim()
      .replace(/```sql/g, "")
      .replace(/```/g, "")
      .replace(/;+$/, ";"); // Ensure single semicolon at end

    console.log("Generated SQL:", sqlQuery);

    // Validate that it's a SELECT query
    if (!sqlQuery.toLowerCase().trim().startsWith("select")) {
      throw new Error("Only SELECT queries are allowed");
    }

    // Execute the SQL query using Pool
    const client = await pool.connect();
    let queryResult;

    try {
      const result = await client.query(sqlQuery);
      queryResult = result.rows;
    } finally {
      client.release();
    }

    return NextResponse.json({
      query: sqlQuery,
      data: queryResult,
      rowCount: queryResult.length,
      success: true,
    });
  } catch (error) {
    console.error("AI Query error:", error);

    let errorMessage = "An error occurred while processing your query";
    let statusCode = 500;

    if (error instanceof Error) {
      if (
        error.message.includes("API_KEY") ||
        error.message.includes("API key")
      ) {
        errorMessage = "AI service configuration error";
      } else if (
        error.message.includes("syntax error") ||
        error.message.includes("relation")
      ) {
        errorMessage =
          "Invalid SQL query generated. Please rephrase your question.";
        statusCode = 400;
      } else if (error.message.includes("SELECT queries")) {
        errorMessage = "Only SELECT queries are allowed for security reasons";
        statusCode = 403;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: statusCode }
    );
  }
}
