import React, { useState, useEffect, useMemo } from 'react';
import axios from '@/lib/axios';

const HistoryTab = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/wallet/transactions');
      const data = response.data;

      if (!data) {
        throw new Error('No data received from server');
      }

      if (data.success && Array.isArray(data.data)) {
        setTransactions(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch transaction data');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and interval setup
  useEffect(() => {
    fetchTransactions();

    // Refresh transaction data every 30 seconds
    const intervalId = setInterval(fetchTransactions, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Listen for balance update messages from other components
  useEffect(() => {
    const handleBalanceUpdateMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BALANCE_UPDATE_TRIGGER') {
        fetchTransactions();
      }
    };

    window.addEventListener('message', handleBalanceUpdateMessage);
    return () => window.removeEventListener('message', handleBalanceUpdateMessage);
  }, []);

  if (loading && transactions.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center p-8 text-primary-400'>
        <p>Loading transaction history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center p-8 text-red-400'>
        <p>{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center p-8 text-primary-400'>
        <p>No transaction history found</p>
      </div>
    );
  }

  return (
    <div className='overflow-y-auto w-full max-h-[calc(100vh-26rem)] scrollbar-thin scrollbar-thumb-primary-400 scrollbar-track-primary-800/50 hover:scrollbar-thumb-primary-300 transition-colors'>
      <div className='space-y-3'>
        {transactions.map((transaction, index) => (
          <TransactionItem key={index} transaction={transaction} />
        ))}
      </div>
    </div>
  );
};
const TransactionItem = React.memo(({ transaction }: { transaction: any }) => {
  const isPositive = transaction.side === 'receipt' || transaction.side === 'buy';
  // Enhanced number formatting with proper precision
  const tokenAmount = useMemo(() => {
    // For transfer transactions, use in_amount instead of out_amount
    if (transaction.side === 'transfer') {
      const amount = Number(transaction.in_amount) / Math.pow(10, 18); // SONIC uses 18 decimals
      return amount < 0.001
        ? amount.toFixed(6)
        : amount < 1
        ? amount.toFixed(4)
        : amount.toLocaleString(undefined, {
            maximumFractionDigits: 4,
            minimumFractionDigits: 2,
          });
    }

    // For other transaction types, use out_amount with token decimals
    const amount = Number(transaction.out_amount / Math.pow(10, transaction.token?.decimals));
    return amount < 0.001
      ? amount.toFixed(6)
      : amount < 1
      ? amount.toFixed(4)
      : amount.toLocaleString(undefined, {
          maximumFractionDigits: 4,
          minimumFractionDigits: 2,
        });
  }, [transaction.side, transaction.in_amount, transaction.out_amount, transaction.token?.decimals]);

  // Format USD value with proper currency formatting
  const usdValue = useMemo(() => {
    const value = Number(transaction.out_value_in_usd);
    return value < 0.01
      ? value.toFixed(6)
      : value < 1000
      ? value.toLocaleString(undefined, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })
      : value.toLocaleString(undefined, {
          maximumFractionDigits: 2,
          notation: 'compact',
          compactDisplay: 'short',
        });
  }, [transaction.out_value_in_usd]);

  return (
    <div className='flex flex-col p-4 rounded-lg transition-all border border-primary-600/40 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-900/20 backdrop-blur-sm'>
      <div className='flex items-center gap-3'>
        <div className='border border-white/15 rounded-full p-1.5 bg-primary-800/40 shadow-inner'>
          {transaction.side === 'transfer' ? (
            <div className='w-8 h-8 rounded-full bg-primary-900/80 flex items-center justify-center'>
              <img src='sonic.webp' alt='Sonic' className='w-4 h-4' />
            </div>
          ) : (
            <img src={transaction.token?.logo || '/default-token.png'} alt={transaction.token?.symbol || 'SONIC'} className='w-8 h-8 rounded-full' loading='lazy' />
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex justify-between items-center'>
            <p className={`font-bold text-sm truncate uppercase px-2 py-0.5 rounded-md ${transaction.side === 'transfer' ? 'bg-blue-500/10 text-blue-400' : isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{transaction.side}</p>
            <p className={`font-bold text-sm ml-1 ${transaction.side === 'transfer' ? 'text-blue-400' : isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {transaction.side === 'transfer' ? '' : isPositive ? '+' : '-'}
              {tokenAmount} {transaction.side === 'transfer' ? 'SONIC' : transaction.token?.symbol}
            </p>
          </div>
          <div className='flex justify-between text-xs text-primary-300 mt-1'>
            <span className='truncate font-medium'>
              {transaction.side === 'transfer'
                ? 'Transfer to ' + (transaction.data_swap?.to_address ? `${transaction.data_swap.to_address.slice(0, 6)}...${transaction.data_swap.to_address.slice(-4)}` : 'Unknown')
                : `${transaction?.token?.name || ''} ${transaction.token?.symbol || ''}`}
            </span>
            <span className='ml-1 truncate font-medium bg-primary-800/40 px-2 py-0.5 rounded-md'>~ ${transaction.side === 'transfer' ? (Number(transaction.in_amount) / Math.pow(10, 18)).toFixed(2) : usdValue}</span>
          </div>
        </div>
      </div>
      {transaction.side === 'transfer' ? <TransferTransaction transaction={transaction} /> : <TransactionDetails transaction={transaction} type={transaction.side} />}
    </div>
  );
});
// Generic Transaction component that can handle both buy and sell transactions
const TransactionDetails = React.memo(({ transaction, type }: { transaction: any; type: 'buy' | 'sell' }) => {
  // Determine values based on transaction type
  const isBuy = type === 'buy';

  // Format token amount with intelligent precision
  const amount = useMemo(() => {
    const rawAmount = isBuy ? transaction.in_amount : transaction.out_amount;
    const decimals = transaction.token?.decimals || 18;
    const value = Number(rawAmount) / Math.pow(10, decimals);

    // Handle invalid values
    if (isNaN(value) || value === undefined) return '0';

    // Adaptive formatting based on value size
    if (value === 0) return '0';
    if (value < 0.0001) return value.toExponential(4);
    if (value < 0.01) return value.toFixed(6);
    if (value < 1) return value.toFixed(4);
    if (value < 10000) {
      return value.toLocaleString(undefined, {
        maximumFractionDigits: 4,
        minimumFractionDigits: 2,
      });
    }
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
      notation: 'compact',
      compactDisplay: 'short',
    });
  }, [isBuy, transaction.in_amount, transaction.out_amount, transaction.token?.decimals]);

  // Calculate and format exchange rate with adaptive precision
  const rate = useMemo(() => {
    const numerator = isBuy ? transaction.in_value_in_usd : transaction.out_value_in_usd;
    const denominator = Number(transaction.out_amount) / Math.pow(10, transaction.token?.decimals || 18);

    // Prevent division by zero or invalid values
    if (!denominator || isNaN(denominator) || !numerator || isNaN(numerator)) return '0';

    const value = Number(numerator) / denominator;

    // Handle invalid calculation result
    if (isNaN(value)) return '0';

    // Format based on value magnitude
    if (value < 0.0001) return value.toExponential(4);
    if (value < 0.01) return value.toFixed(6);
    if (value < 1) return value.toFixed(4);
    if (value < 1000) return value.toFixed(2);
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
      notation: 'compact',
      compactDisplay: 'short',
    });
  }, [isBuy, transaction.in_value_in_usd, transaction.out_value_in_usd, transaction.out_amount, transaction.token?.decimals]);

  // Format USD value with appropriate precision
  const usdValue = useMemo(() => {
    const value = Number(isBuy ? transaction.in_value_in_usd : transaction.out_value_in_usd);

    // Handle invalid values
    if (isNaN(value) || value === undefined) return '0';

    if (value < 0.01) return value.toFixed(4);
    if (value < 1) return value.toFixed(3);
    if (value < 1000) return value.toFixed(2);
    if (value < 1000000) {
      return value.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
    }
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
      notation: 'compact',
      compactDisplay: 'short',
    });
  }, [isBuy, transaction.in_value_in_usd, transaction.out_value_in_usd]);

  // Create shortened transaction hash for display
  const txShort = useMemo(() => `${transaction.txs.slice(0, 6)}...${transaction.txs.slice(-4)}`, [transaction.txs]);

  // Format time with optimized display
  const formattedDate = useMemo(
    () =>
      new Date(transaction.created_at).toLocaleString(undefined, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZoneName: 'short',
      }),
    [transaction.created_at]
  );

  // Format date separately for better UI organization
  const formattedLocalDate = useMemo(() => new Date(transaction.created_at).toLocaleDateString(), [transaction.created_at]);

  return (
    <div className='mt-3 text-xs space-y-2 border-t border-primary-600/50 pt-3'>
      {/* Transaction Details Card */}
      <div className='flex flex-col bg-primary-800/60 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg border border-primary-500/20'>
        {/* Header with gradient */}
        <div className='bg-gradient-to-r from-primary-700/80 to-primary-600/50 px-3 py-2 flex justify-between items-center'>
          <span className='text-xs font-medium text-primary-200'>Transaction Details</span>
          <div className='flex items-center gap-1.5'>
            <div className='w-2 h-2 rounded-full bg-green-400 animate-pulse'></div>
            <span className='text-[10px] text-green-300 font-medium'>Confirmed</span>
          </div>
        </div>

        {/* Main content */}
        <div className='p-3 space-y-3'>
          {/* Payment info with glass effect */}
          <div className='flex items-center justify-between bg-primary-700/40 backdrop-blur-md p-3 rounded-lg border border-primary-500/10'>
            <div className='flex flex-col'>
              <span className='text-[10px] uppercase tracking-wider text-primary-400 font-medium'>{isBuy ? 'You Paid' : 'You Received'}</span>
              <div className='font-semibold flex items-center gap-1.5 mt-0.5'>
                <span className='text-primary-100'>{amount}</span>
                <span className='text-primary-300 font-medium'>{transaction.token?.symbol}</span>
                <span className='text-primary-400 text-[10px] px-1.5 py-0.5 bg-primary-600/50 rounded-full'>~${usdValue}</span>
              </div>
            </div>

            <div className='h-10 w-[1px] bg-primary-500/20'></div>

            <div className='flex flex-col items-end'>
              <span className='text-[10px] uppercase tracking-wider text-primary-400 font-medium'>Exchange Rate</span>
              <div className='font-semibold mt-0.5 text-primary-200'>
                1 {transaction.token?.symbol} = <span className='text-primary-100'>${rate}</span>
              </div>
            </div>
          </div>

          {/* Transaction hash and timestamp */}
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-[11px]'>
            <div className='flex items-center gap-1.5 text-primary-400 bg-primary-700/30 px-2 py-1 rounded-md hover:bg-primary-700/50 transition-all'>
              <svg className='w-3.5 h-3.5 text-primary-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <span className='font-medium'>
                {formattedDate} <span className='text-primary-500/80 italic text-[9px]'>({formattedLocalDate})</span>
              </span>
            </div>

            <a
              href={`https://sonicscan.org/tx/${transaction.txs}`}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1.5 text-primary-400 hover:text-primary-200 transition-all duration-300 group bg-primary-700/30 px-2 py-1 rounded-md border border-transparent hover:border-primary-500/30 hover:shadow-[0_0_8px_rgba(59,130,246,0.3)]'
            >
              <div className='w-4 h-4 rounded-full bg-primary-600/50 flex items-center justify-center group-hover:bg-primary-500/50'>
                <svg className='w-2.5 h-2.5 text-primary-300 group-hover:text-primary-100' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <span className='font-mono font-medium'>{txShort}</span>
              <div className='w-4 h-4 rounded-full bg-primary-600/50 flex items-center justify-center group-hover:bg-primary-500/50 transition-all'>
                <svg className='w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

// Transaction Type Components
const TransferTransaction = React.memo(({ transaction }: { transaction: any }) => {
  // Format transaction hash for display
  const txHashShort = useMemo(() => {
    if (!transaction.txs) return 'Unknown';
    return `${transaction.txs.slice(0, 8)}...${transaction.txs.slice(-6)}`;
  }, [transaction.txs]);

  // Format amount with proper precision
  const formattedAmount = useMemo(() => {
    const amount = transaction.in_amount ? Number(transaction.in_amount) / Math.pow(10, 18) : 0;
    if (amount === 0) return '0';
    if (amount < 0.0001) return amount.toExponential(4);
    if (amount < 0.01) return amount.toFixed(6);
    if (amount < 1) return amount.toFixed(4);
    return amount.toLocaleString(undefined, {
      maximumFractionDigits: 4,
      minimumFractionDigits: 2,
    });
  }, [transaction.in_amount]);

  // Format timestamp
  const formattedDate = useMemo(() => {
    if (!transaction.created_at) return 'Unknown';
    return new Date(transaction.created_at).toLocaleString();
  }, [transaction.created_at]);

  // Get recipient address from data_swap if available
  const recipientAddress = useMemo(() => {
    if (!transaction.data_swap?.to_address) return 'Unknown';
    const address = transaction.data_swap.to_address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [transaction.data_swap]);

  // Get gas used if available
  const gasUsed = useMemo(() => {
    return transaction.data_swap?.gas_used || 'Unknown';
  }, [transaction.data_swap]);

  return (
    <div className='mt-3 text-xs border-t border-primary-600/30 pt-3 space-y-2.5'>
      {/* Transaction details card */}
      <div className='bg-primary-800/30 backdrop-blur-sm rounded-lg border border-primary-700/50 overflow-hidden'>
        {/* Amount section with gradient background */}
        <div className='bg-gradient-to-r from-primary-800/80 to-primary-700/50 p-3 flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-full bg-primary-900/80 flex items-center justify-center shadow-lg'>
              <svg className='w-4 h-4 text-primary-100' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div>
              <p className='text-[10px] text-primary-400 uppercase tracking-wider'>Amount</p>
              <p className='text-sm font-bold text-primary-100'>
                {formattedAmount} <span className='text-primary-300'>SONIC</span>
              </p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-[10px] text-primary-400 uppercase tracking-wider'>Gas Used</p>
            <p className='text-xs font-medium text-primary-300'>{gasUsed !== 'Unknown' ? `${gasUsed} gwei` : 'Pending'}</p>
          </div>
        </div>

        {/* Details grid */}
        <div className='p-3 grid grid-cols-2 gap-2'>
          {/* Recipient */}
          <div className='flex flex-col'>
            <span className='text-[10px] text-primary-400 uppercase tracking-wider mb-1'>Recipient</span>
            <div className='flex items-center gap-1.5 bg-primary-900/30 rounded-md px-2 py-1.5 border border-primary-700/50'>
              <svg className='w-3 h-3 text-primary-300 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
              </svg>
              <span className='font-mono text-primary-200 truncate'>{recipientAddress}</span>
            </div>
          </div>

          {/* Timestamp */}
          <div className='flex flex-col'>
            <span className='text-[10px] text-primary-400 uppercase tracking-wider mb-1'>Timestamp</span>
            <div className='flex items-center gap-1.5 bg-primary-900/30 rounded-md px-2 py-1.5 border border-primary-700/50'>
              <svg className='w-3 h-3 text-primary-300 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <span className='text-primary-200 truncate'>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Transaction hash with hover effect */}
        <a href={`https://sonicscan.org/tx/${transaction.txs}`} target='_blank' rel='noopener noreferrer' className='block mt-1 bg-primary-900/40 border-t border-primary-700/50 px-3 py-2 hover:bg-primary-800/50 transition-all duration-300 group'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-1.5'>
              <svg className='w-3 h-3 text-primary-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <span className='text-[10px] text-primary-400 uppercase tracking-wider'>Transaction Hash</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='font-mono text-primary-300 group-hover:text-primary-100 transition-colors'>{txHashShort}</span>
              <svg className='w-3 h-3 text-primary-400 group-hover:text-primary-200 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
              </svg>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
});

const ReceiptTransaction = ({ transaction }: { transaction: any }) => (
  <div className='mt-2 text-xs space-y-1 border-t border-primary-600/30 pt-2'>
    <p className='text-primary-300 truncate'>From: {transaction.sender}</p>
    <div className='flex justify-between'>
      <span className='text-primary-400 truncate'>Hash: {transaction.transactionHash}</span>
      <span className='text-primary-400 ml-1'>#{transaction.confirmations}</span>
    </div>
  </div>
);

export default HistoryTab;
