import { useState } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Smartphone, 
  CreditCard, 
  Receipt, 
  Building
} from "lucide-react";

interface PaymentMethodSelectorProps {
  amount: number;
  planName: string;
  onPaymentComplete: (success: boolean) => void;
}

const FINNISH_BANKS = [
  { id: "nordea", name: "Nordea" },
  { id: "op", name: "OP" },
  { id: "danske", name: "Danske Bank" },
  { id: "saastopankki", name: "Säästöpankki" },
  { id: "pop", name: "POP Pankki" },
  { id: "spankki", name: "S-Pankki" },
  { id: "aktia", name: "Aktia" },
  { id: "handelsbanken", name: "Handelsbanken" },
  { id: "alandsbanken", name: "Ålandsbanken" },
  { id: "omasp", name: "OmaSp" },
];

export function PaymentMethodSelector({ amount, planName, onPaymentComplete }: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async (method: string) => {
    setLoading(true);
    
    try {
      // Simulate payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, always succeed
      toast({
        title: "Maksu onnistui",
        description: `Tilaus: ${planName}\nSumma: ${amount.toFixed(2)}€`,
      });
      
      onPaymentComplete(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Virhe maksun käsittelyssä",
        description: "Yritä uudelleen tai valitse toinen maksutapa.",
      });
      onPaymentComplete(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Valitse maksutapa</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Summa: {amount.toFixed(2)}€ - {planName}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {FINNISH_BANKS.map((bank) => (
            <motion.div
              key={bank.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  selectedMethod === `bank_${bank.id}` ? 'border-primary' : ''
                }`}
                onClick={() => {
                  if (!loading) {
                    setSelectedMethod(`bank_${bank.id}`);
                    handlePayment(`bank_${bank.id}`);
                  }
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Building className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium text-center">{bank.name}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card
              className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                selectedMethod === 'mobilepay' ? 'border-primary' : ''
              }`}
              onClick={() => {
                if (!loading) {
                  setSelectedMethod('mobilepay');
                  handlePayment('mobilepay');
                }
              }}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">MobilePay</p>
                  <p className="text-sm text-muted-foreground">
                    Maksa puhelimella
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card
              className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                selectedMethod === 'card' ? 'border-primary' : ''
              }`}
              onClick={() => {
                if (!loading) {
                  setSelectedMethod('card');
                  handlePayment('card');
                }
              }}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Korttimaksu</p>
                  <p className="text-sm text-muted-foreground">
                    Visa, Mastercard
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card
              className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                selectedMethod === 'invoice' ? 'border-primary' : ''
              }`}
              onClick={() => {
                if (!loading) {
                  setSelectedMethod('invoice');
                  handlePayment('invoice');
                }
              }}
            >
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Lasku</p>
                  <p className="text-sm text-muted-foreground">
                    Maksa 14 päivän kuluessa
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 bg-background p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Käsitellään maksua...</p>
          </div>
        </div>
      )}
    </div>
  );
}
