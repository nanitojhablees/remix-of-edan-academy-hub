import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Search, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CertificatesManagement() {
  const [search, setSearch] = useState("");

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("issued_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["certificate-stats"],
    queryFn: async () => {
      const { data, count } = await supabase
        .from("certificates")
        .select("*", { count: "exact" });

      const thisMonth = data?.filter(c => {
        const date = new Date(c.issued_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length || 0;

      const avgGrade = data?.reduce((acc, c) => acc + (c.grade || 0), 0) / (data?.length || 1);

      return {
        total: count || 0,
        thisMonth,
        avgGrade: Math.round(avgGrade * 10) / 10,
      };
    },
  });

  const filteredCertificates = certificates?.filter(cert =>
    cert.student_name.toLowerCase().includes(search.toLowerCase()) ||
    cert.course_title.toLowerCase().includes(search.toLowerCase()) ||
    cert.certificate_code.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = async (certificateCode: string) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate?code=${certificateCode}&action=download`;
    window.open(url, "_blank");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestión de Certificados</h1>
        <p className="text-muted-foreground">Administra todos los certificados emitidos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total Certificados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">{stats?.thisMonth || 0}</p>
              <p className="text-sm text-muted-foreground">Este Mes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary">{stats?.avgGrade || 0}%</p>
              <p className="text-sm text-muted-foreground">Calificación Promedio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, curso o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certificados ({filteredCertificates?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Fecha Emisión</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates?.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {cert.certificate_code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{cert.student_name}</TableCell>
                      <TableCell>{cert.course_title}</TableCell>
                      <TableCell>
                        <Badge variant={cert.grade && cert.grade >= 80 ? "default" : "secondary"}>
                          {cert.grade ? `${cert.grade}%` : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(cert.issued_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(cert.certificate_code)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const url = `${window.location.origin}/verify?code=${cert.certificate_code}`;
                              window.open(url, "_blank");
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
