import { Link, useLocation } from "wouter";
import { MessageSquare, History, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();

  const mainLinks = [
    { 
      href: "/", 
      icon: MessageSquare, 
      label: "Chat",
    },
    { 
      href: "/history", 
      icon: History, 
      label: "History"
    },
    { 
      href: "/legal", 
      icon: FileText, 
      label: "Legal Documents"
    },
  ];

  return (
    <aside className="w-64 border-r bg-muted/30 p-4 flex-shrink-0 flex flex-col">
      <nav className="space-y-2">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || 
            (link.subItems?.some(item => location === item.href));

          return (
            <div key={link.href} className="space-y-1">
              <Link href={link.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isActive && "bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
              
              {link.subItems?.map((subItem) => (
                <Link key={subItem.href} href={subItem.href}>
                  <Button
                    variant={location === subItem.href ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 pl-8",
                      location === subItem.href && "bg-secondary"
                    )}
                  >
                    <subItem.icon className="h-4 w-4" />
                    {subItem.label}
                  </Button>
                </Link>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
