import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface SubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: number;
    features: string[];
  };
}

export function SubscriptionDialog({ isOpen, onClose, plan }: SubscriptionDialogProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handlePaymentComplete = async (success: boolean) => {
    if (success) {
      // In a real implementation, this would create a subscription record
      // and handle payment confirmation
      
      // Simulate API call to create subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Tilaus aktivoitu",
        description: "Tervetuloa Premium-jäseneksi!",
      });
      
      onClose();
      setLocation("/"); // Redirect to home for now since dashboard isn't implemented
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tilaa {plan.name}</DialogTitle>
          <DialogDescription>
            Valitse haluamasi maksutapa jatkaaksesi.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <PaymentMethodSelector
            amount={plan.price}
            planName={plan.name}
            onPaymentComplete={handlePaymentComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
