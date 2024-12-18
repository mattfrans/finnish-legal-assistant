import { Link, useLocation } from "wouter";
import { MessageSquare, History, FileText, PanelLeftClose, PanelLeft, HelpCircle, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Panel, PanelGroup } from "react-resizable-panels";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

interface NavLink {
  href: string;
  icon: LucideIcon;
  label: string;
}

export function Sidebar() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mainLinks: NavLink[] = [
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
    {
      href: "/pricing",
      icon: CreditCard,
      label: "Pricing"
    },
    {
      href: "/help",
      icon: HelpCircle,
      label: "Help & Support"
    },
  ];

  return (
    <PanelGroup direction="horizontal">
      <Panel 
        defaultSize={20} 
        minSize={0}
        maxSize={20}
        collapsible
        collapsedSize={0}
        onCollapse={() => setIsCollapsed(true)}
        onExpand={() => setIsCollapsed(false)}
        className={cn(
          "border-r bg-muted/30 transition-all duration-300",
          isCollapsed && "w-0 border-r-0"
        )}
      >
        <div className={cn(
          "h-full transition-all duration-300 ease-in-out",
          isCollapsed ? "w-12" : "w-64"
        )}>
          <div className="flex items-center justify-end p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8"
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <nav className={cn(
            "space-y-2 p-2",
            isCollapsed && "px-1"
          )}>
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;

              return (
                <div key={link.href} className="space-y-1">
                  <Link href={link.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2",
                        isActive && "bg-secondary",
                        isCollapsed && "px-2"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span>{link.label}</span>}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>
      </Panel>
    </PanelGroup>
  );
}
