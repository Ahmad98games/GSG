"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Inter-Branch Transfer Server Actions
 * These actions invoke high-integrity RPCs in Postgres to ensure atomicity.
 */

export async function initiateInterBranchTransfer(params: {
  businessId: string;
  fromBranchId: string;
  toBranchId: string;
  skuId: string;
  qty: string;
  notes?: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('initiate_inter_branch_transfer', {
    p_business_id: params.businessId,
    p_from_branch_id: params.fromBranchId,
    p_to_branch_id: params.toBranchId,
    p_sku_id: params.skuId,
    p_qty: parseFloat(params.qty),
    p_notes: params.notes || "",
    p_user_id: params.userId
  });

  if (error) {
    console.error("[IBT] Initiation Error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/inventory/transfers/inter-branch");
  return data;
}

export async function receiveInterBranchTransfer(transferId: string, userId: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('receive_inter_branch_transfer', {
    p_transfer_id: transferId,
    p_user_id: userId
  });

  if (error) {
    console.error("[IBT] Receipt Error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/inventory/transfers/inter-branch");
}

export async function cancelInterBranchTransfer(transferId: string, userId: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('cancel_inter_branch_transfer', {
    p_transfer_id: transferId,
    p_user_id: userId
  });

  if (error) {
    console.error("[IBT] Cancellation Error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/inventory/transfers/inter-branch");
}

