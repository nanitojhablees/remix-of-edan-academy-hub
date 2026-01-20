import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptRequest {
  paymentId: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { paymentId, userName }: ReceiptRequest = await req.json();

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "Payment ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Generating receipt for payment: ${paymentId}`);

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select(`
        *,
        plan:payment_plans(name, duration_months, description)
      `)
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", paymentError);
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user profile if not provided
    let customerName = userName;
    if (!customerName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", payment.user_id)
        .single();
      
      if (profile) {
        customerName = `${profile.first_name} ${profile.last_name}`;
      }
    }

    // Format date
    const paymentDate = new Date(payment.created_at);
    const formattedDate = paymentDate.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Generate HTML receipt
    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recibo de Pago - EDAN Latinoamérica</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f8f9fa;
    }
    .receipt {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0891b2;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #0891b2;
    }
    .receipt-title {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .section-value {
      font-size: 16px;
      color: #333;
    }
    .amount-section {
      background: linear-gradient(135deg, #0891b2 0%, #0066cc 100%);
      color: white;
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
    .amount {
      font-size: 36px;
      font-weight: bold;
    }
    .amount-label {
      font-size: 14px;
      opacity: 0.9;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-completed {
      background: #d4edda;
      color: #155724;
    }
    .status-pending {
      background: #fff3cd;
      color: #856404;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #888;
      font-size: 12px;
    }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">EDAN Latinoamérica</div>
      <div class="receipt-title">Recibo de Pago</div>
    </div>
    
    <div class="details-grid">
      <div class="section">
        <div class="section-title">Número de Transacción</div>
        <div class="section-value">${payment.transaction_id || payment.id.substring(0, 8).toUpperCase()}</div>
      </div>
      <div class="section">
        <div class="section-title">Fecha de Pago</div>
        <div class="section-value">${formattedDate}</div>
      </div>
      <div class="section">
        <div class="section-title">Cliente</div>
        <div class="section-value">${customerName || "N/A"}</div>
      </div>
      <div class="section">
        <div class="section-title">Estado</div>
        <div class="section-value">
          <span class="status status-${payment.status}">${
            payment.status === "completed" ? "Completado" : 
            payment.status === "pending" ? "Pendiente" : payment.status
          }</span>
        </div>
      </div>
    </div>
    
    <div class="amount-section">
      <div class="amount-label">Monto Pagado</div>
      <div class="amount">${payment.currency} ${Number(payment.amount).toFixed(2)}</div>
    </div>
    
    <div class="section">
      <div class="section-title">Plan Adquirido</div>
      <div class="section-value">${payment.plan?.name || "Membresía EDAN"}</div>
    </div>
    
    ${payment.plan?.duration_months ? `
    <div class="section">
      <div class="section-title">Duración</div>
      <div class="section-value">${payment.plan.duration_months} ${payment.plan.duration_months === 1 ? "mes" : "meses"}</div>
    </div>
    ` : ""}
    
    ${payment.payment_method ? `
    <div class="section">
      <div class="section-title">Método de Pago</div>
      <div class="section-value">${
        payment.payment_method === "card" ? "Tarjeta de Crédito/Débito" :
        payment.payment_method === "manual" ? "Pago Manual" : payment.payment_method
      }</div>
    </div>
    ` : ""}
    
    ${payment.promo_code ? `
    <div class="section">
      <div class="section-title">Código Promocional</div>
      <div class="section-value">${payment.promo_code}</div>
    </div>
    ` : ""}
    
    <div class="footer">
      <p>EDAN Latinoamérica - Educación Dental de Alto Nivel</p>
      <p>Este documento es un comprobante de pago válido.</p>
      <p>Generado el ${new Date().toLocaleDateString("es-ES")}</p>
    </div>
  </div>
</body>
</html>
    `;

    // For now, return the HTML as a data URL that can be opened/printed
    // In production, you would use a PDF library like puppeteer or a PDF API
    const base64Html = btoa(unescape(encodeURIComponent(receiptHtml)));
    const dataUrl = `data:text/html;base64,${base64Html}`;

    console.log(`Receipt generated successfully for payment: ${paymentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: dataUrl,
        transactionId: payment.transaction_id || payment.id.substring(0, 8).toUpperCase(),
        html: receiptHtml,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error generating receipt:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate receipt";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
