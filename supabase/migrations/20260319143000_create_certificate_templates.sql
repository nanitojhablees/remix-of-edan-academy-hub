-- Create certificate_templates table
create table public.certificate_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  template_data jsonb not null,
  background_image text,
  is_default boolean default false,
  created_by uuid references auth.users(id),
  colors_config jsonb,
  fonts_config jsonb,
  layout_config jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.certificate_templates enable row level security;

-- Create policies
create policy "Anyone can view templates" on public.certificate_templates
  for select using (true);

create policy "Admins can manage templates" on public.certificate_templates
  for all using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Create index
create index idx_certificate_templates_default on public.certificate_templates(is_default);
create index idx_certificate_templates_created_by on public.certificate_templates(created_by);

-- Insert default templates
insert into public.certificate_templates (name, description, template_data, is_default, colors_config, fonts_config, layout_config) values
('Clásico Académico', 'Estilo universitario formal con bordes decorativos', 
  '{
    "type": "academic",
    "elements": [
      {"type": "header", "content": "EDAN", "x": 280, "y": 520, "fontSize": 42, "font": "Helvetica-Bold", "color": "#D9A521"},
      {"type": "title", "content": "CERTIFICADO", "x": 260, "y": 460, "fontSize": 28, "font": "Helvetica-Bold", "color": "#FFFFFF"},
      {"type": "subtitle", "content": "de Culminacion", "x": 285, "y": 430, "fontSize": 14, "font": "Helvetica", "color": "#CCCCCC"},
      {"type": "awardText", "content": "Otorgado a:", "x": 375, "y": 380, "fontSize": 12, "font": "Helvetica", "color": "#B3B3B3"},
      {"type": "studentName", "content": "{{studentName}}", "x": 421, "y": 345, "fontSize": 24, "font": "Helvetica-Bold", "color": "#FFFFFF"},
      {"type": "courseText", "content": "Por completar exitosamente el curso:", "x": 280, "y": 300, "fontSize": 12, "font": "Helvetica", "color": "#CCCCCC"},
      {"type": "courseTitle", "content": "{{courseTitle}}", "x": 421, "y": 270, "fontSize": 18, "font": "Helvetica-Bold", "color": "#D9A521"},
      {"type": "gradeText", "content": "{{gradeText}}", "x": 370, "y": 235, "fontSize": 14, "font": "Helvetica", "color": "#FFFFFF"},
      {"type": "dateText", "content": "Fecha de emision: {{issuedDate}}", "x": 350, "y": 180, "fontSize": 11, "font": "Helvetica", "color": "#B3B3B3"},
      {"type": "codeText", "content": "Codigo de verificacion: {{certificateCode}}", "x": 340, "y": 155, "fontSize": 10, "font": "Helvetica", "color": "#999999"},
      {"type": "footerText", "content": "Este certificado es valido y verificable en linea", "x": 320, "y": 80, "fontSize": 9, "font": "Helvetica", "color": "#808080"}
    ]
  }',
  true,
  '{
    "background": "#0D2659",
    "border": "#D9A521",
    "textPrimary": "#FFFFFF",
    "textSecondary": "#D9A521",
    "textMuted": "#B3B3B3"
  }',
  '{
    "header": "Helvetica-Bold",
    "title": "Helvetica-Bold",
    "body": "Helvetica"
  }',
  '{
    "orientation": "landscape",
    "pageWidth": 842,
    "pageHeight": 595,
    "margins": {"top": 40, "right": 40, "bottom": 40, "left": 40}
  }'
);

insert into public.certificate_templates (name, description, template_data, is_default, colors_config, fonts_config, layout_config) values
('Moderno Minimalista', 'Diseño limpio y profesional con enfoque minimalista',
  '{
    "type": "minimal",
    "elements": [
      {"type": "header", "content": "EDAN", "x": 400, "y": 500, "fontSize": 36, "font": "Helvetica-Bold", "color": "#2563EB"},
      {"type": "title", "content": "CERTIFICADO", "x": 350, "y": 450, "fontSize": 24, "font": "Helvetica-Bold", "color": "#1F2937"},
      {"type": "awardText", "content": "Otorgado a:", "x": 380, "y": 400, "fontSize": 12, "font": "Helvetica", "color": "#6B7280"},
      {"type": "studentName", "content": "{{studentName}}", "x": 421, "y": 370, "fontSize": 20, "font": "Helvetica-Bold", "color": "#1F2937"},
      {"type": "courseText", "content": "Por completar el curso:", "x": 360, "y": 320, "fontSize": 12, "font": "Helvetica", "color": "#6B7280"},
      {"type": "courseTitle", "content": "{{courseTitle}}", "x": 421, "y": 290, "fontSize": 16, "font": "Helvetica-Bold", "color": "#2563EB"},
      {"type": "gradeText", "content": "{{gradeText}}", "x": 390, "y": 250, "fontSize": 12, "font": "Helvetica", "color": "#1F2937"},
      {"type": "dateText", "content": "Fecha: {{issuedDate}}", "x": 380, "y": 210, "fontSize": 10, "font": "Helvetica", "color": "#6B7280"},
      {"type": "codeText", "content": "ID: {{certificateCode}}", "x": 370, "y": 180, "fontSize": 9, "font": "Helvetica", "color": "#9CA3AF"},
      {"type": "signatureLine", "content": "_________________", "x": 380, "y": 120, "fontSize": 14, "font": "Helvetica", "color": "#1F2937"}
    ]
  }',
  false,
  '{
    "background": "#FFFFFF",
    "border": "#E5E7EB",
    "textPrimary": "#1F2937",
    "textSecondary": "#2563EB",
    "textMuted": "#6B7280"
  }',
  '{
    "header": "Helvetica-Bold",
    "title": "Helvetica-Bold",
    "body": "Helvetica"
  }',
  '{
    "orientation": "landscape",
    "pageWidth": 842,
    "pageHeight": 595,
    "margins": {"top": 60, "right": 60, "bottom": 60, "left": 60}
  }'
);