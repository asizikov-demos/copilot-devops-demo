# Copilot DevOps Demo - Logs Explorer

A demonstration repository showcasing how GitHub Copilot Agents with MCP (Model Context Protocol) integration can assist with log analysis and incident investigation for e-commerce order processing systems.

## Overview

This repository contains a simulated e-commerce platform with multiple microservices handling order processing. The system generates realistic service logs stored in a SQLite database, complete with distributed tracing, multiple service instances, and various failure scenarios.

This demo features:
- **Custom GitHub Copilot Agent** ([Logs Explorer](.github/agents/Logs%20Explorer.agent.md)) configured with limited tools for focused log analysis
- **SQLite MCP Server Integration** - Demonstrates real-world MCP integration for production log systems
- **Reusable Prompt Templates** - Pre-built prompts for common investigation scenarios
- **Realistic Failure Scenarios** - Timeouts, OOM errors, payment gateway failures

The demo showcases how GitHub Copilot Agents can be used to:
- Investigate production incidents through natural language queries
- Trace user journeys across distributed services
- Identify failure patterns and root causes
- Analyze system health and performance metrics
- Generate comprehensive incident reports with diagrams

## Architecture

The platform consists of four main microservices:

- **User Service** - Manages user authentication and profiles
- **Order Service** - Processes customer orders and manages order lifecycle
- **Payment Service** - Handles payment processing via external payment gateway
- **Data Service** - Handles data operations and database lookups

Each service runs multiple instances for scalability and reliability.

## Database

The system uses SQLite to store service logs and tracing information. The agent can discover the schema using MCP integration.

## Data Ingestion

### Prerequisites

```bash
cd data-seed
npm install
```

### Initialize Database Schema

```bash
node data-seed.js init
```

This creates the SQLite database at `database/db.sqlite` and initializes all tables with proper indexes.

### Generate Mock Data

```bash
node data-seed.js generate
```

This generates realistic service logs including:
- **Service startup events** for all services and instances
- **User login flows** (11 users, including 1 authentication failure)
- **Data lookups** (with 2 timeout scenarios)
- **Order creation** (with 1 OutOfMemoryError scenario)
- **Payment processing** (with 1 payment gateway timeout)
- **Order fulfillment** for successful orders

### Data Summary

The generated dataset includes:
- 20 service startup events (4 services × 5 instances)
- 11 user login attempts (10 successful, 1 failed)
- 10 data lookup operations (8 successful, 2 timeouts)
- 8 order creation attempts (7 successful, 1 OOM error)
- 7 payment processing attempts (6 successful, 1 gateway timeout)
- 6 order fulfillment operations

Total: ~150+ log entries with full distributed tracing

## Logs Explorer Agent

The [Logs Explorer Agent](.github/agents/Logs%20Explorer.agent.md) is a custom GitHub Copilot Agent configured with:

- **Limited Tool Set** - Only has access to file operations and SQLite MCP tools
- **SQLite MCP Integration** - Demonstrates real-world integration with production log systems
- **Focused Purpose** - Specifically designed for log analysis and incident investigation

This agent serves as an example of how to:
- Create domain-specific agents with constrained capabilities
- Integrate MCP servers for external data access
- Build reusable workflows for common operational tasks

## Demo Flow

### Prerequisites

1. **Configure SQLite MCP Server** (see Configuration section below)
2. **Generate Demo Data** (see Data Ingestion section below)
3. **Activate Logs Explorer Agent** in GitHub Copilot

### Scenario 1: System Investigation & Documentation

**Objective**: Understand the system architecture and document the order processing flow.

**Use the reusable prompt**: [demo-01-explore-logs.prompt.md](.github/prompts/demo-01-explore-logs.prompt.md)

This prompt instructs the agent to:
- Explore the logs database structure
- Identify all services and their interactions
- Map out the complete order processing flow
- Generate architecture and sequence diagrams
- Create comprehensive documentation

**Expected Output**: The agent will generate [order_flow.md](examples/order_flow.md) containing:
- Service architecture diagrams (Mermaid)
- Sequence diagrams for order lifecycle
- Event type definitions
- Step-by-step flow documentation

### Scenario 2: Incident Investigation

**Objective**: Investigate a vague production incident report and identify root causes.

**Use the reusable prompt**: [demo-02-investigate-errors.prompt.md](.github/prompts/demo-02-investigate-errors.prompt.md)

This prompt provides only a vague description: _"Some users were unable to complete their orders"_

