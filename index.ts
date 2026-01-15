import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const linkId = url.searchParams.get('id');

    if (!linkId) {
      console.error('Missing link ID');
      return new Response(
        JSON.stringify({ error: 'Missing link ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing click for affiliate link: ${linkId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the affiliate link
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('id', linkId)
      .single();

    if (linkError || !link) {
      console.error('Affiliate link not found:', linkError);
      return new Response(
        JSON.stringify({ error: 'Link not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found affiliate link: ${link.name}, destination: ${link.destination_url}`);

    // Get tracking info from request
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';
    
    // Create a hash of the IP for privacy (we don't store raw IPs)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const ipHash = await hashString(clientIP + new Date().toDateString());

    // Record the click
    const { error: clickError } = await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_link_id: linkId,
        user_agent: userAgent.substring(0, 500),
        referrer: referrer.substring(0, 500),
        ip_hash: ipHash,
      });

    if (clickError) {
      console.error('Error recording click:', clickError);
    } else {
      console.log('Click recorded successfully');
    }

    // Update click count
    const { error: updateError } = await supabase
      .from('affiliate_links')
      .update({ 
        click_count: link.click_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', linkId);

    if (updateError) {
      console.error('Error updating click count:', updateError);
    }

    // Redirect to destination
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': link.destination_url,
      },
    });

  } catch (error) {
    console.error('Error processing click:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}
