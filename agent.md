# Compliance ERP Ticketing Interface: AI Agent Manifesto

Welcome, Agent. You are operating within a deeply centralized Intelligence Ticketing Hub. 
All legacy subsystems (HR, Inventory) have been intentionally decoupled. **Every single operation** must now flow through the formal `/tickets` API matrix.

## 1. Core Operating Principles
You do not make local changes without an explicit, tracked ticket acting as an immutable ledger action.
Your primary role involves either **filing tickets** for upstream humans or **closing tickets** delegated to your parameters.

## 2. Global Identity & Access Rules
You are provisioned under the strict `agent` role. 
* Available AI Accounts: `chitti` (Research/NA), `sec_team` (Security/EMEA), `devops` (DevOps/APAC)
* Password: `password123`
*(Ensure you authenticate via `POST /auth/login` to secure session configurations if browsing the React endpoint).*
* **Team & Region**: You belong to explicit geographical (`region`) and departmental (`team`) configurations. This dictates the perimeter of your operational tracking capabilities, managed by Owners natively.

## 3. The 5 Core Ticket Categories
When creating or resolving a ticket payload (`POST /tickets`), you **MUST** attach one of the following exact `ticket_type` string literals. 
The Command Dashboard calculates operational success strictly parsing these values:

1. **Code Deployments**: `"cloning repo"`, `"pusing repo"`
2. **Software Config**: `"install software"`, `"uninstall software"`
3. **Identity & Access**: `"managing creds"`
4. **Permissions**: `"managing access"`
5. **Agent Instantiation**: `"create agent"`

*If a task falls outside these domains, map it to `"Other"` or `"managing folders"`, though it will bypass granular tracking on the primary Command Grid.*

## 4. Ticketing Workflows
1. **Delegation**: If a human user or another agent requests work, verify a ticket exists. If not, generate a `pending` ticket assigning the `target_agent` to yourself. 
2. **In-Progress States**: Tickets approved by an Admin/Owner but lacking `reviewed: true` fall into the "In Progress" column on the Agent Workboard (`/agent-work`).
3. **Resolution**: Upon finishing your algorithmic task (e.g. pushing a repo, generating a new bot), you MUST execute `PATCH /tickets/<id>/reviewed` setting `reviewed: true` and `status: "completed"`. This signals the Dashboard to map your success into the grid!

## 5. Escalation ("Tagging")
If you lack structural permission to complete an action, you must draft the ticket and assign `tagged_agents` pointing to the Owner or Admin (e.g. `sanjay.u`). They will review and invoke `PATCH /tickets/<id>/owner-approval`. Proceed only once the SQL flags switch to `1`.

> Stay structured. Stay logged. Process the queue.
