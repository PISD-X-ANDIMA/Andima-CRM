import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CompanyContactItem } from "@/types/customer";

export interface ContactInput {
  full_name: string;
  phone_number: string;
  position?: string | null;
  email?: string | null;
  is_primary?: boolean;
}

/**
 * Mengambil seluruh contact PIC untuk customer tertentu.
 */
export async function getContactsByCustomerId(
  customerId: string
): Promise<CompanyContactItem[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await (supabase as any)
      .from("a1_company_contacts")
      .select("*")
      .eq("company_id", customerId)
      .is("deleted_at", null)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return data.map((c: any) => ({
      id: c.id,
      companyId: c.company_id,
      fullName: c.full_name,
      phoneNumber: c.phone_number,
      position: c.position,
      email: c.email,
      isPrimary: c.is_primary,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Menambahkan contact PIC baru ke customer.
 */
export async function createContact(
  customerId: string,
  input: ContactInput
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    const isPrimary = Boolean(input.is_primary);

    // Jika contact baru dijadikan primary, nonaktifkan primary lama
    if (isPrimary) {
      await (supabase as any)
        .from("a1_company_contacts")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("company_id", customerId)
        .is("deleted_at", null);
    }

    const { data, error } = await (supabase as any)
      .from("a1_company_contacts")
      .insert({
        company_id: customerId,
        full_name: input.full_name.trim(),
        phone_number: input.phone_number.trim(),
        position: input.position?.trim() || null,
        email: input.email?.trim() || null,
        is_primary: isPrimary,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    // Update kolom `name` pada a1_company_list jika primary
    if (isPrimary) {
      await (supabase as any)
        .from("a1_company_list")
        .update({ name: input.full_name.trim(), updated_at: new Date().toISOString() })
        .or(`company_list_id.eq.${customerId},id.eq.${customerId}`);
    }

    return { success: true, contactId: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Mengubah data contact PIC.
 */
export async function updateContact(
  customerId: string,
  contactId: string,
  input: Partial<ContactInput>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.full_name) updatePayload.full_name = input.full_name.trim();
    if (input.phone_number) updatePayload.phone_number = input.phone_number.trim();
    if (input.position !== undefined) updatePayload.position = input.position?.trim() || null;
    if (input.email !== undefined) updatePayload.email = input.email?.trim() || null;

    if (input.is_primary) {
      // Nonaktifkan primary lama
      await (supabase as any)
        .from("a1_company_contacts")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("company_id", customerId)
        .neq("id", contactId)
        .is("deleted_at", null);

      updatePayload.is_primary = true;
    }

    const { error } = await (supabase as any)
      .from("a1_company_contacts")
      .update(updatePayload)
      .eq("id", contactId)
      .eq("company_id", customerId);

    if (error) return { success: false, error: error.message };

    if (input.is_primary && input.full_name) {
      await (supabase as any)
        .from("a1_company_list")
        .update({ name: input.full_name.trim(), updated_at: new Date().toISOString() })
        .or(`company_list_id.eq.${customerId},id.eq.${customerId}`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Menghapus contact PIC dengan aturan proteksi PIC terakhir.
 */
export async function deleteContact(
  customerId: string,
  contactId: string
): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database client unavailable" };

  try {
    // 1. Ambil seluruh contact aktif customer ini
    const { data: contacts, error: fetchErr } = await (supabase as any)
      .from("a1_company_contacts")
      .select("id, is_primary")
      .eq("company_id", customerId)
      .is("deleted_at", null);

    if (fetchErr || !contacts || contacts.length === 0) {
      return { success: false, error: "Contact tidak ditemukan" };
    }

    // Aturan 7 & 8: Dilarang menghapus jika hanya tersisa 1 contact
    if (contacts.length <= 1) {
      return {
        success: false,
        errorCode: "CONTACT_002",
        error: "Dilarang menghapus satu-satunya narahubung PIC yang dimiliki customer",
      };
    }

    const targetContact = contacts.find((c: any) => c.id === contactId);
    if (!targetContact) {
      return { success: false, error: "Contact tidak ditemukan" };
    }

    // Jika yang dihapus adalah PIC utama, dilarang hapus tanpa memilih pengganti terlebih dahulu
    if (targetContact.is_primary) {
      return {
        success: false,
        errorCode: "CONTACT_002",
        error: "Dilarang menghapus PIC utama aktif. Ubah PIC utama ke contact lain terlebih dahulu",
      };
    }

    // Soft delete contact
    const { error: delErr } = await (supabase as any)
      .from("a1_company_contacts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", contactId)
      .eq("company_id", customerId);

    if (delErr) return { success: false, error: delErr.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
