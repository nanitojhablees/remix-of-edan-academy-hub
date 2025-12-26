import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import logoEdan from "@/assets/logo-edan.png";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoEdan} alt="EDAN" className="h-10 w-auto brightness-0 invert" />
              <span className="font-bold text-lg">EDAN Latinoamérica</span>
            </div>
            <p className="text-background/70 text-sm mb-6">
              Programa de Actualización en Evaluación de Daños y Análisis de 
              Necesidades para profesionales de gestión de emergencias.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-background/70 hover:text-background transition-colors text-sm">
                  Sobre el Programa
                </a>
              </li>
              <li>
                <a href="#levels" className="text-background/70 hover:text-background transition-colors text-sm">
                  Niveles de Formación
                </a>
              </li>
              <li>
                <a href="#benefits" className="text-background/70 hover:text-background transition-colors text-sm">
                  Beneficios
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-background/70 hover:text-background transition-colors text-sm">
                  Testimonios
                </a>
              </li>
              <li>
                <Link to="/auth" className="text-background/70 hover:text-background transition-colors text-sm">
                  Iniciar Sesión
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors text-sm">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors text-sm">
                  Política de Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors text-sm">
                  Política de Cookies
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors text-sm">
                  Política de Reembolso
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-background/70">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@edanlatinoamerica.org</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-background/70">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-background/70">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Latinoamérica y el Caribe</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center text-sm text-background/70">
          <p>
            © {new Date().getFullYear()} EDAN Latinoamérica. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}