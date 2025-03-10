import React, { memo, useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDown, Check, RefreshCcw, X, Loader2, ExternalLink, ArrowRight, Copy } from 'lucide-react';
import axios from '@/lib/axios';

const LoadingQuote = () => {
  const steps = ['Analyzing market data...', 'Calculating optimal route...', 'Checking liquidity pools...', 'Estimating price impact...', 'Finalizing quote...'];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className='max-w-md border border-highlight/20 bg-transparent text-white backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-highlight/50'>
      <CardContent className='p-6 space-y-6'>
        <div className='space-y-3'>
          <div className='p-6 rounded-2xl bg-zinc-900/50 animate-pulse backdrop-blur-lg hover:bg-zinc-900/70 transition-all duration-300'>
            <div className='flex justify-between items-center'>
              <div>
                <div className='h-4 w-20 bg-gradient-to-r from-highlight/20 to-highlight/10 rounded-full mb-3'></div>
                <div className='h-7 w-32 bg-gradient-to-r from-highlight/20 to-highlight/10 rounded-full'></div>
              </div>
              <div className='text-right'>
                <div className='h-7 w-32 bg-gradient-to-r from-highlight/20 to-highlight/10 rounded-full mb-3'></div>
                <div className='h-4 w-24 bg-gradient-to-r from-highlight/20 to-highlight/10 rounded-full'></div>
              </div>
            </div>
          </div>

          <div className='flex justify-center relative -my-8'>
            <div className='absolute inset-0 bg-gradient-to-b from-transparent via-highlight/10 to-transparent blur-lg'></div>
            <div className='bg-highlight/20 rounded-full p-3 shadow-lg border border-highlight/20 hover:border-highlight/50 transition-all duration-300 z-10'>
              <ArrowDown className='text-highlight animate-bounce w-6 h-6' />
            </div>
          </div>

          <div className='p-6 rounded-2xl bg-highlight/20 animate-pulse backdrop-blur-lg hover:bg-highlight/50 transition-all duration-300'>
            <div className='flex justify-between items-center'>
              <div>
                <div className='h-4 w-20 bg-gradient-to-r from-highlight/20 to-highlight/10 rounded-full mb-3'></div>
                <div className='h-7 w-32 bg-gradient-to-r from-highlight/20 to-highlight/10 rounded-full'></div>
              </div>
              <div className='text-right'>
                <div className='h-7 w-32 bg-gradient-to-r from-highlight/20 to-highlight/10 rounded-full mb-3'></div>
                <div className='h-4 w-24 bg-gradient-to-r from-highlight/20 to-highlight/10 rounded-full'></div>
              </div>
            </div>
          </div>

          <div className='p-6 rounded-2xl bg-highlight/20 backdrop-blur-lg hover:bg-highlight/50 transition-all duration-300'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 rounded-full bg-gradient-to-r from-highlight/20 to-highlight/10 relative shadow-lg'>
                <div className='absolute inset-0 rounded-full border-2 border-highlight/20 animate-[spin_3s_linear_infinite]' />
                <div className='absolute inset-0 rounded-full border-2 border-t-transparent border-primary-400 animate-[spin_2s_linear_infinite]' />
                <div className='absolute inset-1 rounded-full bg-gradient-to-br from-highlight/20 to-highlight/10 animate-pulse' />
                <div className='absolute inset-2 rounded-full bg-gradient-to-br from-highlight/20 to-highlight/10 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]' />
              </div>
              <div className='flex-1'>
                <p className='text-base font-medium text-highlight animate-pulse'>{steps[currentStep]}</p>
                <div className='w-full bg-highlight/20 h-2 mt-3 rounded-full overflow-hidden shadow-inner'>
                  <div
                    className='h-full bg-gradient-to-r from-highlight/20 to-highlight/10 transition-all duration-500 rounded-full shadow-lg'
                    style={{
                      width: `${((currentStep + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button disabled className='w-full bg-gradient-to-r from-highlight/20 to-highlight/10 hover:from-highlight/10 hover:to-highlight/20 shadow-lg text-lg py-6 rounded-xl'>
            <div className='h-5 w-32 bg-highlight/20 rounded-full animate-pulse'></div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SwapQuote = memo(({ details, triggerMessage }: any) => {
  if (!details) return null;
  const { token, amount, mode, auto_confirm = false } = details;
  const [isCancel, setIsCancel] = useState<boolean>(false);
  const [quote, setQuote] = useState<any>(null);
  const [onFetching, setOnFetching] = useState<any>(null);
  const [onConfirming, setOnConfirming] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const [error, setError] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState<any>(false);

  const _HandleGetQuote = useCallback(async () => {
    try {
      const response = await axios.post(
        '/swap/quote',
        {
          token: token,
          amount: amount,
          side: mode,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: (status) => status >= 200 && status < 300,
        }
      );
      const data = response.data;
      if (data.success) {
        setQuote(data.quote);
        setCountdown(60); // Reset countdown when new quote received
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error getting quote:', error);
      setError(error);
      setCountdown(0); // Reset countdown on error
    } finally {
      setOnFetching(false);
    }
  }, [token, amount, mode]);

  useEffect(() => {
    if (onFetching) {
      _HandleGetQuote();
    }
  }, [onFetching]);

  useEffect(() => {
    setOnFetching(true);
  }, [token, amount, mode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quote && countdown > 0 && !isSuccess) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setOnFetching(true); // Refresh quote when countdown reaches 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quote, countdown, isSuccess]);

  const _HandleSwap = useCallback(async () => {
    try {
      const response = await axios.post('/swap/confirm', {
        quote: quote,
      });
      const data = response.data;

      if (data.success) {
        triggerMessage(`${mode} success, say short congratulations for user`);
        setIsSuccess({
          success: true,
          tx: data.tx?.data,
        });
        // Trigger balance update after successful swap
        setTimeout(() => {
          typeof window !== 'undefined' && window.postMessage({ type: 'BALANCE_UPDATE_TRIGGER' }, window.location.origin);
        }, 1000);
      } else {
        triggerMessage(`${mode} failed, say sorry for user about reason: ${data.message}`);
        setError(data.message);
      }
    } catch (error) {
      console.error('Error swapping:', error);
      triggerMessage(`${mode} failed, say sorry for user about reason: ${error}`);
      setError(error);
    } finally {
      setOnConfirming(false);
    }
  }, [quote, mode, triggerMessage]);

  useEffect(() => {
    if (onConfirming) {
      _HandleSwap();
    }
  }, [onConfirming]);

  const _HandleConfirmSwapClick = useCallback(async () => {
    if (countdown > 0) {
      setOnConfirming(true);
    } else {
      setOnFetching(true); // Refresh quote if expired
    }
  }, [countdown]);

  if (onFetching === null) {
    return null;
  }

  if (onFetching) {
    return <LoadingQuote />;
  }
  return (
    <Card className={`w-full border border-highlight/20 bg-transparent text-white backdrop-blur-xl max-w-md shadow-xl rounded-none`}>
      {isSuccess && (
        <div className='absolute inset-0 pointer-events-none'>
          {/* Tick animation */}
          <svg className='absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 backdrop-blur-sm' viewBox='0 0 100 100'>
            {/* Outer glow circle */}
            <circle cx='50' cy='50' r='45' fill='none' stroke='#E77810' strokeWidth='1' strokeOpacity='0.2' className='animate-pulse' />

            {/* Main circle */}
            <circle cx='50' cy='50' r='40' fill='none' stroke='#E77810' strokeWidth='4' strokeLinecap='round' strokeDasharray='251.2' className='animate-[circle-draw_1.2s_cubic-bezier(0.4,0,0.2,1)_forwards]' />

            {/* Check mark */}
            <path d='M30 50l15 15 25-30' fill='none' stroke='#E77810' strokeWidth='4' strokeLinecap='round' strokeLinejoin='round' strokeDasharray='80' className='animate-[check-draw_0.8s_cubic-bezier(0.4,0,0.2,1)_0.8s_forwards]' />

            {/* Inner glow */}
            <circle cx='50' cy='50' r='35' fill='none' stroke='#E77810' strokeWidth='2' strokeOpacity='0.15' className='animate-pulse' />
          </svg>

          {/* Enhanced shimmer effect */}
          <div className='absolute inset-0 overflow-hidden'>
            <div className='absolute inset-0'>
              {/* Primary shimmer */}
              <div className='absolute inset-0 animate-[shimmer-primary_3s_ease-in-out_infinite]'>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-highlight/30 to-transparent -translate-x-full' />
              </div>
              {/* Secondary shimmer */}
              <div className='absolute inset-0 animate-[shimmer-secondary_4s_ease-in-out_infinite_1s]'>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-highlight/30 to-transparent -translate-x-full' />
              </div>
              {/* Radial glow */}
              <div className='absolute inset-0 animate-[glow_2s_ease-in-out_infinite]'>
                <div className='absolute inset-0 bg-radial-gradient opacity-30' />
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes circle-draw {
              from {
                stroke-dashoffset: 126;
              }
              to {
                stroke-dashoffset: 0;
              }
            }

            @keyframes check-draw {
              from {
                stroke-dashoffset: 40;
              }
              to {
                stroke-dashoffset: 0;
              }
            }

            @keyframes shimmer-primary {
              0% {
                transform: translateX(-100%);
                opacity: 0;
              }
              50% {
                opacity: 1;
              }
              100% {
                transform: translateX(100%);
                opacity: 0;
              }
            }

            @keyframes shimmer-secondary {
              0% {
                transform: translateX(-100%);
                opacity: 0;
              }
              50% {
                opacity: 0.8;
              }
              100% {
                transform: translateX(100%);
                opacity: 0;
              }
            }

            @keyframes glow {
              0%,
              100% {
                opacity: 0.2;
              }
              50% {
                opacity: 0.4;
              }
            }

            .bg-radial-gradient {
              background: radial-gradient(circle at center, #22c55e 0%, transparent 70%);
            }
          `}</style>
        </div>
      )}

      <CardContent className='p-3 space-y-2 bg-[#130401] rounded-none'>
        <div className='space-y-2'>
          {/* From Token */}
          <div className='flex items-center gap-2 justify-between'>
            <h3 className='text-lg font-semibold'>Action Summary</h3>
            <div className='flex items-center gap-2 p-2 px-5 rounded-lg bg-white/10'>
              <img src={'/sonic.webp'} alt='Sonic' className='w-6 h-6 rounded-full' />
              <p className='text-lg font-semibold'>Sonic</p>
            </div>
          </div>

          <div className='space-y-2 p-5 border border-[#582D24] rounded-xl border-highlight/20 relative overflow-hidden bg-highlight/5 backdrop-blur-sm shadow-inner shadow-[#FEA52B]'>
            <div className='absolute pointer-events-none left-0 top-0 z-0 opacity-30'>
              <div className='absolute inset-0 pointer-events-none opacity-50 z-0'>
                <img src='/tweet-background-card.png' alt='Background' className='absolute -top-0 -left-0' />
              </div>
              <img src='/tweet-card.svg' alt='Decoration' className='w-full h-full z-5' />
            </div>
            <div className='flex justify-between items-center'>
              <div className='flex justify-between items-center'>
                <div>
                  <div className='flex items-center gap-2'>
                    <ImageRender src={mode === 'buy' ? '/sonic.webp' : token.logo} alt={mode === 'buy' ? 'S' : token.symbol} className='w-6 h-6 rounded-full' />
                    <p className='text-lg font-medium'>{mode === 'buy' ? Number((amount / Math.pow(10, 18)).toFixed(10)) : Number((amount / Math.pow(10, token.decimals)).toFixed(8))}</p>
                    <p className='text-lg font-semibold'>{mode === 'buy' ? 'S' : token.symbol}</p>
                  </div>
                </div>
              </div>

              <div className='flex justify-between items-center'>
                <ArrowRight className='w-6 h-6' />
              </div>

              <div className=''>
                <div className='flex justify-between items-center'>
                  <div>
                    <div className='flex items-center gap-2'>
                      <ImageRender src={mode === 'buy' ? token.logo : '/sonic.webp'} alt={mode === 'buy' ? token.symbol : 'S'} className='w-6 h-6 rounded-full' />
                      <p className='text-lg font-medium'>{quote?.outAmounts?.[0] ? (Number(quote.outAmounts[0]) / Math.pow(10, mode === 'buy' ? token.decimals : 18)).toFixed(6) : '0.00'}</p>
                      <p className='text-lg font-semibold'>{mode === 'buy' ? token.symbol : 'S'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route slippage and price impact */}
            <div className='flex gap-2 items-center'>
              <div className='flex items-center border-[#582D24] border rounded p-1 px-2 gap-2'>
                <p className='text-sm text-zinc-400'>Slippage:</p>
                <p className='text-sm text-white'>{quote?.slippage || 0}%</p>
              </div>
              <div className='flex items-center border-[#582D24] border rounded p-1 px-2 gap-2'>
                <p className='text-sm text-zinc-400'>Price Impact:</p>
                <p className='text-sm text-white'>{Number(quote?.priceImpact).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className='flex flex-col'>
          <div className='flex justify-between gap-2'>
            <p className='text-sm text-zinc-400'>Transaction Hash:</p>
            <div className='flex items-center gap-2'>
              <p className='text-sm text-white'>
                {isSuccess?.tx?.hash?.slice(0, 6)}...{isSuccess?.tx?.hash?.slice(-4)}
              </p>
              <a href={`https://sonicscan.org/tx/${isSuccess?.tx?.hash}`} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='w-4 h-4' />
              </a>
            </div>
          </div>
          <div className='flex justify-between gap-2'>
            <p className='text-sm text-zinc-400'>Status:</p>
            <p className={`text-sm ${isCancel ? 'text-red-500' : isSuccess ? 'text-green-500' : 'text-yellow-500'}`}>{isCancel ? 'Canceled' : isSuccess ? 'Success' : 'Waiting for confirmation'}</p>
          </div>
        </div>

        {/*  */}
        {!isCancel ? (
          <div className='flex gap-2 justify-between'>
            {error ? (
              <div className='w-full text-sm bg-red-500 text-white flex items-center justify-center gap-2 px-4 py-2 rounded-md'>
                <X className='w-4 h-4' />
                <p className='text-sm w-full text-center word-break-all flex-wrap break-words'>{error}</p>
              </div>
            ) : isSuccess ? (
              <a
                href={`https://sonicscan.org/tx/${isSuccess?.tx?.hash}`}
                target='_blank'
                rel='noopener noreferrer'
                className='w-full text-sm border-highlight/80 border bg-white/10 hover:bg-white/20 text-highlight flex items-center justify-center gap-2 px-4 py-3 rounded-sm'
              >
                View on Explorer
                <ExternalLink className='w-4 h-4' />
              </a>
            ) : (
              <div className='flex gap-2 w-full items-center'>
                <Button className='w-1/3 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2' onClick={() => setIsCancel(true)} disabled={onConfirming}>
                  <X className='w-4 h-4' />
                  Cancel
                </Button>
                <Button className='w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2' disabled={!quote || onConfirming} onClick={_HandleConfirmSwapClick}>
                  {onConfirming ? <Loader2 className='w-4 h-4 animate-spin' /> : <Check className='w-4 h-4' />}
                  Confirm Swap
                </Button>
                <Button className='w-1/3 bg-transparent border border-highlight/20 hover:border-highlight/50 py-5 text-highlight flex items-center justify-center gap-2' onClick={() => setOnFetching(true)} disabled={onConfirming}>
                  <RefreshCcw className='w-4 h-4' />
                  {countdown}s
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
});

const ImageRender = React.memo(
  ({ src, alt, className }: { src: string; alt: string; className: string }) => {
    const [hasError, setHasError] = useState(false);
    const fallbackImage = 'https://sonicscan.org/token/images/default.png';

    // Early return for performance optimization
    if (hasError) {
      return <div className='h-6 w-6 rounded-full bg-zinc-900/50 flex items-center justify-center' />;
    }

    // Use callback reference to avoid creating new function on each render
    const handleError = useCallback(() => {
      setHasError(true);
    }, []);

    return <img src={src || fallbackImage} alt={alt} className={className} onError={handleError} loading='lazy' decoding='async' />;
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memoization
    return prevProps.src === nextProps.src && prevProps.className === nextProps.className;
  }
);

SwapQuote.displayName = 'SwapQuote';

export default SwapQuote;
