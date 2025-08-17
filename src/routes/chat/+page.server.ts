import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) throw redirect(303, '/login');

  return { 
    user: { 
      id: session.user.id,
      email: session.user.email, 
      name: session.user.name, 
      role: (session.user as any).role
    } 
  };
};
