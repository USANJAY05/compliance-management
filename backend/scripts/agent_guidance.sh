#!/bin/bash
cat <<'POLICY'
Agent Access Policy Reminder

1. Agents must file a ticket before requesting or needing any elevated access.
2. Describe the requesting agent, requested permissions, sensitivity level, and any supporting context (title, description, rationale).
3. Use the targeting/tag fields to notify Chitti or other approvers when the request must go through specific eyes before admin acts.
4. Admins are responsible for reviewing every ticket, marking it as reviewed, toggling owner/admin approval flags, and approving or denying access before any fulfillment.
5. Ticket records are stored in the compliance-grade database at data/tickets.db; keep that storage backed up per compliance rules.
6. Confidential tickets should be marked accordingly and only shared with approved teams.

Run this script with "bash scripts/agent_guidance.sh" whenever you need a reminder of the workflow.
POLICY
