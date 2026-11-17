#!/usr/bin/env node
/**
 * Verifies role-based menu and route access with three real accounts.
 *
 * Requires a running app and three Supabase Auth users whose b2_register +
 * d3_positions rows resolve to the expected roles.
 *
 * Usage (PowerShell):
 *   $env:NEXT_PUBLIC_SUPABASE_URL="..."
 *   $env:NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
 *   $env:VERIFY_MANAGER_EMAIL="manager@example.com"; $env:VERIFY_MANAGER_PASSWORD="..."
 *   $env:VERIFY_SALES_EMAIL="sales@example.com";     $env:VERIFY_SALES_PASSWORD="..."
 *   $env:VERIFY_FIELD_EMAIL="field@example.com";     $env:VERIFY_FIELD_PASSWORD="..."
 *   node scripts/verify-role-access.mjs
 *
 * Optional: VERIFY_BASE_URL (default http://localhost:3000).
 * Exit codes: 0 all pass, 1 failures, 2 configuration/unreachable.
 */
import { createServerClient } from "@supabase/ssr";

const baseUrl = (process.env.VERIFY_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const ROLES = [
  {
    key: "manager",
    envKey: "MANAGER",
    email: process.env.VERIFY_MANAGER_EMAIL,
    password: process.env.VERIFY_MANAGER_PASSWORD,
    expectedRole: "manager_customer_success",
    expectedHome: "/dashboard/manager-customer-success",
    expectedMenu: [
      "/dashboard/manager-customer-success",
      "/dashboard/company-list",
      "/dashboard/meeting-schedule",
      "/dashboard/record-conversation",
      "/dashboard/task-of-field-agent",
      "/dashboard/manage-field-agent-account",
      "/dashboard/manager-customer-success/role-management",
    ],
    deniedPaths: ["/dashboard/sales-executive", "/dashboard/field-agent"],
    api: [
      { path: "/api/v1/manager/dashboard/overview", status: 200 },
      { path: "/api/record-conversation/alerts", status: 200 },
    ],
  },
  {
    key: "sales",
    envKey: "SALES",
    email: process.env.VERIFY_SALES_EMAIL,
    password: process.env.VERIFY_SALES_PASSWORD,
    expectedRole: "sales_executive",
    expectedHome: "/dashboard/sales-executive",
    expectedMenu: [
      "/dashboard/sales-executive",
      "/dashboard/company-list",
      "/dashboard/meeting-schedule",
      "/dashboard/record-conversation",
      "/dashboard/task-of-field-agent",
      "/dashboard/field-agent-management",
    ],
    deniedPaths: ["/dashboard/manager-customer-success", "/dashboard/field-agent"],
    api: [
      { path: "/api/v1/manager/dashboard/overview", status: 403 },
      { path: "/api/record-conversation/alerts", status: 403 },
    ],
  },
  {
    key: "field_agent",
    envKey: "FIELD",
    email: process.env.VERIFY_FIELD_EMAIL,
    password: process.env.VERIFY_FIELD_PASSWORD,
    expectedRole: "field_agent",
    expectedHome: "/dashboard/field-agent",
    expectedMenu: ["/dashboard/field-agent"],
    deniedPaths: [
      "/dashboard/sales-executive",
      "/dashboard/manager-customer-success",
      "/dashboard/record-conversation",
    ],
    api: [
      { path: "/api/v1/manager/dashboard/overview", status: 403 },
      { path: "/api/record-conversation/alerts", status: 403 },
    ],
  },
];

let failures = 0;

function check(ok, label, detail) {
  if (ok) {
    console.log(`PASS ${label}`);
  } else {
    failures += 1;
    console.log(`FAIL ${label}${detail ? ` :: ${detail}` : ""}`);
  }
}

function missingConfig() {
  const missing = [];
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  for (const role of ROLES) {
    if (!role.email) missing.push(`VERIFY_${role.envKey}_EMAIL`);
    if (!role.password) missing.push(`VERIFY_${role.envKey}_PASSWORD`);
  }
  return missing;
}

async function createSignedInClient(role) {
  const jar = new Map();
  const client = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => Array.from(jar.entries()).map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const cookie of cookies) {
          if (cookie.value) jar.set(cookie.name, cookie.value);
          else jar.delete(cookie.name);
        }
      },
    },
  });

  const { error } = await client.auth.signInWithPassword({
    email: role.email,
    password: role.password,
  });
  if (error) throw new Error(error.message);

  return {
    cookieHeader: Array.from(jar.entries()).map(([name, value]) => `${name}=${value}`).join("; "),
  };
}

