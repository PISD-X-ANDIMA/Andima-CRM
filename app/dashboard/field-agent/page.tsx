import { FieldAgentShell } from "../../../components/FieldAgentShell";
import { FieldAgentDashboard } from "../../../components/FieldAgentDashboard";

export default function FieldAgentPage() {
  return (
    <FieldAgentShell headerTitle="Field Agent Dashboard">
      <FieldAgentDashboard
        metrics={{
          assignedTasks: 0,
          completedTasks: 0,
          pendingReports: 0,
        }}
      />
    </FieldAgentShell>
  );
} 
