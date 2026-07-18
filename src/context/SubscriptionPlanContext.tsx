import React, { createContext, useContext, useEffect, useState } from 'react';
import { SubscriptionPlan, planService, sellerSubscriptionService, SellerSubscription } from '../services/planService';
import { useAuth } from './AuthContext';

interface PlanContextValue {
  plans: SubscriptionPlan[];
  currentPlan: SubscriptionPlan | null;
  currentSubscription: SellerSubscription | null;
  loading: boolean;
  error: string | null;
  refreshPlans: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const PlanContext = createContext<PlanContextValue>({
  plans: [],
  currentPlan: null,
  currentSubscription: null,
  loading: true,
  error: null,
  refreshPlans: async () => {},
  refreshSubscription: async () => {},
});

export const useSubscriptionPlans = () => useContext(PlanContext);

export const SubscriptionPlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<SellerSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPlans = async () => {
    try {
      const p = await planService.getAll();
      setPlans(p);
    } catch (e: any) {
      setError(e.message || 'Failed to load plans');
    }
  };

  const refreshSubscription = async () => {
    const sellerId = user?.sellerId;
    if (!sellerId) {
      setCurrentPlan(null);
      setCurrentSubscription(null);
      return;
    }
    try {
      const result = await sellerSubscriptionService.getCurrentPlan(sellerId);
      if (result) {
        setCurrentPlan(result.plan);
        setCurrentSubscription(result.subscription);
      } else {
        // No subscription yet — default to free plan
        const freePlan = await planService.getById('free');
        setCurrentPlan(freePlan);
        setCurrentSubscription(null);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load subscription');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refreshPlans();
      if (user?.sellerId) {
        await refreshSubscription();
      }
      setLoading(false);
    };
    load();
  }, [user?.sellerId]);

  return (
    <PlanContext.Provider
      value={{
        plans,
        currentPlan,
        currentSubscription,
        loading,
        error,
        refreshPlans,
        refreshSubscription,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
};

export default SubscriptionPlanProvider;
