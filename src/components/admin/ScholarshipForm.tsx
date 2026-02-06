import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { 
  useCreateScholarship, 
  useUpdateScholarship, 
  Scholarship,
  ScholarshipFormData 
} from "@/hooks/useScholarships";

interface ScholarshipFormProps {
  scholarship?: Scholarship | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ScholarshipForm({ scholarship, onSuccess, onCancel }: ScholarshipFormProps) {
  const createScholarship = useCreateScholarship();
  const updateScholarship = useUpdateScholarship();
  
  const [formData, setFormData] = useState<ScholarshipFormData>({
    name: "",
    description: "",
    type: "full",
    discount_percent: 50,
    discount_amount: 100,
    duration_months: 12,
    max_recipients: undefined,
    requirements: "",
    is_active: true,
  });

  useEffect(() => {
    if (scholarship) {
      setFormData({
        name: scholarship.name,
        description: scholarship.description || "",
        type: scholarship.type,
        discount_percent: scholarship.discount_percent || 50,
        discount_amount: scholarship.discount_amount || 100,
        duration_months: scholarship.duration_months,
        max_recipients: scholarship.max_recipients || undefined,
        requirements: scholarship.requirements || "",
        is_active: scholarship.is_active,
      });
    }
  }, [scholarship]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (scholarship) {
      await updateScholarship.mutateAsync({ id: scholarship.id, data: formData });
    } else {
      await createScholarship.mutateAsync(formData);
    }
    
    onSuccess();
  };

  const isLoading = createScholarship.isPending || updateScholarship.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la Beca *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Beca de Excelencia Académica"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción detallada de la beca..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Descuento *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: "full" | "partial" | "fixed") => 
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">100% (Completa)</SelectItem>
              <SelectItem value="partial">Porcentaje</SelectItem>
              <SelectItem value="fixed">Monto Fijo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.type === "partial" && (
          <div className="space-y-2">
            <Label htmlFor="discount_percent">Porcentaje de Descuento</Label>
            <div className="relative">
              <Input
                id="discount_percent"
                type="number"
                min="1"
                max="99"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  discount_percent: parseInt(e.target.value) || 0 
                })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>
        )}

        {formData.type === "fixed" && (
          <div className="space-y-2">
            <Label htmlFor="discount_amount">Monto de Descuento</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="discount_amount"
                type="number"
                min="1"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  discount_amount: parseFloat(e.target.value) || 0 
                })}
                className="pl-8"
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_months">Duración (meses) *</Label>
          <Input
            id="duration_months"
            type="number"
            min="1"
            max="60"
            value={formData.duration_months}
            onChange={(e) => setFormData({ 
              ...formData, 
              duration_months: parseInt(e.target.value) || 1 
            })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_recipients">Máx. Beneficiarios</Label>
          <Input
            id="max_recipients"
            type="number"
            min="1"
            value={formData.max_recipients || ""}
            onChange={(e) => setFormData({ 
              ...formData, 
              max_recipients: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            placeholder="Sin límite"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Requisitos</Label>
        <Textarea
          id="requirements"
          value={formData.requirements}
          onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          placeholder="Requisitos para aplicar a esta beca..."
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label>Estado Activo</Label>
          <p className="text-sm text-muted-foreground">
            Permitir asignar esta beca a nuevos estudiantes
          </p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {scholarship ? "Guardar Cambios" : "Crear Beca"}
        </Button>
      </div>
    </form>
  );
}
