import { useState } from "react";
import { motion } from "framer-motion";
import { SubscriptionDialog } from "@/components/payment/SubscriptionDialog";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: "€0",
    description: "For individuals getting started with legal research",
    features: [
      "5 legal queries per month",
      "Basic legal document analysis",
      "Standard response time",
      "Community support",
    ],
    buttonText: "Get Started",
  },
  {
    name: "Professional",
    price: "€49",
    description: "For legal professionals and small practices",
    features: [
      "Unlimited legal queries",
      "Advanced document analysis",
      "Priority response time",
      "Email support",
      "Export functionality",
      "Custom templates",
    ],
    highlighted: true,
    buttonText: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with specific needs",
    features: [
      "Everything in Professional",
      "API access",
      "Dedicated support",
      "Custom integration",
      "Advanced analytics",
      "Training sessions",
      "SLA guarantee",
    ],
    buttonText: "Contact Sales",
  },
];

const featureComparison = [
  {
    feature: "Monthly Queries",
    free: "5 queries",
    professional: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Document Analysis",
    free: "Basic",
    professional: "Advanced",
    enterprise: "Advanced + Custom",
  },
  {
    feature: "Response Time",
    free: "Standard",
    professional: "Priority",
    enterprise: "Dedicated",
  },
  {
    feature: "Support",
    free: "Community",
    professional: "Email",
    enterprise: "Dedicated Team",
  },
  {
    feature: "Export Options",
    free: "None",
    professional: "PDF, Word",
    enterprise: "All Formats",
  },
];

export function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PricingTier | null>(null);
  return (
    <div className="min-h-screen bg-background">
      <div className="py-24 px-4 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose the perfect plan for your legal research needs
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 mb-24">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative h-full p-8 ${
                  tier.highlighted
                    ? "border-primary shadow-lg scale-105"
                    : "border-border"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">{tier.name}</h2>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.price !== "Custom" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSelectedPlan(tier)}
                >
                  {tier.buttonText}
                </Button>

                {selectedPlan && (
                  <SubscriptionDialog
                    isOpen={true}
                    onClose={() => setSelectedPlan(null)}
                    plan={{
                      name: selectedPlan.name,
                      price: parseFloat(selectedPlan.price.replace('€', '')) || 0,
                      features: selectedPlan.features,
                    }}
                  />
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Feature</TableHead>
                <TableHead>Free</TableHead>
                <TableHead>Professional</TableHead>
                <TableHead>Enterprise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureComparison.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="font-medium">{row.feature}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {row.free === "None" ? (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                      <span>{row.free}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{row.professional}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{row.enterprise}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
