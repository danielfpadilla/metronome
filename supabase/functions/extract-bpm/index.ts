import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { youtube_url, track_id } = await req.json();

    if (!youtube_url || !track_id) {
      return new Response(
        JSON.stringify({ error: 'youtube_url and track_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const tmpAudio = `/tmp/${track_id}.mp3`;
    const dlProcess = new Deno.Command('yt-dlp', {
      args: [
        '-f', 'bestaudio[ext=m4a]/best',
        '--no-playlist',
        '--max-filesize', '5M',
        '-o', tmpAudio,
        youtube_url,
      ],
    });
    const dlResult = await dlProcess.output();
    if (!dlResult.success) {
      throw new Error('Failed to download audio');
    }

    const bpmProcess = new Deno.Command('python3', {
      args: ['bpm_detect.py', tmpAudio],
    });
    const bpmResult = await bpmProcess.output();
    const bpmText = new TextDecoder().decode(bpmResult.stdout).trim();
    const bpm = parseInt(bpmText, 10);

    if (isNaN(bpm)) {
      throw new Error('BPM extraction failed');
    }

    const audioBytes = await Deno.readFile(tmpAudio);
    const storagePath = `previews/${track_id}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(storagePath, audioBytes, { contentType: 'audio/mpeg', upsert: true });

    if (uploadError) throw uploadError;

    await supabase
      .from('tracks')
      .update({ bpm, storage_path: storagePath })
      .eq('id', track_id);

    try { await Deno.remove(tmpAudio); } catch { /* ignore */ }

    return new Response(
      JSON.stringify({ bpm, storage_path: storagePath }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});