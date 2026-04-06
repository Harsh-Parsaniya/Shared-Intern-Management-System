import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HASURA_ENDPOINT = process.env.NEXT_PUBLIC_HASURA_ENDPOINT || "http://localhost:8080/v1/graphql";
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET;

const schema = `
# Hasura GraphQL Schema - Intern Management System

## Database Tables & Fields:

### users
- id (UUID): Primary key - unique identifier
- name (String): Full name of user
- email (String): Unique email address for authentication
- password (String): Hashed password (never expose)
- role (String): Account type - MUST be one of: 'admin', 'department', 'intern' (exact case)
- department_id (UUID): Links to departments table (nullable - only for department/intern roles)
- created_at (Timestamp): Account creation time

### departments
- id (UUID): Primary key
- name (String): Department name (must be unique)
- manager_id (UUID): User ID of department manager (links to users)
- created_at (Timestamp): When department was created

### interns
- id (UUID): Primary key
- user_id (UUID): Links to users table (REQUIRED, must exist)
- college_name (String): Name of college/university
- department_id (UUID): Links to departments table (which department they're assigned to)
- start_date (Date): Internship start date (format: YYYY-MM-DD)
- end_date (Date): Internship end date (format: YYYY-MM-DD)
- created_at (Timestamp): When record created

### feedback
- id (UUID): Primary key
- intern_id (UUID): Links to interns table (REQUIRED)
- message (String): Feedback text content
- rating (Integer): Must be between 1-5 (inclusive)
- submitted_by_role (String): Who gave feedback - either 'intern' or 'department'
- created_at (Timestamp): When feedback was submitted

### tasks
- id (UUID): Primary key
- title (String): Task name/title
- description (String): Detailed task description
- deadline (Date): Task due date (format: YYYY-MM-DD)
- priority (String): Must be one of: 'low', 'medium', 'high' (exact case)
- status (String): Must be one of: 'pending', 'in_progress', 'completed', 'reviewed' (exact case)
- department_id (UUID): Links to departments table (which department owns this task)
- created_by_user_id (UUID): User ID who created task (links to users)
- created_at (Timestamp): When task was created

## Relationship Map:
- users.department_id → departments.id (Many users per department)
- interns.user_id → users.id (One user has one intern profile)
- interns.department_id → departments.id (Interns assigned to departments)
- feedback.intern_id → interns.id (Feedback about interns)
- tasks.department_id → departments.id (Tasks assigned to departments)
- tasks.created_by_user_id → users.id (Track who created task)
- departments.manager_id → users.id (Department manager)

## Enum Values (use exact strings):
- user roles: 'admin', 'department', 'intern'
- task priorities: 'low', 'medium', 'high'
- task statuses: 'pending', 'in_progress', 'completed', 'reviewed'
- feedback sources: 'intern', 'department'

## Critical Rules:
1. ALWAYS return valid JSON only: {"query": "...", "variables": {...}}
2. NO markdown, explanations, or text outside JSON
3. Use proper GraphQL field selection syntax
4. For date comparisons: use {_gte: "YYYY-MM-DD"} and {_lte: "YYYY-MM-DD"}
5. For string matches: prefer exact equality {_eq: "value"} over _ilike when possible
6. Use _ilike for partial/case-insensitive search: {_ilike: "%search%"}
7. Use order_by for sorting: {order_by:{field: asc}} or {desc}
8. For filters with multiple conditions: use {_and: [{cond1}, {cond2}]}
9. ALWAYS use named queries when variables are present
10. Validate enum values match exactly (e.g., 'pending' not 'Pending')
11. Return {"query": "", "variables": {}} if question is unanswerable

## Advanced Examples:

Question: "Show interns from Computer Science department"
Response: {
  "query": "query GetDeptInterns($deptName: String!) { departments(where: {name: {_eq: $deptName}}) { id interns { user { name email } college_name } } }",
  "variables": {"deptName": "Computer Science"}
}

Question: "How many high priority tasks are pending?"
Response: {
  "query": "{ tasks_aggregate(where: {priority: {_eq: \"high\"}, status: {_eq: \"pending\"}}) { aggregate { count } } }",
  "variables": {}
}

Question: "List interns with 5-star feedback"
Response: {
  "query": "{ interns { user { name email } feedback_aggregate(where: {rating: {_eq: 5}}) { aggregate { count } } } }",
  "variables": {}
}

Question: "Get tasks created after 2026-01-01"
Response: {
  "query": "query TasksAfterDate($date: date!) { tasks(where: {created_at: {_gte: $date}}, order_by: {created_at: desc}) { title deadline priority status } }",
  "variables": {"date": "2026-01-01"}
}

Question: "Find interns by name containing 'John'"
Response: {
  "query": "{ interns(where: {user: {name: {_ilike: \"%John%\"}}}) { user { name email } college_name department { name } } }",
  "variables": {}
}
`;

