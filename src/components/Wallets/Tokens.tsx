import axios from '@/lib/axios';
import React, { useState, useEffect, useMemo, useCallback, memo, use } from 'react';
import { FaChartLine, FaCheck, FaCopy, FaExchangeAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-toastify';

import { ChartDialog } from '@/components/auth/Chart';

const formatTokenAmount = (amount: string, decimals: string) => {
  try {
    const value = parseFloat(amount) / Math.pow(10, parseInt(decimals));
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  } catch (err) {
    return '0.00';
  }
};
// Tab Content Components
const TokensTab = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: any) => state.auth);
  const tokens = useSelector((state: any) => state.tokens);
  const [loading, setLoading] = useState(false);

  const fetchTokens = useCallback(async () => {
    if (!auth || !auth.id) {
      dispatch({ type: 'update/tokens', payload: [] });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('/wallet/assets');
      const data = response.data;

      if (data && data.success && Array.isArray(data.data)) {
        dispatch({ type: 'update/tokens', payload: data.data });
      } else {
        dispatch({ type: 'update/tokens', payload: [] });
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      dispatch({ type: 'update/tokens', payload: [] });
    } finally {
      setLoading(false);
    }
  }, [auth, dispatch]);

  // Listen for balance update messages from other components
  useEffect(() => {
    const handleBalanceUpdateMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BALANCE_UPDATE_TRIGGER') {
        fetchTokens();
      }
    };

    window.addEventListener('message', handleBalanceUpdateMessage);
    return () => window.removeEventListener('message', handleBalanceUpdateMessage);
  }, [fetchTokens]);

  useEffect(() => {
    // Only fetch and set interval if authenticated
    if (auth && auth.id) {
      fetchTokens();

      // Refresh token data every 30 seconds
      const intervalId = setInterval(fetchTokens, 30000);

      return () => {
        clearInterval(intervalId);
      };
    } else {
      // Clear tokens if not authenticated
      dispatch({ type: 'update/tokens', payload: [] });
    }
  }, [auth, fetchTokens, dispatch]);

  if (loading && !tokens.length) {
    return <div className='flex justify-center items-center p-8 text-primary-400'>Loading...</div>;
  }

  if (!tokens.length) {
    return <div className='flex justify-center items-center p-8 text-primary-400'>No tokens found in wallet</div>;
  }

  return (
    <div className='overflow-y-auto max-h-[calc(100vh-26rem)] scrollbar-thin scrollbar-thumb-primary-500 scrollbar-track-primary-800/50 hover:scrollbar-thumb-primary-400 transition-colors'>
      <div className='space-y-3'>
        {tokens.map((token: any) => (
          <Token key={token.token} token={token} />
        ))}
      </div>
    </div>
  );
};

