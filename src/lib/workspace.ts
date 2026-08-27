import { supabase } from './supabase';

export async function getCurrentWorkspace() {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const { data: membership, error: membershipError } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).limit(1).maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) throw new Error('No workspace found');
  const { data: restaurant, error: restaurantError } = await supabase.from('restaurants').select('*').eq('organization_id', membership.organization_id).limit(1).maybeSingle();
  if (restaurantError) throw restaurantError;
  return { user, membership, restaurant };
}

export function formatError(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}