function request(path, cookieHeader) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

function locationPath(response) {
  const location = response.headers.get("location");
  if (!location) return "";
  try {
    return new URL(location, baseUrl).pathname;
  } catch {
    return location;
  }
}

async function verifyRole(role) {
  console.log(`\n[${role.key}]`);

  let session;
  try {
    session = await createSignedInClient(role);
  } catch (error) {
    check(false, `${role.key}: sign in`, error.message);
    return;
  }

  const navResponse = await request("/api/v1/navigation/sidebar", session.cookieHeader);
  const navBody = await navResponse.json().catch(() => ({}));
  check(navResponse.status === 200, `${role.key}: GET /api/v1/navigation/sidebar`, `HTTP ${navResponse.status}`);
  check(
    navBody?.data?.role === role.expectedRole,
    `${role.key}: resolved role`,
    `expected ${role.expectedRole}, got ${navBody?.data?.role}`
  );

  const menuHrefs = (navBody?.data?.menu?.[0]?.children?.[0]?.children || [])
    .map((item) => item?.href)
    .filter(Boolean);
  const expected = new Set(role.expectedMenu);
  const actual = new Set(menuHrefs);
  const missing = [...expected].filter((href) => !actual.has(href));
  const extra = [...actual].filter((href) => !expected.has(href));
  check(
    missing.length === 0 && extra.length === 0,
    `${role.key}: menu matches role`,
    `missing=[${missing.join(", ")}] extra=[${extra.join(", ")}]`
  );

  const dashboardResponse = await request("/dashboard", session.cookieHeader);
  check(
    locationPath(dashboardResponse) === role.expectedHome,
    `${role.key}: /dashboard redirects to role home`,
    `HTTP ${dashboardResponse.status} -> ${locationPath(dashboardResponse)}`
  );

  for (const href of role.expectedMenu) {
    const response = await request(href, session.cookieHeader);
    check(response.status === 200, `${role.key}: allowed ${href}`, `HTTP ${response.status}`);
  }

  for (const href of role.deniedPaths) {
    const response = await request(href, session.cookieHeader);
    const target = locationPath(response);
    const blocked = response.status === 403 || (response.status >= 300 && response.status < 400 && target !== href);
    check(blocked, `${role.key}: blocked ${href}`, `HTTP ${response.status} -> ${target || "no location"}`);
    if (response.status >= 300 && response.status < 400) {
      check(
        target === role.expectedHome,
        `${role.key}: ${href} redirects to role home`,
        `got ${target}`
      );
    }
  }

  for (const entry of role.api) {
    const response = await request(entry.path, session.cookieHeader);
    check(response.status === entry.status, `${role.key}: ${entry.path} = ${entry.status}`, `HTTP ${response.status}`);
  }
}

async function main() {
  const missing = missingConfig();
  if (missing.length > 0) {
    console.error(`Missing configuration: ${missing.join(", ")}`);
    process.exit(2);
  }

  try {
    const probe = await fetch(`${baseUrl}/login`, { redirect: "manual" });
    if (!probe.ok && probe.status >= 500) throw new Error(`HTTP ${probe.status}`);
  } catch (error) {
    console.error(`Cannot reach ${baseUrl}: ${error.message}`);
    process.exit(2);
  }

  for (const role of ROLES) {
    await verifyRole(role);
  }

  console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