const Token = ({ token }: { token: any }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatTokenAmount = (amount: string, decimals: string) => {
    try {
      const value = parseFloat(amount) / Math.pow(10, parseInt(decimals));

      // Format based on value size for better readability
      if (value === 0) return '0.00';
      if (value < 0.000001) return '<0.000001';
      if (value < 0.01) {
        return value.toLocaleString(undefined, {
          minimumFractionDigits: 6,
          maximumFractionDigits: 8,
        });
      }
      if (value < 1) {
        return value.toLocaleString(undefined, {
          minimumFractionDigits: 4,
          maximumFractionDigits: 6,
        });
      }
      if (value < 1000) {
        return value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        });
      }
      if (value < 1000000) {
        return value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      // For large numbers, use K/M/B notation
      if (value < 1000000000) {
        return (
          (value / 1000000).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + 'M'
        );
      }
      return (
        (value / 1000000000).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + 'B'
      );
    } catch (err) {
      console.error('Error formatting token amount:', err);
      return '0.00';
    }
  };

  // Memoize the formatted amount to prevent unnecessary recalculations
  const formattedAmount = useMemo(() => formatTokenAmount(token.amount, token.decimals), [token.amount, token.decimals]);

  const handleCopyAddress = async () => {
    if (token.token) {
      try {
        await navigator.clipboard.writeText(token.token);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  const handleViewExplorer = () => {
    if (token.token) {
      window.open(`https://sonicscan.org/token/${token.token}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://sonicscan.org/token/images/default.png';
    setImageLoaded(true);
  };

  return (
    <div
      className='p-4 bg-gradient-to-r from-primary-800/70 to-primary-700/60 rounded-xl hover:from-primary-700/80 hover:to-primary-600/70 transition-all duration-300 border border-primary-600/30 shadow-lg hover:shadow-primary-500/10 transform hover:-translate-y-0.5'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-full overflow-hidden border border-primary-500/30 shadow-md bg-gradient-to-br from-primary-900 to-primary-800 p-0.5 flex items-center justify-center'>
            <img
              src={token.logo}
              alt={`${token.symbol} logo`}
              className={`w-full h-full object-cover rounded-full transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading='lazy'
              decoding='async'
            />
          </div>
          <div>
            <p className='font-semibold text-white'>{token.name || 'Unknown Token'}</p>
            <p className='text-sm text-primary-300 font-medium'>{token.symbol || '???'}</p>
          </div>
        </div>
        <div className='text-right'>
          <p className='font-bold text-lg bg-gradient-to-r from-primary-300 to-primary-400 bg-clip-text text-transparent'>{formattedAmount}</p>
          <div className='flex items-center gap-2 mt-1 bg-primary-800/60 rounded-md px-2 py-1'>
            <p className='text-xs text-primary-300 font-mono'>{token.token ? `${token.token.slice(0, 6)}...${token.token.slice(-4)}` : 'Invalid Address'}</p>
            <button
              onClick={handleCopyAddress}
              className={`text-xs p-1 rounded-md transition-all duration-300 ${copySuccess ? 'bg-green-500/30 text-green-300' : 'text-primary-300 hover:text-primary-200 hover:bg-primary-600/40'}`}
              aria-label={copySuccess ? 'Copied' : 'Copy address'}
              title={copySuccess ? 'Copied!' : 'Copy token address'}
            >
              {copySuccess ? <FaCheck size={10} /> : <FaCopy size={10} />}
            </button>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-4 gap-2 mt-3 transition-all duration-300 ${isHovered ? 'opacity-100 transform translate-y-0' : 'opacity-90 transform translate-y-1'}`}>
        <BuyTokenDialog token={token} />
        <ButtonSell token={token} />
        <ChartDialog address={token.token} mode='expanded' />

        <button
          className='flex items-center justify-center gap-2 bg-primary-700/50 hover:bg-primary-600/60 px-3 py-2 rounded-lg border border-primary-500/30 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-primary-500/20'
          onClick={handleViewExplorer}
          aria-label='View on explorer'
          title='View on Sonic Explorer'
        >
          <FaExternalLinkAlt className='text-primary-300 w-3.5 h-3.5' />
          <span className='whitespace-nowrap'>Explorer</span>
        </button>
      </div>
    </div>
  );
};

// Button Sell Component
const ButtonSell = React.memo(({ token }: { token: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'amount' | 'percent'>('amount');
  const [sellValue, setSellValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxAmount = useMemo(() => formatTokenAmount(token.amount, token.decimals), [token.amount, token.decimals]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSellValue('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleMaxClick = useCallback(() => {
    if (mode === 'amount') {
      setSellValue(maxAmount);
    } else {
      setSellValue('100');
    }
  }, [mode, maxAmount]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (mode === 'percent') {
        setSellValue(value);
      } else {
        const maxAmountNum = parseFloat(maxAmount);
        const percentage = parseFloat(value);
        // Use toLocaleString to format with proper decimal places
        const amount = ((maxAmountNum * percentage) / 100).toFixed(Math.min(6, token.decimals || 6));
        setSellValue(amount);
      }
    },
    [mode, maxAmount, token.decimals]
  );

  const sliderValue = useMemo(() => {
    if (mode === 'percent') {
      return sellValue || '0';
    } else {
      const numerator = parseFloat(sellValue || '0');
      const denominator = parseFloat(maxAmount);
      return denominator > 0 ? Math.min(100, (numerator / denominator) * 100).toString() : '0';
    }
  }, [mode, sellValue, maxAmount]);

  const handleSellConfirm = useCallback(async () => {
    try {
      setIsSubmitting(true);
      // Send a message to trigger the chat with swap information
      typeof window !== 'undefined' &&
        window.postMessage(
          {
            type: 'SWAP_MESSAGE',
            message: `I want to sell ${sellValue} ${mode === 'percent' ? '%' : token.symbol} of ${token.token}. Please sell it again`,
          },
          window.location.origin
        );
      setIsOpen(false);
    } catch (error) {
      console.error('Error selling token:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, sellValue, maxAmount, token]);

  return (
    <>
      <button className='flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/40 px-3 py-1.5 rounded-lg border border-red-500/40 transition-all text-sm font-medium' onClick={() => setIsOpen(true)} disabled={parseFloat(maxAmount) <= 0}>
        <FaExchangeAlt className='text-red-400 w-3 h-3' />
        Sell
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='bg-primary-900 border border-primary-700 text-white p-6 rounded-lg max-w-md mx-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold text-center mb-4'>
              <div className='flex items-center justify-center gap-3 mb-2'>
                <div className='w-10 h-10 rounded-full overflow-hidden border border-primary-600 flex-shrink-0'>
                  <img
                    src={token.logo || 'https://sonicscan.org/token/images/default.png'}
                    alt={token.name || token.symbol}
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      e.currentTarget.src = 'https://sonicscan.org/token/images/default.png';
                    }}
                    loading='lazy'
                  />
                </div>
                <div className='text-left'>
                  <div>Sell {token.symbol}</div>
                  <div className='text-sm text-primary-400 font-mono truncate max-w-[200px]'>{token.token ? `${token.token.slice(0, 6)}...${token.token.slice(-4)}` : 'Invalid Address'}</div>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span className='text-primary-400 flex items-center gap-1'>
                <span>Balance:</span>
                <span className='font-medium'>
                  {parseFloat(maxAmount).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 6,
                  })}
                </span>
                <span>{token.symbol}</span>
              </span>
              <div className='flex gap-2'>
                <button className={`px-3 py-1 rounded-lg transition-colors ${mode === 'amount' ? 'bg-primary-500 text-white' : 'bg-primary-800 hover:bg-primary-700'}`} onClick={() => setMode('amount')}>
                  Amount
                </button>
                <button className={`px-3 py-1 rounded-lg transition-colors ${mode === 'percent' ? 'bg-primary-500 text-white' : 'bg-primary-800 hover:bg-primary-700'}`} onClick={() => setMode('percent')}>
                  Percent
                </button>
              </div>
            </div>

            <div className='bg-primary-800/50 p-4 rounded-lg border border-primary-700'>
              <div className='flex gap-2 items-center'>
                <input
                  type='number'
                  value={sellValue}
                  onChange={(e) => setSellValue(e.target.value)}
                  placeholder='0.0'
                  className='bg-transparent text-2xl outline-none flex-1 focus:ring-1 focus:ring-primary-500 rounded'
                  min='0'
                  max={mode === 'percent' ? '100' : maxAmount}
                  step={mode === 'percent' ? '1' : `0.${'0'.repeat(Math.min(5, token.decimals - 1))}1`}
                />
                <span className='text-primary-400 font-medium'>{mode === 'percent' ? '%' : token.symbol}</span>
                <button className='bg-primary-600 hover:bg-primary-500 px-3 py-1 rounded-lg transition-colors font-medium' onClick={handleMaxClick}>
                  MAX
                </button>
              </div>

              <div className='mt-4'>
                <input type='range' min='0' max='100' value={sliderValue} onChange={handleSliderChange} className='w-full h-2 bg-primary-700 rounded-lg appearance-none cursor-pointer accent-primary-500' />
                <div className='flex justify-between text-sm text-primary-400 mt-1'>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {mode === 'percent' && parseFloat(sellValue || '0') > 0 && (
              <div className='text-sm text-primary-300 bg-primary-800/30 p-2 rounded'>
                ≈{' '}
                {((parseFloat(maxAmount) * parseFloat(sellValue || '0')) / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 6,
                })}{' '}
                {token.symbol}
              </div>
            )}

            <button
              className='w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
              onClick={handleSellConfirm}
              disabled={!sellValue || parseFloat(sellValue) <= 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className='animate-spin -ml-1 mr-2 h-4 w-4 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>Confirm Sell</>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

ButtonSell.displayName = 'ButtonSell';

const BuyTokenDialog = memo(({ token }: { token: any }) => {
  const [open, setOpen] = useState(false);
  const [buyValue, setBuyValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const nativeBalance = useSelector((state: any) => state.balance);
  const dispatch = useDispatch();

  // Constants
  const GAS_FEE = useMemo(() => '0.001', []); // Estimated gas fee
  const maxPurchaseAmount = useMemo(() => Math.max(0, parseFloat(nativeBalance) - parseFloat(GAS_FEE)), [nativeBalance, GAS_FEE]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setBuyValue('');
      setSliderValue(0);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setSliderValue(value);

      const amount = ((value / 100) * maxPurchaseAmount).toFixed(6);
      setBuyValue(amount);
    },
    [maxPurchaseAmount]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setBuyValue(value);

      // Update slider position based on input
      if (value && maxPurchaseAmount > 0) {
        const percentage = (parseFloat(value) / maxPurchaseAmount) * 100;
        setSliderValue(Math.min(100, Math.max(0, percentage)));
      } else {
        setSliderValue(0);
      }
    },
    [maxPurchaseAmount]
  );

  const handleMaxClick = useCallback(() => {
    setBuyValue(maxPurchaseAmount.toFixed(6));
    setSliderValue(100);
  }, [maxPurchaseAmount]);

  const handleBuyConfirm = useCallback(async () => {
    if (!buyValue || parseFloat(buyValue) <= 0 || parseFloat(buyValue) > maxPurchaseAmount) return;

    try {
      setIsSubmitting(true);

      // Send a message to trigger the chat with swap information
      typeof window !== 'undefined' &&
        window.postMessage(
          {
            type: 'SWAP_MESSAGE',
            message: `I want to buy ${token.token} with ${buyValue} S (Sonic). Please buy it again`,
          },
          window.location.origin
        );

      setOpen(false);
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Transaction failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [buyValue, maxPurchaseAmount, token.symbol, nativeBalance, dispatch]);

  // Format numbers for display
  const formattedBalance = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(parseFloat(nativeBalance)),
    [nativeBalance]
  );

  const formattedMidpoint = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }).format(parseFloat(nativeBalance) / 2),
    [nativeBalance]
  );

  return (
    <>
      <button className='flex-1 flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/40 px-3 py-1.5 rounded-lg border border-green-500/40 transition-all text-sm' onClick={() => setOpen(true)}>
        <FaExchangeAlt className='text-green-400 w-3 h-3' />
        Buy
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='bg-primary-900 border border-primary-700 p-6 rounded-xl shadow-xl max-w-md w-full'>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <h3 className='text-xl font-bold'>Buy {token.symbol}</h3>
              <div className='text-sm text-primary-400'>
                Balance: <span className='font-medium'>{formattedBalance} S</span>
              </div>
            </div>

            <div className='bg-primary-800/50 p-4 rounded-lg border border-primary-700'>
              <div className='flex gap-2 items-center'>
                <input type='number' value={buyValue} onChange={handleInputChange} placeholder='0.0' className='bg-transparent text-2xl outline-none flex-1 rounded' min='0' max={maxPurchaseAmount} step='0.000001' disabled={isSubmitting} />
                <span className='text-primary-400'>S</span>
                <button className='bg-primary-600 hover:bg-primary-500 px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed' onClick={handleMaxClick} disabled={isSubmitting}>
                  MAX
                </button>
              </div>

              <div className='mt-4'>
                <input type='range' min='0' max='100' value={sliderValue} onChange={handleSliderChange} className='w-full h-2 bg-primary-700 rounded-lg appearance-none cursor-pointer accent-primary-500' disabled={isSubmitting} />
                <div className='flex justify-between text-sm text-primary-400 mt-1'>
                  <span>0 S</span>
                  <span>{formattedMidpoint} S</span>
                  <span>{formattedBalance} S</span>
                </div>
              </div>
            </div>

            <div className='flex justify-between text-sm bg-primary-800/30 p-3 rounded-lg'>
              <span className='text-primary-300'>Estimated Gas Fee:</span>
              <span className='text-primary-200 font-medium'>{GAS_FEE} S</span>
            </div>

            <button
              className='w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
              onClick={handleBuyConfirm}
              disabled={!buyValue || parseFloat(buyValue) <= 0 || parseFloat(buyValue) > maxPurchaseAmount || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className='animate-spin -ml-1 mr-2 h-4 w-4 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>Confirm Buy</>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

BuyTokenDialog.displayName = 'BuyTokenDialog';

export default TokensTab;
