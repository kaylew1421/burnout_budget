import { useMemoryStore } from './useStore';
import { transactionStore } from '../store/transaction.store';
export function useTransactions(){ return useMemoryStore(transactionStore); }
