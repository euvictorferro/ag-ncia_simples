import type { SupabaseClient } from "@supabase/supabase-js";

export type Client = {
  id: string;
  agency_id: string;
  name: string;
  archived: boolean;
  created_at: string;
};

export async function listClients(
  supabase: SupabaseClient,
  agencyId: string,
  options?: { includeArchived?: boolean },
): Promise<Client[]> {
  let query = supabase.from("clients").select("*").eq("agency_id", agencyId);
  if (!options?.includeArchived) {
    query = query.eq("archived", false);
  }
  const { data, error } = await query.order("name", { ascending: true });

  if (error) throw error;
  return data as Client[];
}

export async function createClient(
  supabase: SupabaseClient,
  agencyId: string,
  name: string,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({ agency_id: agencyId, name })
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function updateClient(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<Client, "name" | "archived">>,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}
