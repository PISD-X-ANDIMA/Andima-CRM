import { NextRequest } from "next/server";
import {
  getContactsByCustomerId,
  createContact,
  updateContact,
  deleteContact,
} from "@/lib/services/contact-service";
import { createSuccessResponse, createErrorResponse } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const contacts = await getContactsByCustomerId(customerId);
    return createSuccessResponse(contacts, { total: contacts.length });
  } catch {
    return createErrorResponse("GET_001", "Failed to load the contact list", undefined, 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { customerId } = await params;
    const body = await request.json();

    if (!body.full_name?.trim()) {
      return createErrorResponse("VALIDATION_001", "Contact name is required", undefined, 400);
    }
    if (!body.phone_number?.trim()) {
      return createErrorResponse("VALIDATION_001", "Phone number is required", undefined, 400);
    }

    const result = await createContact(customerId, {
      full_name: body.full_name,
      phone_number: body.phone_number,
      position: body.position,
      email: body.email,
      is_primary: body.is_primary,
    });

    if (!result.success) {
      return createErrorResponse("CREATE_001", result.error || "Failed to add the contact", undefined, 500);
    }

    return createSuccessResponse({ contactId: result.contactId }, undefined, 201);
  } catch {
    return createErrorResponse("CREATE_002", "Invalid request", undefined, 400);
  }
}
