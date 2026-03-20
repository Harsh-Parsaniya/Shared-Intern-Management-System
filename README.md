# Intern Management System (Next.js + Hasura)

This is a full-stack Intern Management System built with Next.js (App Router), Tailwind CSS, and Hasura GraphQL Engine.

## Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS, Apollo Client, Lucide React.
- **Backend**: Hasura GraphQL Engine, PostgreSQL.
- **Auth**: JWT-based with Hasura custom claims.

## Prerequisites
- Node.js 18+
- Docker (for Hasura & PostgreSQL) or a hosted Hasura project.

## Project Setup Guide

### 1. Database Setup
1.  Connect to your PostgreSQL instance.
2.  Run the SQL commands provided in `schema.sql` to create the necessary tables and relationships.

### 2. Hasura Setup
1.  Connect your PostgreSQL database to Hasura.
2.  **Track All Tables**: Go to the Hasura Console -> Data -> Track All.
3.  **Define Relationships**: Track all suggested foreign key relationships.
4.  **Configure Permissions**:
    - **role: admin**: Full access to all tables.
    - **role: department**:
      - `interns`: `select`, `insert`, `update`, `delete` where `department_id` eq `X-Hasura-Department-Id`.
      - `feedback`: `select` where `intern.department_id` eq `X-Hasura-Department-Id`.
    - **role: intern**:
      - `interns`: `select` (all columns).
      - `feedback`: `insert` (own feedback).

### 3. Frontend Configuration
1.  Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_HASURA_ENDPOINT=http://localhost:8080/v1/graphql
    JWT_SECRET=your-very-secure-secret-key-change-me
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

## Folder Structure
- `src/app`: Next.js pages and layouts.
- `src/components`: Reusable UI components and layouts.
- `src/lib`: Apollo Client and Auth utility functions.
- `src/hooks`: Custom hooks for data fetching.
- `src/types`: TypeScript interfaces.

## Role-Based Access
- **Admin**: Full control over interns and departments.
- **Department**: Manage interns within their own department.
- **Intern**: View directory and submit feedback.

## Authentication
This system uses a custom JWT implementation. In a production environment, you should integrate with an auth provider (like NextAuth, Clerk, or Auth0) that can inject the required Hasura claims:
```json
{
  "https://hasura.io/jwt/claims": {
    "x-hasura-allowed-roles": ["admin", "department", "intern"],
    "x-hasura-default-role": "intern",
    "x-hasura-user-id": "UUID",
    "x-hasura-department-id": "UUID"
  }
}
```