The agent must:
- Query logs to identify failed transactions
- Correlate events across distributed services
- Trace affected user journeys
- Identify root causes and failure patterns
- Generate incident timeline with diagrams
- Provide actionable recommendations

**Expected Output**: The agent will generate [incident-investigation.md](examples/incident-investigation.md) containing:
- List of affected users and failure points
- Timeline of events with Mermaid diagrams
- Root cause analysis for each failure type
- Service health summary
- Prioritized recommendations for remediation

### Ad-hoc Investigation

Beyond the reusable prompts, you can ask the agent natural language questions:
- "Show me all failed orders"
- "Which users experienced timeouts?"
- "Analyze error rates by service"
- "Show the complete trace for user003"
- "What caused the OutOfMemoryError?"
- "Which service instances are having problems?"

## Configuration

### SQLite MCP Server Setup

To use the Logs Explorer agent, you need to configure the SQLite MCP server in your VS Code settings.

Add the following to your `mcp.json` configuration file:

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "uvx",
      "args": [
        "mcp-server-sqlite",
        "--db-path",
        "${input:db_path}"
      ],
      "type": "stdio"
    }
  },
  "inputs": [
    {
      "type": "promptString",
      "id": "db_path",
      "description": "SQLite Database Path",
      "default": "/path/to/your/database/db.sqlite"
    }
  ]
}
```

**Note**: Update the `default` path to point to your actual database location (e.g., `/Users/username/demos/copilot-devops-demo/database/db.sqlite`).

## Example Outputs

The `examples/` directory contains sample outputs generated by the Logs Explorer agent:

### [Order Processing Flow](examples/order_flow.md)
Generated by [demo-01-explore-logs.prompt.md](.github/prompts/demo-01-explore-logs.prompt.md):
- Complete service architecture diagrams (Mermaid)
- Sequence diagrams for successful orders
- Event type definitions
- Step-by-step order processing breakdown

### [Incident Investigation Report](examples/incident-investigation.md)
Generated by [demo-02-investigate-errors.prompt.md](.github/prompts/demo-02-investigate-errors.prompt.md):
- Real incident analysis from generated data
- Timeline of failures with affected users (Mermaid flowcharts)
- Root cause analysis for each failure type
- Service health summary
- Actionable recommendations with priority levels

## Use Cases

This demo is ideal for demonstrating:

1. **Incident Response** - How Copilot can help SREs quickly identify and diagnose production issues
2. **Log Analysis** - Natural language queries to explore complex distributed systems
3. **Pattern Recognition** - Identifying failure patterns across services and instances
4. **Root Cause Analysis** - Tracing issues through distributed traces
5. **System Health Monitoring** - Analyzing service metrics and error rates

## Technical Details

- **Database**: SQLite 3.x
- **Node.js**: Required for data generation
- **Log Format**: Structured logs with template + formatted messages
- **Tracing**: Distributed tracing with unique trace IDs
- **Time Range**: All events occur on October 31, 2025, between 02:04:04 and 02:20:00 UTC

## Files Structure

```
.
├── data-seed/
│   ├── data-seed.js         # Data generation script
│   ├── package.json         # Node.js dependencies
│   └── schema.sql          # Database schema definition
├── database/
│   └── db.sqlite           # SQLite database (generated)
├── examples/
│   ├── incident-investigation.md  # Sample incident report
│   └── order_flow.md             # Order processing documentation
└── README.md               # This file
```

## Getting Started

### 1. Setup Repository

```bash
# Clone the repository
git clone <repository-url>
cd copilot-devops-demo

# Install Node.js dependencies
cd data-seed
npm install
cd ..
```

### 2. Configure SQLite MCP Server

Add the SQLite MCP configuration to your VS Code `mcp.json` (see Configuration section above).

### 3. Generate Demo Data

```bash
# Initialize database schema
node data-seed/data-seed.js init

# Generate realistic log data
node data-seed/data-seed.js generate
```

### 4. Run Demo Scenarios

1. Open GitHub Copilot Chat
2. Activate the **Logs Explorer** agent
3. Use the reusable prompts:
   - Run [demo-01-explore-logs.prompt.md](.github/prompts/demo-01-explore-logs.prompt.md) for system investigation
   - Run [demo-02-investigate-errors.prompt.md](.github/prompts/demo-02-investigate-errors.prompt.md) for incident analysis
4. Or ask ad-hoc questions in natural language!

## License

This is a demonstration repository for educational purposes.
