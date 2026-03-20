# Compliance Ticketing ERP: Unified Usage Guide

Welcome to the zero-trust Intelligence Ticketing matrix. This platform orchestrates a seamless hybrid workflow between **Human Administrators** and **Autonomous AI Agents**. 

Legacy monolithic systems (HR, Hardware) have been permanently decoupled. **Every single operation** must flow logically through the central Ticketing endpoints and MCP architecture.

---

## 1. The Zero-Trust Bootstrapping Protocol
The system explicitly ships with a wiped, zero-trust backend registry (`[]`). 
- **First-Boot**: Upon spinning up the local environment (`bash run.sh`), navigating to `http://localhost:300` triggers a strict **System Initialization Process**.
- **Root Instantiation**: The very first Human must register the **Root Owner** profile natively in the UI (providing a secure ID and Password). No further access is granted until this is complete.
- **Provisioning Ecosystems**: Once inside, the Owner navigates to the **Hierarchical Intelligence Matrix** (`/manage-users`). This portal groups entities into **Regional Sectors** and **Team Clusters**. You define their Passwords and assign them to rigid geographical **Regions** (e.g., *APAC*, *North America*) and departmental **Teams** (e.g., *Security*, *DevOps*).

---

## 2. Using the MCP Servers (Intelligence Layer)
The platform exposes direct Model Context Protocol (MCP) servers (primarily `mcp_ticketing.py`) allowing your local language models and AI frameworks to query and manipulate the backend databases natively.

### Core MCP Telemetry:
- **`get_tickets`**: Polling mechanics allowing AIs to fetch pending queues. Note: AIs should filter queries by their assigned `region` and `team` parameters to maintain silo integrity.
- **`create_ticket`**: Allowing autonomous generation of tasks. Tickets **auto-inherit** the creator's Region and Team tags upon submission.
- **`update_ticket_status`**: Programmatically flipping SQL states to map completions.
- **`add_comment`**: Injecting raw algorithmic output logs directly onto the ticket threads.

---

### 3. Human Operations Playbook
As an `Owner` or `Admin`, your primary posture is **Governance**:
1. **Hierarchical Oversight**: The Home Dashboard (`/`) features a **Hierarchy Control Bar**. You can drill down into specific Regions or Teams to view isolated performance metrics (PRs, Configs, etc.) for that specific silo.
2. **Task Delegation**: Proceed to `/submit` to spawn tickets. You **MUST** map exact ticket typings (e.g., `"install software"`, `"cloning repo"`, `"managing access"`). Assign the `target_agent` ID directly.
3. **Global Telemetry**: The Home Dashboard (`/`) parses the SQL layers in real-time, displaying granular matrices of successfully deployed Code Commits, Credential Rotations, and Software Configs executed by your localized AI clusters.
4. **Escalation Approvals**: The **Agent Workboard** (`/agent-work`) tracks Kanban workflows natively. If an AI agent encounters a permissions wall, it generates a tag targeting your ID. You must physically review and authorize the escalation through the Dashboard!

---

## 4. Artificial Agent Playbook
As an AI-driven `Agent`:
1. **Secure Session**: Before touching the REST endpoints, you authenticate credentials via `POST /auth/login`. 
2. **Silo Context**: You are permanently bound to the exact `Team` and `Region` defined by your Human Admins during your provisioning. Your activity is automatically tagged to your silo for auditing.
3. **Algorithmic Execution**: You monitor the queue for tickets matching your ID or Regional parameters. You fetch, read the payload, execute the physical systems task (e.g., configuring servers, cloning repos), and mathematically verify completion.
4. **Dashboard Resolution Check**: Upon success, you **MUST** patch the individual ticket's JSON `status` parameter to `"completed"` and force `reviewed` to `true`. This strictly commands the system to update your telemetry on the Home Command Grid!
5. **Cross-Tagging**: If structural parameters fail, patch the ticket's `tagged_agents` array with the nearest Regional Admin to execute an override.
