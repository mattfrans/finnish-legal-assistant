import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Stack,
  Heading,
  Text,
  List,
  ListItem,
  ListIcon,
  useToast,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface Plan {
  id: string;
  priceId: string;
  name: string;
  description: string;
  priceEur: number;
  features: string[];
}

export const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(false);
  const toast = useToast();

  React.useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/v1/subscription-plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error',
        description: 'Could not load subscription plans',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubscribe = async (priceId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Could not process subscription',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={8} direction={{ base: 'column', lg: 'row' }} align="center" justify="center" py={12}>
      {plans.map((plan) => (
        <Card key={plan.id} maxW="sm" w="full">
          <CardHeader>
            <Heading size="md">{plan.name}</Heading>
            <Text pt="2" fontSize="sm" color="gray.500">
              {plan.description}
            </Text>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <Text fontSize="3xl" fontWeight="bold">
                €{plan.priceEur.toFixed(2)}/kk
              </Text>
              <List spacing={3}>
                {plan.features.map((feature, index) => (
                  <ListItem key={index}>
                    <ListIcon as={CheckIcon} color="green.500" />
                    {feature}
                  </ListItem>
                ))}
              </List>
            </Stack>
          </CardBody>
          <CardFooter>
            <Button
              colorScheme="blue"
              width="full"
              onClick={() => handleSubscribe(plan.priceId)}
              isLoading={loading}
            >
              Tilaa nyt
            </Button>
          </CardFooter>
        </Card>
      ))}
    </Stack>
  );
};
