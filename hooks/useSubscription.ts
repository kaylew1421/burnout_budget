import { useMemoryStore } from './useStore';
import { subscriptionStore } from '../store/subscription.store';
export function useSubscription(){ return useMemoryStore(subscriptionStore); }
