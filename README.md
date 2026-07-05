# The Engineering Editorial

The Engineering Editorial (also internally referred to as *Sahayak*) is a comprehensive engineering analytics and intelligence platform. It is designed to ingest data from various engineering tools (like GitHub and Jira), process and calculate meaningful engineering metrics, and present them through an intuitive dashboard. 

The platform aims to provide insights into project health, contributor metrics, PR size growth, and overall engineering quality.

## 🏗️ Architecture & Monorepo Structure

This project is structured as a **monorepo** managed by **pnpm workspaces** and optimized with **Turborepo**. The codebase is primarily written in **TypeScript** and is divided into several applications, background workers, and shared packages.

### 💻 Apps (`/apps`)
- **`frontend`**: The main user interface built with React and Vite. It includes dashboards for projects, connector management, analytics, and project quality details.
- **`integration-github`**: Dedicated service for integrating and ingesting data from GitHub.
- **`integration-jira`**: Dedicated service for integrating and ingesting data from Jira.
- **`workers`**: Background workers responsible for asynchronous task processing, data synchronization, and metric calculations.

### 📦 Shared Packages (`/packages`)
- **`core-types`**: Core shared TypeScript types, interfaces, DTOs, and entity definitions used across the entire monorepo.
- **`db-client`**: Database client utilizing Drizzle ORM for schema definitions and migrations.
- **`connectors`**: Shared logic for connecting to third-party APIs (GitHub, Jira, etc.).
- **`harness`**: The core metric calculation engine. It processes "grains" of data and registers metrics (e.g., PR size growth) to generate reports.
- **`config`**: Centralized configuration management.
- **`logger`**: Standardized logging utility for the services.

### ☁️ Infrastructure (`/infra`)
- Contains **AWS CDK** (Cloud Development Kit) code used to provision and deploy the cloud infrastructure required to run the platform.

### 📚 Documentation (`/docs`)
- Contains architectural decisions, schema models (Mermaid diagrams), metric harness designs, and UI mockups.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [pnpm](https://pnpm.io/) (v8 or newer)
- AWS CLI configured (for CDK deployment)

### Installation

1. Install dependencies from the root of the repository:
   ```bash
   pnpm install
   ```

2. Build all packages and applications using Turborepo:
   ```bash
   pnpm turbo build
   ```

### Running Locally

To start the development servers for all applications (frontend, integrations, etc.):
```bash
pnpm turbo dev
```

*Note: Ensure you have your local environment variables configured appropriately (e.g., database connection strings, GitHub/Jira OAuth tokens) as required by the `.env` files in respective packages/apps.*

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TypeScript
- **Backend/Workers**: Node.js, TypeScript
- **Database**: SQL (via Drizzle ORM)
- **Monorepo Tools**: pnpm workspaces, Turborepo
- **Infrastructure**: AWS CDK
