import type { CrmRole } from "./roles";

/**
 * CRM role list from the class roster (WhatsApp Image 2026-11-17 at 20.52.09).
 * This overrides b2_register.position_id when HR data disagrees.
 * Update this list when the roster changes.
 */
const CRM_ROLE_BY_EMAIL: Record<string, CrmRole> = {
  "kentson.thio@andima.co.id": "manager_customer_success",
  "testingmanager@andima.co.id": "manager_customer_success",
  "zefanyase@andima.co.id": "sales_executive",
  "zefanyasae@andima.co.id": "sales_executive",
  "samuelse@andima.co.id": "sales_executive",
  "samuelisa@andima.co.id": "sales_executive",
  "satyase@andima.co.id": "sales_executive",
  "satyaa@andima.co.id": "sales_executive",
  "aurel@andima.co.id": "field_agent",
  "maria@andima.co.id": "field_agent",
  "johan@andima.co.id": "field_agent",
  "backup1@andima.co.id": "field_agent",
  "backup2@andima.co.id": "field_agent",
  "backup3@andima.co.id": "field_agent",
};

export function roleForCrmEmail(email?: string | null): CrmRole | null {
  const key = String(email || "").trim().toLowerCase();
  return CRM_ROLE_BY_EMAIL[key] ?? null;
}
