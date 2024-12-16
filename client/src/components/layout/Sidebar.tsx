import { Link, useLocation } from "wouter";
import { MessageSquare, History, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();

  const mainLinks = [
    { href: "/", icon: MessageSquare, label: "Chat" },
    { href: "/history", icon: History, label: "History" },
  ];

  return (
    <aside className="w-64 border-r bg-muted/30 p-4 flex-shrink-0 flex flex-col">
      <nav className="space-y-2">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Button
                variant={location === link.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  location === link.href && "bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-4 pt-4 border-t">
        <Link href="/presets">
          <Button
            variant={location === "/presets" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2",
              location === "/presets" && "bg-secondary"
            )}
          >
            <FileText className="h-4 w-4" />
            Legal Documents
          </Button>
        </Link>
      </div>
    </aside>
  );
}
