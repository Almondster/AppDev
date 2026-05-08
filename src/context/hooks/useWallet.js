import { useState, useCallback } from 'react';

export const useWallet = () => {
  const [balance, setBalance] = useState(150.00);
  const [amount, setAmount] = useState('');

  const handleWithdraw = useCallback((e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (numAmount > balance) {
      alert('Insufficient funds');
      return;
    }
    setBalance(prev => prev - numAmount);
    setAmount('');
    alert(`Successfully withdrew ₱${numAmount.toFixed(2)}`);
  }, [amount, balance]);

  const handleDeposit = useCallback((e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    setBalance(prev => prev + numAmount);
    setAmount('');
    alert(`Successfully deposited ₱${numAmount.toFixed(2)}`);
  }, [amount]);

  return {
    balance,
    amount,
    setAmount,
    handleWithdraw,
    handleDeposit,
  };
};
