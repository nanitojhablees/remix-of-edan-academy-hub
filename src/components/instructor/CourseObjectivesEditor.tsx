import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Target, BookOpen, Users } from "lucide-react";

interface ObjectivesEditorProps {
  objectives: string[];
  requirements: string[];
  targetAudience: string;
  onObjectivesChange: (v: string[]) => void;
  onRequirementsChange: (v: string[]) => void;
  onTargetAudienceChange: (v: string) => void;
}

function BulletList({
  label,
  icon: Icon,
  items,
  placeholder,
  onChange,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
  placeholder: string;
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setDraft("");
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addItem(); }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </Label>
      
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 group">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border text-sm">
              <span className="text-primary font-medium text-xs">✓</span>
              <span className="flex-1">{item}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
              onClick={() => removeItem(idx)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={addItem} disabled={!draft.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function CourseObjectivesEditor({
  objectives,
  requirements,
  targetAudience,
  onObjectivesChange,
  onRequirementsChange,
  onTargetAudienceChange,
}: ObjectivesEditorProps) {
  return (
    <div className="space-y-8">
      <BulletList
        label="¿Qué aprenderá el estudiante?"
        icon={Target}
        items={objectives}
        placeholder="Ej: Entenderás los fundamentos de React"
        onChange={onObjectivesChange}
      />

      <BulletList
        label="Requisitos previos"
        icon={BookOpen}
        items={requirements}
        placeholder="Ej: Conocimientos básicos de JavaScript"
        onChange={onRequirementsChange}
      />

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-primary" />
          ¿A quién va dirigido?
        </Label>
        <Textarea
          value={targetAudience}
          onChange={e => onTargetAudienceChange(e.target.value)}
          placeholder="Ej: Desarrolladores web que quieren aprender tecnologías modernas..."
          rows={3}
          className="text-sm"
        />
      </div>
    </div>
  );
}
