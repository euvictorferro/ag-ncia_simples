import type { SupabaseClient } from "@supabase/supabase-js";

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  agency_id: string;
  client_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type AgencyMember = {
  id: string;
  user_id: string;
};

export async function listTasks(supabase: SupabaseClient, agencyId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Task[];
}

export async function listTasksByClient(
  supabase: SupabaseClient,
  agencyId: string,
  clientId: string,
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Task[];
}

export async function listAgencyMembers(supabase: SupabaseClient, agencyId: string): Promise<AgencyMember[]> {
  const { data, error } = await supabase
    .from("agency_members")
    .select("id, user_id")
    .eq("agency_id", agencyId);

  if (error) throw error;
  return data as AgencyMember[];
}

export type TaskInput = {
  client_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
};

export async function createTask(
  supabase: SupabaseClient,
  agencyId: string,
  input: TaskInput,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ agency_id: agencyId, ...input })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<TaskInput>,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
