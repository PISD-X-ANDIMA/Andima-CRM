export interface SubMenuItem {
  name: string;
  href: string;
}

export interface FieldAgentTaskItem {
  id: string;
  title: string;
  customerName: string;
  companyAddress?: string;
  scheduledDate?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
  notes?: string;
}

export interface FieldAgentMetrics {
  assignedTasks: number;
  completedTasks: number;
  pendingReports: number;
}