const systemPrompt = `You are an expert Hasura GraphQL query generator for an Intern Management System. Your job is to:
1. Analyze natural language questions carefully
2. Map entities and relationships correctly
3. Generate syntactically correct GraphQL queries
4. Use proper variable handling for dynamic inputs
5. Select only necessary fields to avoid over-fetching
6. Apply appropriate filters, sorting, and pagination

CRITICAL: Return ONLY valid JSON with exactly these keys: {"query": "...", "variables": {...}}
Never include markdown formatting, code blocks, or explanations.

${schema}`;


function extractJson(text: string) {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = codeBlockMatch ? codeBlockMatch[1] : text;
  try {
    return JSON.parse(jsonText.trim());
  } catch (error) {
    throw new Error("Unable to parse AI response as JSON. Response was: " + text);
  }
}

function summarizeGraphqlResult(question: string, graphqlJson: any) {
  if (graphqlJson?.errors) {
    const messages = graphqlJson.errors.map((error: any) => error.message).join("; ");
    return `I encountered an error processing your query: ${messages}. Please try rephrasing your question.`;
  }

  const data = graphqlJson?.data;
  if (!data) {
    return "No data was returned. Please try a different question.";
  }

  // Generic response builder for any data structure
  const buildResponse = (obj: any, depth = 0): string => {
    if (depth > 3) return ""; // Prevent deep recursion
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "No results found.";
      if (obj.length === 1 && typeof obj[0] === "object") {
        return buildResponse(obj[0], depth + 1);
      }
      
      // For arrays of objects
      const items = obj.slice(0, 5).map((item: any) => {
        if (typeof item === "string") return item;
        if (typeof item === "number") return item.toString();
        if (item.name) return item.name;
        if (item.title) return item.title;
        if (item.message) return item.message;
        return JSON.stringify(item).substring(0, 50);
      });
      
      return `Found ${obj.length} result(s): ${items.join(", ")}${obj.length > 5 ? "..." : ""}`;
    }
    
    if (typeof obj === "object" && obj !== null) {
      // Check for aggregate count
      if (obj.aggregate?.count != null) {
        return `Total count: ${obj.aggregate.count}`;
      }
      
      // Check for simple numeric values
      if (Object.keys(obj).length === 1) {
        const [key, value] = Object.entries(obj)[0];
        if (typeof value === "number") return `${key}: ${value}`;
        return buildResponse(value, depth + 1);
      }
      
      // Generic object summary
      const keys = Object.keys(obj);
      if (keys.length === 0) return "Empty result.";
      
      const summary = keys.slice(0, 3).map(key => {
        const val = obj[key];
        if (typeof val === "string") return `${key}: ${val}`;
        if (typeof val === "number") return `${key}: ${val}`;
        if (Array.isArray(val)) return `${key}: ${val.length} items`;
        return `${key}: (object)`;
      }).join(", ");
      
      return summary;
    }
    
    return obj?.toString() || "No data";
  };

  try {
    const response = buildResponse(data);
    return response || "Query executed successfully but returned no formatted data.";
  } catch (error) {
    return "Query executed successfully. Result structure was too complex to summarize.";
  }
}

export async function POST(request: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const question = typeof body.question === "string" ? body.question.trim() : "";

  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: question,
        },
      ],
      temperature: 0,
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    return NextResponse.json({ error: "AI API request failed.", details: errorText }, { status: 502 });
  }

  const aiJson = await aiResponse.json();
  const assistantText = aiJson?.choices?.[0]?.message?.content || "";

  let parsed;
  try {
    parsed = extractJson(assistantText);
  } catch (error: any) {
    return NextResponse.json({ error: error.message, aiText: assistantText }, { status: 502 });
  }

  if (!parsed.query || typeof parsed.query !== "string") {
    return NextResponse.json({ error: "AI did not return a valid GraphQL query.", aiText: assistantText }, { status: 502 });
  }

  const graphqlResponse = await fetch(HASURA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(HASURA_ADMIN_SECRET ? { "x-hasura-admin-secret": HASURA_ADMIN_SECRET } : {}),
    },
    body: JSON.stringify({ query: parsed.query, variables: parsed.variables || {} }),
  });

  const graphqlJson = await graphqlResponse.json();
  const responseText = summarizeGraphqlResult(question, graphqlJson);

  return NextResponse.json({
    question,
    graphqlQuery: parsed.query,
    variables: parsed.variables || {},
    aiRaw: assistantText,
    result: graphqlJson,
    responseText,
  });
}
