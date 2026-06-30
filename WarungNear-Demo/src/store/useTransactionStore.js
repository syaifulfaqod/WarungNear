import { create } from 'zustand';

const useTransactionStore = create((set) => ({
  transactions: [],
  loading: false,

  setTransactions: (transactions) => set({ transactions }),
  setLoading: (loading) => set({ loading }),
  
  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions]
  }))
}));

export default useTransactionStore;
