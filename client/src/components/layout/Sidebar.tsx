import { Link, useLocation } from "wouter";
import { MessageSquare, History, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", icon: MessageSquare, label: "Chat" },
    { href: "/history", icon: History, label: "History" },
    { href: "/presets", icon: FileText, label: "Legal Documents" },
  ];

  return (
    <aside className="w-64 border-r bg-muted/30 p-4 flex-shrink-0">
      <nav className="space-y-2">
        {links.map((link) => {
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
    </aside>
  );
}
