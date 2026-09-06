/**
 * Cloudflare Worker entry point for mymemo
 * Handles /api/auth/line-callback and serves static assets.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route: LINE OAuth callback
    if (url.pathname === '/api/auth/line-callback') {
      return handleLineCallback(request, env);
    }

    // Everything else → serve static assets
    return env.ASSETS.fetch(request);
  },
};

async function handleLineCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const origin = url.origin;

  if (error || !code) {
    return redirect(origin, `auth_error=${encodeURIComponent(error || 'no_code')}`);
  }

  const supaUrl = env.SUPABASE_URL;
  const supaKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supaUrl || !supaKey || !env.LINE_CHANNEL_ID || !env.LINE_CHANNEL_SECRET) {
    return redirect(origin, 'auth_error=server_misconfigured');
  }

  const supaHeaders = {
    apikey: supaKey,
    Authorization: `Bearer ${supaKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Exchange code for LINE access token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${origin}/api/auth/line-callback`,
        client_id: env.LINE_CHANNEL_ID,
        client_secret: env.LINE_CHANNEL_SECRET,
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('LINE token exchange failed');

    // 2. Get LINE user profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    const { userId: lineUserId, displayName, pictureUrl } = profile;
    if (!lineUserId) throw new Error('No LINE user ID in profile');

    // 3. Look up user in line_users table
    const lookupRes = await fetch(
      `${supaUrl}/rest/v1/line_users?line_user_id=eq.${encodeURIComponent(lineUserId)}&select=user_id`,
      { headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` } }
    );
    const lineUsers = await lookupRes.json();

    // Email is always deterministic — no need to fetch it later
    const lineEmail = `line_${lineUserId}@memo.internal`;
    let userId;
    let userEmail;

    if (Array.isArray(lineUsers) && lineUsers.length > 0) {
      userId = lineUsers[0].user_id;
      // Refresh profile info
      await fetch(
        `${supaUrl}/rest/v1/line_users?line_user_id=eq.${encodeURIComponent(lineUserId)}`,
        {
          method: 'PATCH',
          headers: { ...supaHeaders, Prefer: 'return=minimal' },
          body: JSON.stringify({ display_name: displayName, picture_url: pictureUrl }),
        }
      );
      // Get the actual email registered for this user
      const userRes = await fetch(`${supaUrl}/auth/v1/admin/users/${userId}`, {
        headers: supaHeaders,
      });
      const userData = await userRes.json();
      userEmail = userData.email;
      if (!userEmail) throw new Error(`Could not get email for user ${userId}`);
    } else {
      // Try to create Supabase auth user
      const createRes = await fetch(`${supaUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: supaHeaders,
        body: JSON.stringify({ email: lineEmail, email_confirm: true }),
      });
      const newUser = await createRes.json();

      if (newUser.id) {
        userId = newUser.id;
        userEmail = lineEmail;
      } else if (newUser.error_code === 'email_exists') {
        // Auth user exists but line_users record is missing — look up by email
        const listRes = await fetch(
          `${supaUrl}/auth/v1/admin/users?email=${encodeURIComponent(lineEmail)}&page=1&per_page=1`,
          { headers: supaHeaders }
        );
        const listData = await listRes.json();
        userId = listData?.users?.[0]?.id;
        userEmail = listData?.users?.[0]?.email ?? lineEmail;
        if (!userId) throw new Error('email_exists but could not find existing user');
      } else {
        throw new Error(`Failed to create Supabase user: ${JSON.stringify(newUser)}`);
      }

      // Create line_users record (upsert to handle duplicates gracefully)
      await fetch(`${supaUrl}/rest/v1/line_users`, {
        method: 'POST',
        headers: { ...supaHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ line_user_id: lineUserId, user_id: userId, display_name: displayName, picture_url: pictureUrl }),
      });
    }

    // 4. Generate magic link using the user's actual registered email
    const linkRes = await fetch(`${supaUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: supaHeaders,
      body: JSON.stringify({
        type: 'magiclink',
        email: userEmail,
        options: { redirect_to: `${origin}/dashboard` },
      }),
    });
    const linkData = await linkRes.json();
    if (!linkData.action_link) throw new Error('Failed to generate magic link');

    return Response.redirect(linkData.action_link, 302);
  } catch (err) {
    console.error('[line-callback]', err.message);
    return redirect(origin, `auth_error=${encodeURIComponent(err.message)}`);
  }
}

function redirect(origin, query) {
  return Response.redirect(`${origin}/dashboard?${query}`, 302);
}
