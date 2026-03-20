// @deno-lint-ignore-file
// @ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generate } from "https://esm.sh/@pdfme/generator@5.5.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const body = await req.json();
    const { certificateId, action } = body;

    if (action === 'generate') {
      // Generate new certificate for completed course
      const { courseId, userId, grade } = body || {};
      
      // Call the issue_certificate function
      const { data: cert, error: certError } = await supabase
        .rpc('issue_certificate', {
          _user_id: userId,
          _course_id: courseId,
          _grade: grade || null
        });

      if (certError) {
        console.error('Error issuing certificate:', certError);
        return new Response(
          JSON.stringify({ error: certError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, certificate: cert }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'download' && certificateId) {
      // Fetch certificate data
      const { data: certificate, error: fetchError } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', certificateId)
        .single();

      if (fetchError || !certificate) {
        console.error('Certificate not found:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Certificate not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Format date
      const issuedDate = new Date(certificate.issued_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Fetch default template
      const { data: defaultTemplate } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('is_default', true)
        .single();

      if (!defaultTemplate) {
        return new Response(
          JSON.stringify({ error: 'No default template found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prepare data for pdfme
      const inputs = [{
        name: certificate.student_name,
        course: certificate.course_title,
        date: issuedDate,
        grade: certificate.grade ? `Calificación: ${certificate.grade.toFixed(1)}%` : '',
        code: certificate.certificate_code
      }];

      // Fix the template structure if needed
      let fixedTemplate = defaultTemplate.template_data;
      
      // Check if schemas is in the incorrect format (array of array instead of array of objects)
      if (Array.isArray(fixedTemplate.schemas) && fixedTemplate.schemas.length > 0 &&
          Array.isArray(fixedTemplate.schemas[0])) {
        // Convert from array of array format to correct format
        const schemaItems = fixedTemplate.schemas[0];
        const newSchemaObj: any = {};
        schemaItems.forEach((item: any) => {
          newSchemaObj[item.name] = item;
        });
        fixedTemplate = {
          ...fixedTemplate,
          schemas: [newSchemaObj]
        };
      }

      // Generate PDF with pdfme
      const pdfBytes = await generate({
        template: fixedTemplate,
        inputs
      });

      // Return PDF bytes directly
      return new Response(pdfBytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="certificado-${certificate.certificate_code}.pdf"`,
        },
      });
    }

    if (action === 'verify') {
      const { code } = body || {};
      
      // Public verification - use service role
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: cert, error } = await adminClient
        .from('certificates')
        .select('*')
        .eq('certificate_code', code)
        .single();

      if (error || !cert) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Certificate not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          certificate: {
            studentName: cert.student_name,
            courseTitle: cert.course_title,
            issuedAt: cert.issued_at,
            grade: cert.grade,
            code: cert.certificate_code
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-certificate-pdfme:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
