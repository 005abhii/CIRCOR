// app/dashboard/ai-query/client.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Database,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import Link from "next/link";

interface QueryResult {
  query: string;
  data: any[];
  rowCount: number;
  success: boolean;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: string;
  success: boolean;
  rowCount?: number;
}

export default function AIQueryPageClient({ session }: { session: any }) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);

  const quickQueries = [
    // Employee Overview Queries
    "List all employees from India",
    "Find employees from USA hired in 2025",
    "Show employees from France with their department codes",
    "List Indian employees with their PAN and Aadhar numbers",
    "Show USA employees with their SSN and routing numbers",
    "Find French employees with their social security numbers",
  ];

  const handleSubmit = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process query");
      }

      setResult(data);

      // Add successful query to history
      const historyItem: QueryHistory = {
        id: Date.now().toString(),
        query,
        timestamp: new Date().toLocaleString(),
        success: true,
        rowCount: data.rowCount,
      };
      setQueryHistory((prev) => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);

      // Add failed query to history
      const historyItem: QueryHistory = {
        id: Date.now().toString(),
        query,
        timestamp: new Date().toLocaleString(),
        success: false,
      };
      setQueryHistory((prev) => [historyItem, ...prev.slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery);
    setError(null);
    setResult(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") {
      // Format numbers with proper decimal places
      return value.toLocaleString();
    }
    if (
      typeof value === "string" &&
      value.includes("T") &&
      value.includes(":")
    ) {
      // Format datetime strings
      return new Date(value).toLocaleString();
    }
    return value.toString();
  };

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Database className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="text-lg font-medium mb-2">No data found</p>
          <p className="text-sm">
            Try adjusting your query or check the spelling.
          </p>
        </div>
      );
    }

    const columns = Object.keys(data[0]);
    const displayLimit = 100; // Show max 100 rows in UI

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Database className="w-3 h-3" />
              {data.length} rows returned
            </Badge>
            {data.length > displayLimit && (
              <Badge variant="outline" className="text-orange-600">
                Showing first {displayLimit} rows
              </Badge>
            )}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column}
                      className="font-semibold whitespace-nowrap"
                    >
                      {column
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, displayLimit).map((row, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    {columns.map((column) => (
                      <TableCell key={column} className="whitespace-nowrap">
                        {formatValue(row[column])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-accent-foreground rounded-sm"></div>
                </div>
                <span className="text-lg font-semibold">Employee Portal</span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard" className="text-sm font-medium">
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href="/dashboard/employee-management"
                    className="text-sm font-medium"
                  >
                    Employee Management
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href="/dashboard/payroll-management"
                    className="text-sm font-medium"
                  >
                    Payroll Management
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href="/dashboard/ai-query"
                    className="text-sm font-medium "
                  >
                    AI Query
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.email}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/api/auth/sign-out">Sign out</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">AI Query Assistant</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Ask questions about your employee data and payroll in natural
              language. AI will convert your queries to SQL and show results
              instantly.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Ask AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything about your employees or payroll. For example:
• 'Show all employees from India'
• 'Find employees with salary above 60000'
• 'List employees hired this year'
• 'Average salary by country'
• 'Show recent payroll entries'"
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Press Ctrl+Enter or Cmd+Enter to submit quickly
                    </p>
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || !query.trim()}
                      className="gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Ask AI
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Query Results
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg border">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Generated SQL Query:
                      </p>
                      <code className="text-sm font-mono bg-background p-2 rounded block overflow-x-auto">
                        {result.query}
                      </code>
                    </div>
                    {renderTable(result.data)}
                  </CardContent>
                </Card>
              )}

              {!result && !error && !isLoading && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Sparkles className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p className="text-lg font-medium mb-2">Ready to help!</p>
                      <p className="text-sm">
                        Ask any question about your employee data above.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Queries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickQueries.map((quickQuery, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-3 px-4"
                      onClick={() => handleQuickQuery(quickQuery)}
                      disabled={isLoading}
                    >
                      <span className="text-wrap">{quickQuery}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Queries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {queryHistory.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No recent queries yet. Start asking questions to see your
                      history here.
                    </div>
                  ) : (
                    queryHistory.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setQuery(item.query)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {item.success ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {item.timestamp}
                            </span>
                          </div>
                          {item.success && item.rowCount !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {item.rowCount} rows
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-wrap">{item.query}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
