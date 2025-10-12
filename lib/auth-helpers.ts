import { supabase } from './supabase';

export async function getOrCreateUser(email: string) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', existingUser.id);

    return existingUser;
  }

  const { data: newOrg, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: `${email}'s Organization`, plan: 'free' })
    .select()
    .single();

  if (orgError) throw orgError;

  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      email,
      name: email.split('@')[0],
      role: 'user',
      org_id: newOrg.id,
      last_login_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (userError) throw userError;

  await supabase
    .from('credit_balances')
    .insert({ org_id: newOrg.id, balance: Number(process.env.FREE_MONTHLY_CREDITS || 10000) });

  return newUser;
}
