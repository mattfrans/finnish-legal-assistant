import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface PresetCategory {
  title: string;
  description: string;
  presets: Preset[];
}

interface Preset {
  id: string;
  title: string;
  description: string;
  initialPrompt: string;
}

const presetCategories: PresetCategory[] = [
  {
    title: "Consumer Rights",
    description: "Common consumer protection scenarios and rights",
    presets: [
      {
        id: "consumer-return",
        title: "Product Returns",
        description: "Understanding your rights for product returns and refunds",
        initialPrompt: "What are my rights regarding product returns and refunds under Finnish consumer protection law?"
      },
      {
        id: "consumer-warranty",
        title: "Warranty Claims",
        description: "Handling warranty issues and consumer rights",
        initialPrompt: "Can you explain the warranty rights under Finnish consumer protection laws?"
      }
    ]
  },
  {
    title: "Business Law",
    description: "Legal templates and guidance for businesses",
    presets: [
      {
        id: "business-contract",
        title: "Service Agreements",
        description: "Basic service agreement templates and requirements",
        initialPrompt: "What are the essential elements required in a service agreement under Finnish law?"
      },
      {
        id: "business-terms",
        title: "Terms of Service",
        description: "Template for website terms of service",
        initialPrompt: "What must be included in terms of service for a Finnish business website?"
      }
    ]
  }
];

export function LegalPresetsPage() {
  const [, setLocation] = useLocation();

  const startPresetChat = (preset: Preset) => {
    // Create a new chat with the preset prompt
    fetch("/api/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title: preset.title,
        initialPrompt: preset.initialPrompt 
      })
    })
      .then(res => res.json())
      .then(data => {
        setLocation(`/chat/${data.id}`);
      })
      .catch(error => {
        console.error("Error starting preset chat:", error);
      });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Legal Document Presets</h1>
      <p className="text-muted-foreground mb-8">
        Choose from our collection of pre-configured legal scenarios and document templates.
      </p>

      <div className="grid gap-8">
        {presetCategories.map((category, index) => (
          <section key={index}>
            <h2 className="text-2xl font-semibold mb-4">{category.title}</h2>
            <p className="text-muted-foreground mb-4">{category.description}</p>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.presets.map((preset) => (
                <motion.div
                  key={preset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6 h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start gap-4 mb-4">
                      <FileText className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-semibold">{preset.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {preset.description}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => startPresetChat(preset)}
                      className="mt-auto self-start gap-2"
                    >
                      Start Chat
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
