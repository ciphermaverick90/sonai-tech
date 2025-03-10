'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  FaWallet,
  FaExchangeAlt,
  FaBrain,
  FaTimes,
  FaCopy,
  FaArrowRight,
  FaCheckCircle,
  FaArrowLeft,
  FaClock,
  FaGasPump,
  FaFileAlt,
  FaCoins,
  FaUserAlt,
  FaInfoCircle,
  FaPaste,
  FaUser,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaExclamationCircle,
  FaHistory,
  FaSync,
  FaCheck,
  FaPowerOff,
} from 'react-icons/fa';
import { Unplug } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import axios from '@/lib/axios';
import TokensTab from '@/components/Wallets/Tokens';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import HistoryTab from './Wallets/Activities';
import ButtonQRCode from './ButtonQRDeposit';

interface Token {
  name: string;
  symbol: string;
  balance: string;
  aiScore?: number;
  futureProjection?: string;
}

interface Transaction {
  type: string;
  amount: string;
  date: string;
  status: string;
  aiAnalysis?: string;
  riskScore?: number;
}

interface WalletInfo {
  balance: string;
  transactions: Transaction[];
  tokens: Token[];
  aiHealthScore?: number;
  nextActionSuggestion?: string;
}

const UserInfo = React.memo(() => {
  const auth = useSelector((state: any) => state.auth);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyAddress = async () => {
    if (auth?.wallet?.address) {
      try {
        await navigator.clipboard.writeText(auth.wallet.address);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  return (
    <div className='flex items-center justify-between p-4 bg-[#0D0301] rounded-lg border border-highlight/20'>
      <div className='flex items-center gap-2'>
        <img src='/star.png' alt='SONAI Logo' className='h-10 w-auto' />
        <div>
          <h2 className='text-xl font-bold flex items-center gap-2 transition-all duration-300 hover:text-primary-300'>Your Wallet</h2>
          <div className='flex items-center gap-2'>
            <p className='text-sm text-primary-400 flex items-center gap-1 transition-all duration-300'>
              {auth?.wallet?.address && (
                <button onClick={handleCopyAddress} className={`p-1 rounded transition-all duration-300 ${copySuccess ? 'bg-green-500/20 text-green-400' : 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/20'}`}>
                  {copySuccess ? <FaCheck size={14} /> : <FaCopy size={14} />}
                </button>
              )}
              {auth?.wallet?.address ? `${auth.wallet.address.slice(0, 8)}...${auth.wallet.address.slice(-8)}` : 'No wallet connected'}
            </p>
          </div>
        </div>
      </div>
      <div className='flex gap-2'>
        <ButtonQRCode />
        <ButtonLogout />
      </div>
    </div>
  );
});

const ButtonLogout = () => {
  const dispatch = useDispatch();
  const handleLogout = useCallback(() => {
    dispatch({ type: 'update/auth', payload: false });
    localStorage.removeItem('token');
  }, [dispatch]);

  return (
    <button className='p-2 bg-primary-500/20 rounded-sm hover:bg-primary-500/40 transition-all' onClick={handleLogout} type='button' aria-label='Logout'>
      <Unplug size={24} className='text-red-500' />
    </button>
  );
};

// Wallet Balance Component
const WalletBalance = memo(() => {
  const dispatch = useDispatch();
  const [usdValue, setUsdValue] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const balance = useSelector((state: any) => state.balance);
  const onFetching = useSelector((state: any) => state.onFetching);

  const fetchBalanceData = useCallback(
    async (abortSignal?: AbortSignal) => {
      try {
        setLoading(true);
        const response = await axios.get('/wallet/balance', {
          signal: abortSignal,
        });

        if (response.data.success) {
          dispatch({ type: 'update/balance', payload: response.data.balanceEth });
          // Using a more accurate price calculation
          // const estimatedUsdValue = (parseFloat(response.data.balanceEth) * 1500).toFixed(2);
          // setUsdValue(estimatedUsdValue);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching wallet balance:', error);
        }
      } finally {
        setLoading(false);
        dispatch({ type: 'update/onFetching', payload: false });
      }
    },
    [dispatch]
  );

  // Initial balance fetch
  useEffect(() => {
    const controller = new AbortController();
    fetchBalanceData(controller.signal);

    return () => controller.abort();
  }, [fetchBalanceData]);

  // Listen for balance update messages from other components
  useEffect(() => {
    const handleBalanceUpdateMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BALANCE_UPDATE_TRIGGER') {
        dispatch({ type: 'update/onFetching', payload: true });
        fetchBalanceData();
      }
    };

    window.addEventListener('message', handleBalanceUpdateMessage);
    return () => window.removeEventListener('message', handleBalanceUpdateMessage);
  }, [dispatch, fetchBalanceData]);

  const handleReloadBalance = () => {
    dispatch({ type: 'update/onFetching', payload: true });
    fetchBalanceData();
  };

  return (
    <div className='col-span-4 p-4 rounded-lg border border-highlight/20 relative overflow-hidden bg-highlight/5 backdrop-blur-sm shadow-inner shadow-[#FEA52B]'>
      {/* Background decorations with reduced opacity and z-index to prevent overlap */}
      <div className='absolute pointer-events-none left-0 top-0 z-0 opacity-30'>
        <div className='absolute inset-0 pointer-events-none opacity-50 z-0'>
          <img src='/tweet-background-card.png' alt='Background' className='absolute -top-0 -left-0' />
        </div>
        <img src='/tweet-card.svg' alt='Decoration' className='w-full h-full z-5' />
      </div>

      {/* Main content with higher z-index to ensure visibility */}
      <div className='relative z-10'>
        <div className='flex items-center mb-4 gap-3'>
          <div className='h-12 w-12 border rounded-full overflow-hidden shadow-lg shadow-primary-500/20'>
            <img src='/sonic.webp' alt='Sonic Logo' className='h-full w-full rounded-full object-cover transform hover:scale-110 transition-transform duration-300' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h2 className='text-lg font-semibold text-white'>Your Balance</h2>
              <button onClick={handleReloadBalance} className='ml-2 p-1.5 rounded-full bg-primary-700/30 hover:bg-primary-700/50 transition-all hover:shadow-md hover:shadow-primary-500/20' disabled={loading} title='Reload balance'>
                <FaSync className={`text-primary-400 ${loading ? 'animate-spin' : 'hover:rotate-180 transition-transform duration-300'}`} size={14} />
              </button>
            </div>
            <div className='flex items-baseline gap-2'>
              <p className='text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-300 to-primary-400'>{loading ? <span className='inline-block w-16 h-8 bg-primary-700/50 rounded animate-pulse'></span> : `${balance} S`}</p>
              <p className='text-sm text-primary-400 mt-1'>{loading ? <span className='inline-block w-20 h-4 bg-primary-700/50 rounded animate-pulse'></span> : `≈ $${usdValue} USD`}</p>
            </div>
          </div>
        </div>

        {/* Action buttons with improved visibility and interaction */}
        <div className='gap-2 mt-3 relative z-20 grid grid-cols-3'>
          <TransferNativeBalance />
          <ButtonQRCode className=' flex flex-col items-center justify-center gap-2 bg-primary-700/50 hover:bg-primary-700/70 px-4 py-2 rounded-lg border border-primary-500/40 transition-all hover:shadow-lg hover:shadow-primary-500/10 transform hover:translate-y-[-2px]'>
            <FaWallet className='text-primary-300' />
            <span className='text-white'>Receive</span>
          </ButtonQRCode>
          <button
            className='flex flex-col items-center justify-center gap-2 bg-primary-600/50 hover:bg-primary-600/70 px-4 py-2 rounded-lg border border-primary-500/40 transition-all hover:shadow-lg hover:shadow-primary-500/10 transform hover:translate-y-[-2px]'
            onClick={() => window.postMessage({ type: 'AI_ANALYSIS_REQUEST', payload: { balance, usdValue } }, '*')}
          >
            <FaBrain className='text-primary-300' />
            <span className='text-white'>Analysis</span>
          </button>
        </div>
      </div>

      {/* Status indicator with higher z-index */}
      {onFetching && <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-primary-300 animate-pulse bg-primary-900/70 px-2 py-1 rounded-full z-20'>Syncing with blockchain...</div>}
    </div>
  );
});

WalletBalance.displayName = 'WalletBalance';
const TransferNativeBalance = memo(() => {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionFee, setTransactionFee] = useState('0.0001'); // Simulated gas fee
  const [memo, setMemo] = useState('');
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const balance = useSelector((state: any) => state.balance);
  const auth = useSelector((state: any) => state.auth);
  const [transferStatus, setTransferStatus] = useState<any>({
    success: false,
    message: '',
    data: null,
    error: null,
  });

  // Load recent addresses from localStorage on component mount
  useEffect(() => {
    const storedAddresses = localStorage.getItem('recentTransferAddresses');
    if (storedAddresses) {
      try {
        setRecentAddresses(JSON.parse(storedAddresses));
      } catch (e) {
        console.error('Failed to parse recent addresses:', e);
      }
    }
  }, []);

  const saveRecentAddress = useCallback(
    (address: string) => {
      if (!address || recentAddresses.includes(address)) return;

      const newRecentAddresses = [address, ...recentAddresses].slice(0, 5); // Increased from 3 to 5
      setRecentAddresses(newRecentAddresses);
      localStorage.setItem('recentTransferAddresses', JSON.stringify(newRecentAddresses));
    },
    [recentAddresses]
  );

  const handleTransfer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!recipient || !amount) return;

      // Validate recipient address
      if (!recipient.startsWith('0x') || recipient.length !== 42) {
        setError('Invalid wallet address format');
        return;
      }

      // Validate amount
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (amountValue > parseFloat(balance)) {
        setError('Insufficient balance');
        return;
      }

      // Show confirmation step first
      if (!showConfirmation) {
        setShowConfirmation(true);
        return;
      }

      try {
        setIsLoading(true);

        // Call the backend API to transfer funds
        const response = await axios.post(
          `/wallet/transfer`,
          {
            address: recipient,
            amount: amount,
            notes: memo,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result = response.data;
        setTransferStatus({
          success: result.success,
          message: result.message,
          data: result.data,
          error: result.error,
        });

        if (!result.success) {
          throw new Error(result.message || 'Transfer failed');
        }

        setTimeout(() => {
          typeof window !== 'undefined' && window.postMessage({ type: 'BALANCE_UPDATE_TRIGGER' }, window.location.origin);
        }, 1000);

        // Store transaction hash
        setTxHash(result.data.txHash);
        // Add to recent addresses
        saveRecentAddress(recipient);

        // Close dialog on success
        setTimeout(() => {
          setOpen(false);
          setRecipient('');
          setAmount('');
          setMemo('');
          setShowConfirmation(false);
          setTxHash(null);
          setTransferStatus({
            success: false,
            message: '',
            data: null,
            error: null,
          });
          setError(null);
          setIsLoading(false);
        }, 3000);
      } catch (error) {
        console.error('Transfer failed:', error);
        setError(error instanceof Error ? error.message : 'Transfer failed');
      } finally {
        setIsLoading(false);
      }
    },
    [recipient, amount, memo, showConfirmation, recentAddresses, balance, saveRecentAddress]
  );

  const handleCancel = useCallback(() => {
    if (showConfirmation) {
      setShowConfirmation(false);
    } else {
      setOpen(false);
      setError(null);
      setTransferStatus({
        success: false,
        message: '',
        data: null,
        error: null,
      });
    }
  }, [showConfirmation]);

  const totalAmount = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    const fee = parseFloat(transactionFee) || 0;
    return (amt + fee).toFixed(6);
  }, [amount, transactionFee]);

  const handleSelectRecentAddress = useCallback((address: string) => {
    setRecipient(address);
  }, []);

  const handleMaxAmount = useCallback(() => {
    // Set max amount while leaving a small amount for gas
    const maxAmount = Math.max(parseFloat(balance) - parseFloat(transactionFee) - 0.001, 0);
    setAmount(maxAmount.toFixed(6));
  }, [balance, transactionFee]);

  const handleDialogOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setShowConfirmation(false);
      setError(null);
      setTransferStatus({
        success: false,
        message: '',
        data: null,
        error: null,
      });
    }
    setOpen(newOpen);
  }, []);

  const handlePasteAddress = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRecipient(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setError('Unable to access clipboard. Please paste manually.');
    }
  }, []);

  const handleCopyRecipient = useCallback(() => {
    navigator.clipboard
      .writeText(recipient)
      .then(() => {
        // Could add a toast notification here
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
      });
  }, [recipient]);

  const isValidAmount = useMemo(() => {
    const amountValue = parseFloat(amount);
    return !isNaN(amountValue) && amountValue > 0 && amountValue <= parseFloat(balance);
  }, [amount, balance]);

  const transferButton = useMemo(
    () => (
      <button className='flex-1 flex-col flex items-center justify-center gap-2 bg-gradient-to-br from-primary-500/30 to-primary-600/30 hover:from-primary-500/50 hover:to-primary-600/50 px-4 py-2 rounded-lg border border-primary-500/40 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-primary-500/20'>
        <FaExchangeAlt className='text-primary-300 animate-pulse' />
        <span className='font-medium'>Transfer</span>
      </button>
    ),
    []
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{transferButton}</DialogTrigger>
      <DialogContent className='sm:max-w-[500px] bg-[#130401]/50 backdrop-blur-md border border-[#582D24] shadow-xl rounded-xl'>
        <DialogHeader>
          <DialogTitle className='text-primary-100 text-xl flex items-center gap-2'>
            <FaExchangeAlt className='text-primary-300' />
            <span>{showConfirmation ? 'Confirm Transfer' : 'Transfer Native Balance'}</span>
          </DialogTitle>
          <DialogDescription className='text-primary-300 opacity-80'>{showConfirmation ? 'Please review your transaction details before confirming.' : 'Send your native tokens to another wallet address securely.'}</DialogDescription>
        </DialogHeader>
        {transferStatus.success && (
          <div className='bg-green-900/30 border border-green-700/50 p-4 rounded-lg mb-4 animate-fadeIn'>
            <div className='flex items-center gap-3'>
              <div className='bg-green-500/20 p-2 rounded-full'>
                <FaCheckCircle className='text-green-400' size={20} />
              </div>
              <div>
                <h4 className='text-green-300 font-medium'>Transfer Successful</h4>
                <p className='text-green-400/80 text-sm'>{transferStatus.message}</p>
                {transferStatus.data?.txHash && (
                  <a href={`https://sonicscan.org/tx/${transferStatus.data.txHash}`} target='_blank' rel='noopener noreferrer' className='text-green-300 underline text-xs mt-1 hover:text-green-200 flex items-center gap-1'>
                    <span>View on Etherscan</span>
                    <FaExternalLinkAlt size={10} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        {transferStatus.error && (
          <div className='bg-red-900/30 border border-red-700/50 p-4 rounded-lg mb-4 animate-fadeIn'>
            <div className='flex items-center gap-3'>
              <div className='bg-red-500/20 p-2 rounded-full'>
                <FaExclamationTriangle className='text-red-400' size={20} />
              </div>
              <div>
                <h4 className='text-red-300 font-medium'>Transfer Failed</h4>
                <p className='text-red-400/80 text-sm'>{transferStatus.message}</p>
              </div>
            </div>
          </div>
        )}
        {error && !transferStatus.error && (
          <div className='bg-red-900/30 border border-red-700/50 p-3 rounded-lg mb-4 animate-fadeIn'>
            <div className='flex items-center gap-2'>
              <FaExclamationCircle className='text-red-400' size={16} />
              <p className='text-red-300 text-sm'>{error}</p>
            </div>
          </div>
        )}
        <form onSubmit={handleTransfer} className='space-y-4'>
          {!showConfirmation ? (
            <div className='space-y-5 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='recipient' className='text-primary-200 flex items-center gap-2 text-sm font-medium'>
                  <FaUserAlt className='text-primary-400 text-xs' />
                  Recipient Address
                </Label>
                <div className='relative'>
                  <Input
                    id='recipient'
                    placeholder='0x...'
                    className='bg-primary-800/70 border border-[#582D24] focus:border-primary-400 focus:ring-primary-400/30 rounded-lg py-5 pl-3 pr-10 w-full transition-all'
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                  />
                  <button type='button' onClick={handlePasteAddress} className='absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400 hover:text-primary-300 transition-colors' title='Paste from clipboard'>
                    <FaPaste size={16} />
                  </button>
                </div>

                {recentAddresses.length > 0 && (
                  <div className='mt-2'>
                    <p className='text-xs text-primary-400 mb-1 flex items-center gap-1'>
                      <FaHistory size={10} />
                      Recent addresses:
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {recentAddresses.map((address, index) => (
                        <button
                          key={index}
                          type='button'
                          onClick={() => handleSelectRecentAddress(address)}
                          className='text-xs bg-primary-800/50 hover:bg-primary-700/70 text-primary-300 px-2 py-1 rounded-md border border-primary-700/50 transition-all flex items-center gap-1 hover:scale-105'
                        >
                          <span>{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
                          <FaUser size={10} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='amount' className='text-primary-200 flex items-center gap-2 text-sm font-medium'>
                  <FaCoins className='text-primary-400 text-xs' />
                  Amount to Send
                </Label>
                <div className='relative'>
                  <Input
                    id='amount'
                    type='number'
                    step='0.000001'
                    min='0'
                    placeholder='0.0'
                    className={`bg-primary-800/70 border border-[#582D24] focus:border-primary-400 focus:ring-primary-400/30 rounded-lg py-5 px-3 w-full transition-all pr-16 ${amount && !isValidAmount ? 'border-red-500/70 focus:border-red-500' : ''}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <div className='absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2'>
                    <button type='button' onClick={handleMaxAmount} className='text-xs bg-primary-700/50 hover:bg-primary-600/50 text-primary-300 px-2 py-0.5 rounded transition-all hover:scale-105'>
                      MAX
                    </button>
                    <span className='text-primary-400 text-sm'>S</span>
                  </div>
                </div>
                <div className='flex justify-between text-xs text-primary-400 px-1'>
                  <span className='flex items-center gap-1'>
                    <FaGasPump size={10} />
                    Network Fee: ~{transactionFee} S
                  </span>
                  <span className='flex items-center gap-1'>
                    <FaWallet size={10} />
                    Available: {balance} S
                  </span>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='memo' className='text-primary-200 flex items-center gap-2 text-sm font-medium'>
                  <FaFileAlt className='text-primary-400 text-xs' />
                  Memo (Optional)
                </Label>
                <Input
                  id='memo'
                  placeholder='Add a note to this transaction'
                  className='bg-primary-800/70 border border-[#582D24] focus:border-primary-400 focus:ring-primary-400/30 rounded-lg py-5 px-3 w-full transition-all'
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  maxLength={100}
                />
                {memo && <p className='text-xs text-primary-400 text-right'>{memo.length}/100</p>}
              </div>

              <div className='bg-primary-800/30 p-3 rounded-lg border border-primary-700/50'>
                <div className='flex items-center gap-2 text-primary-300'>
                  <FaInfoCircle className='text-primary-400' />
                  <span className='text-sm'>Transaction will be processed on Ethereum Mainnet</span>
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-4 py-4'>
              <div className='bg-primary-800/50 p-4 rounded-lg border border-primary-700/50'>
                <div className='flex justify-between items-center mb-3'>
                  <span className='text-primary-300 text-sm flex items-center gap-1'>
                    <FaUserAlt className='text-xs' />
                    Recipient
                  </span>
                  <div className='flex items-center gap-1'>
                    <span className='text-primary-100 font-medium text-sm'>{`${recipient.slice(0, 8)}...${recipient.slice(-6)}`}</span>
                    <button type='button' onClick={handleCopyRecipient} className='text-primary-400 hover:text-primary-300 transition-colors' title='Copy address'>
                      <FaCopy size={12} />
                    </button>
                  </div>
                </div>
                <div className='flex justify-between items-center mb-3'>
                  <span className='text-primary-300 text-sm flex items-center gap-1'>
                    <FaCoins className='text-xs' />
                    Amount
                  </span>
                  <span className='text-primary-100 font-medium'>{amount} S</span>
                </div>
                {memo && (
                  <div className='flex justify-between items-center mb-3'>
                    <span className='text-primary-300 text-sm flex items-center gap-1'>
                      <FaFileAlt className='text-xs' />
                      Memo
                    </span>
                    <span className='text-primary-100 font-medium text-sm'>{memo}</span>
                  </div>
                )}
                <div className='flex justify-between items-center mb-3'>
                  <span className='text-primary-300 text-sm flex items-center gap-1'>
                    <FaGasPump className='text-xs' />
                    Network Fee
                  </span>
                  <span className='text-primary-100 font-medium'>{transactionFee} S</span>
                </div>
                <div className='h-px bg-primary-700/50 my-3'></div>
                <div className='flex justify-between items-center'>
                  <span className='text-primary-300 text-sm'>Total</span>
                  <span className='text-primary-100 font-bold'>{totalAmount} S</span>
                </div>
              </div>
              <div className='bg-yellow-900/20 border border-yellow-700/30 p-3 rounded-lg'>
                <p className='text-yellow-300/90 text-sm flex items-start gap-2'>
                  <svg className='w-5 h-5 flex-shrink-0 mt-0.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                  </svg>
                  Always verify the recipient address. Blockchain transactions cannot be reversed once confirmed.
                </p>
              </div>
              <div className='bg-primary-800/30 p-3 rounded-lg border border-primary-700/50'>
                <p className='text-primary-300 text-sm flex items-center gap-2'>
                  <FaClock className='text-primary-400' />
                  Estimated confirmation time: ~30 seconds
                </p>
              </div>
            </div>
          )}
          <DialogFooter className='flex flex-col sm:flex-row gap-3 pt-2'>
            <Button type='button' onClick={handleCancel} className='flex-1 bg-primary-800 hover:bg-primary-700 text-primary-200 font-medium py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2'>
              {showConfirmation ? <FaArrowLeft size={14} /> : <FaTimes size={14} />}
              <span>{showConfirmation ? 'Back' : 'Cancel'}</span>
            </Button>
            <Button
              type='submit'
              disabled={isLoading || transferStatus.success || (amount && !isValidAmount)}
              className='flex-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-medium py-2 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none'
            >
              {isLoading ? (
                <span className='flex items-center justify-center gap-2'>
                  <svg className='animate-spin h-4 w-4 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                  Processing...
                </span>
              ) : showConfirmation ? (
                <span className='flex items-center justify-center gap-2'>
                  <FaCheckCircle size={14} />
                  Confirm Transfer
                </span>
              ) : (
                <span className='flex items-center justify-center gap-2'>
                  <FaArrowRight size={14} />
                  Continue
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

TransferNativeBalance.displayName = 'TransferNativeBalance';

// Tab Navigation Component
const TabNavigation = React.memo(({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => {
  const handleTokensClick = useCallback(() => setActiveTab('tokens'), [setActiveTab]);
  const handleActivitiesClick = useCallback(() => setActiveTab('activities'), [setActiveTab]);

  return (
    <div className='flex gap-2 bg-primary-800/50 border-primary-600/20 mb-3'>
      <button className={`flex-1 p-3 rounded-tl-xl transition-all duration-300 transform relative overflow-hidden group ${activeTab === 'tokens' ? 'bg-white/10 text-highlight' : 'hover:bg-primary-700/60'}`} onClick={handleTokensClick}>
        <div className={`absolute inset-0 bg-gradient-to-r from-primary-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${activeTab === 'tokens' ? 'opacity-30' : ''}`}></div>
        <div className='absolute inset-0 opacity-10'>
          <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
            <pattern id='tokens-pattern' width='20' height='20' patternUnits='userSpaceOnUse'>
              <circle cx='10' cy='10' r='1' fill='currentColor' className='text-primary-200' />
            </pattern>
            <rect width='100%' height='100%' fill='url(#tokens-pattern)' />
          </svg>
        </div>
        <div className='flex items-center justify-center gap-2'>
          <svg className={`w-5 h-5 ${activeTab === 'tokens' ? 'text-highlight' : 'text-primary-300'} transition-all duration-300 group-hover:text-highlight`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
          <span className={`relative z-10 font-medium ${activeTab === 'tokens' ? 'text-highlight' : 'text-primary-200'} transition-colors duration-300 group-hover:text-highlight`}>Tokens</span>
        </div>
        {activeTab === 'tokens' && <div className='absolute -bottom-1 left-0 right-0 h-1 bg-primary-300/60 rounded-full mx-4'></div>}
      </button>
      <button className={`flex-1 p-3 rounded-tr-xl transition-all duration-300 transform relative overflow-hidden group ${activeTab === 'activities' ? 'bg-white/10 text-highlight' : 'hover:bg-primary-700/60'}`} onClick={handleActivitiesClick}>
        <div className={`absolute inset-0 bg-gradient-to-r from-primary-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${activeTab === 'activities' ? 'opacity-30' : ''}`}></div>
        <div className='absolute inset-0 opacity-10'>
          <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
            <pattern id='activities-pattern' width='20' height='20' patternUnits='userSpaceOnUse'>
              <path d='M0,10 L20,10 M10,0 L10,20' stroke='currentColor' strokeWidth='0.5' className='text-primary-200' />
            </pattern>
            <rect width='100%' height='100%' fill='url(#activities-pattern)' />
          </svg>
        </div>
        <div className='flex items-center justify-center gap-2'>
          <svg className={`w-5 h-5 ${activeTab === 'activities' ? 'text-highlight' : 'text-primary-300'} transition-all duration-300 group-hover:text-highlight`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' />
          </svg>
          <span className={`relative z-10 font-medium ${activeTab === 'activities' ? 'text-highlight' : 'text-primary-200'} transition-colors duration-300 group-hover:text-highlight`}>Activities</span>
        </div>
        {activeTab === 'activities' && <div className='absolute -bottom-1 left-0 right-0 h-1 bg-primary-300/60 rounded-full mx-4'></div>}
      </button>
    </div>
  );
});

TabNavigation.displayName = 'TabNavigation';

const WalletSection = () => {
  const [activeTab, setActiveTab] = useState('tokens');
  return (
    <div className='col-span-4 rounded-lg backdrop-blur-lg bg-opacity-90' id='wallet-section'>
      <div className='h-[calc(100vh-32px)] flex flex-col gap-4 px-4'>
        <UserInfo />
        <WalletBalance />
        <div className='flex-1'>
          <div className='border border-primary-600/40 rounded-sm'>
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className='flex-1 overflow-hidden px-3'>
              {activeTab === 'tokens' && <TokensTab />}
              {activeTab === 'activities' && <HistoryTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletSection;
