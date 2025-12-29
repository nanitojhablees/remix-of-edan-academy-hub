import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to encode text as base64
function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

// Generate PDF content manually (simplified PDF structure)
function generatePDFContent(
  studentName: string,
  courseTitle: string,
  certificateCode: string,
  issuedDate: string,
  grade: number | null
): string {
  const pageWidth = 842; // A4 landscape width in points
  const pageHeight = 595; // A4 landscape height in points
  
  const gradeText = grade !== null ? `Calificación: ${grade.toFixed(1)}%` : '';
  
  // PDF content with embedded fonts and graphics
  const content = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj

6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

4 0 obj
<< /Length 1500 >>
stream
q
% Background gradient simulation with rectangles
0.05 0.15 0.35 rg
0 0 ${pageWidth} ${pageHeight} re f
0.08 0.20 0.45 rg
20 20 ${pageWidth - 40} ${pageHeight - 40} re f

% Decorative border
0.85 0.65 0.13 RG
3 w
40 40 ${pageWidth - 80} ${pageHeight - 80} re S

% Inner border
0.85 0.65 0.13 RG
1 w
50 50 ${pageWidth - 100} ${pageHeight - 100} re S

% Corner decorations
0.85 0.65 0.13 rg
40 40 20 20 re f
${pageWidth - 60} 40 20 20 re f
40 ${pageHeight - 60} 20 20 re f
${pageWidth - 60} ${pageHeight - 60} 20 20 re f

% Header text - EDAN
BT
/F1 42 Tf
0.85 0.65 0.13 rg
280 520 Td
(EDAN) Tj
ET

% Certificate title
BT
/F1 28 Tf
1 1 1 rg
260 460 Td
(CERTIFICADO) Tj
ET

% Subtitle
BT
/F2 14 Tf
0.8 0.8 0.8 rg
285 430 Td
(de Culminacion) Tj
ET

% "Otorgado a" text
BT
/F2 12 Tf
0.7 0.7 0.7 rg
375 380 Td
(Otorgado a:) Tj
ET

% Student name
BT
/F1 24 Tf
1 1 1 rg
${421 - (studentName.length * 6)} 345 Td
(${studentName}) Tj
ET

% Line under name
0.85 0.65 0.13 RG
2 w
200 335 m
642 335 l
S

% Course description
BT
/F2 12 Tf
0.8 0.8 0.8 rg
280 300 Td
(Por completar exitosamente el curso:) Tj
ET

% Course title
BT
/F1 18 Tf
0.85 0.65 0.13 rg
${421 - (courseTitle.length * 4.5)} 270 Td
(${courseTitle}) Tj
ET

% Grade if available
BT
/F2 14 Tf
1 1 1 rg
370 235 Td
(${gradeText}) Tj
ET

% Date
BT
/F2 11 Tf
0.7 0.7 0.7 rg
350 180 Td
(Fecha de emision: ${issuedDate}) Tj
ET

% Certificate code
BT
/F2 10 Tf
0.6 0.6 0.6 rg
340 155 Td
(Codigo de verificacion: ${certificateCode}) Tj
ET

% Footer
BT
/F2 9 Tf
0.5 0.5 0.5 rg
320 80 Td
(Este certificado es valido y verificable en linea) Tj
ET

Q
endstream
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000332 00000 n 
0000000230 00000 n 
0000000297 00000 n 

trailer
<< /Size 7 /Root 1 0 R >>
startxref
1885
%%EOF`;

  return content.trim();
}

serve(async (req) => {
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

    const { certificateId, action } = await req.json();
    
    console.log('Request received:', { certificateId, action });

    if (action === 'generate') {
      // Generate new certificate for completed course
      const { courseId, userId, grade } = await req.json().catch(() => ({})) || {};
      
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

      console.log('Generating PDF for:', certificate);

      // Format date
      const issuedDate = new Date(certificate.issued_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Generate PDF
      const pdfContent = generatePDFContent(
        certificate.student_name,
        certificate.course_title,
        certificate.certificate_code,
        issuedDate,
        certificate.grade
      );

      // Return PDF
      return new Response(pdfContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="certificado-${certificate.certificate_code}.pdf"`,
        },
      });
    }

    if (action === 'verify') {
      const { code } = await req.json().catch(() => ({})) || {};
      
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
    console.error('Error in generate-certificate:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
