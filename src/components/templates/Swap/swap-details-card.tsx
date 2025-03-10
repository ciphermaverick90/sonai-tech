'use client';

import React, { useState, useMemo, memo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { ArrowRightCircle, CheckCircle, XCircle, Copy, ExternalLink, TrendingUp, Clock, DollarSign, RefreshCw, Droplet, Percent, AlertTriangle, Layers, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useDispatch } from 'react-redux';

interface SwapDetails {
  success: boolean;
  signature: string;
  mode: string;
  symbol: string;
  decimals: number;
  route?: {
    inAmount: string;
    outAmount: string;
    platformFee?: {
      feeBps?: number;
      feeUsd?: number;
    };
    priceImpactPct: string;
    routePlan: Array<{
      swapInfo: {
        label: string;
      };
      percent: number;
    }>;
    slippageBps: number;
    swapUsdValue: string;
  };
  executionTimeQuote?: number;
  executionTimeSwap?: number;
  executionTimeChain?: number;
  executionTime?: number;
  error?: string;
}

const MetricItem = memo(function MetricItem({
  label,
  value,
  className = '',
  icon,
  tooltip,
  highlight = false,
  alert = false,
}: {
  label: string;
  value: string;
  className?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`
          flex flex-col p-2 sm:p-2.5 rounded-lg border transition-all duration-200
          ${highlight ? 'bg-gradient-to-br from-primary/10 to-primary/10 border-primary/30 hover:border-primary/50' : alert ? 'bg-red-500/10 border-red-500/30 hover:border-red-400/50' : 'bg-primary/10 border-primary/20 hover:border-primary/30'}
          ${className}
        `}
        >
          <div className='flex items-center gap-1 sm:gap-1.5 mb-1'>
            {icon}
            <span className='text-[10px] sm:text-xs text-primary'>{label}</span>
          </div>
          <span className={`text-xs sm:text-sm font-medium ${alert ? 'text-red-400' : 'text-white'}`}>{value}</span>
        </div>
      </TooltipTrigger>
      {tooltip && (
        <TooltipContent>
          <p className='text-xs'>{tooltip}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
});

const SwapDetailsCard = memo(function SwapDetailsCard({ details }: { details: SwapDetails }) {
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculatedMetrics = useMemo(() => {
    if (!details?.success || !details?.route) {
      return {
        inputValue: '0',
        outputValue: '0',
        valueRetained: '0',
        swapEfficiency: '0',
        executionSpeed: '0',
        slippageRate: '0',
        pricePerToken: '0',
        quoteTime: '0',
        swapTime: '0',
        chainTime: '0',
      };
    }

    const inputValue = details?.mode === 'sell' ? Number(details?.route?.inAmount) / Math.pow(10, details?.decimals) : Number(details?.route?.inAmount) / 1e9;
    const outputValue = details?.mode === 'sell' ? Number(details?.route?.outAmount) / 1e9 : Number(details?.route?.outAmount) / Math.pow(10, details?.decimals);
    const valueRetained = (outputValue / inputValue) * 100;
    const swapEfficiency = 100 - (Number(details?.route?.priceImpactPct) + (details?.route?.platformFee?.feeBps || 0) / 100);
    const executionSpeed = details?.executionTime ? details?.executionTime * 1000 : 0;
    const slippageRate = details?.route?.slippageBps / 100;
    const pricePerToken = (Number(details?.route?.swapUsdValue) / outputValue).toFixed(4);

    return {
      inputValue: inputValue?.toFixed(4),
      outputValue: outputValue?.toFixed(4),
      valueRetained: valueRetained?.toFixed(2),
      swapEfficiency: swapEfficiency?.toFixed(2),
      executionSpeed: executionSpeed?.toFixed(0),
      slippageRate: slippageRate?.toFixed(2),
      pricePerToken,
      quoteTime: details?.executionTimeQuote?.toFixed(2),
      swapTime: details?.executionTimeSwap?.toFixed(2),
      chainTime: details?.executionTimeChain?.toFixed(2),
    };
  }, [details]);

  const routePlanBadges = useMemo(() => {
    if (!details?.success || !details?.route?.routePlan) return null;

    return details?.route?.routePlan?.map((step, index) => (
      <Badge key={index} variant='secondary' className='bg-primary/20 text-primary border border-primary/20 text-xs'>
        {step?.swapInfo?.label} ({step?.percent}%)
      </Badge>
    ));
  }, [details?.route?.routePlan]);

  if (!details?.success) {
    return (
      <TooltipProvider>
        <Card className='w-full max-w-2xl bg-black border border-white/20 transition-all duration-300 backdrop-blur-sm shadow-lg'>
          <CardHeader className='flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4 border-b border-white/10'>
            <div className='flex items-center gap-3'>
              <CardTitle className='text-lg sm:text-xl font-bold text-white'>Swap Failed</CardTitle>
              <Badge variant='destructive' className='bg-black/50 text-white border-white/30 rounded-full animate-fade-in'>
                <XCircle className='w-3 h-3 mr-1.5' />
                Failed
              </Badge>
            </div>
          </CardHeader>

          <CardContent className='space-y-4 pt-4'>
            <div className='p-3 sm:p-4 bg-black/20 rounded-xl border border-white/20'>
              <div className='flex flex-col gap-2'>
                <span className='text-xs sm:text-sm text-white/70'>Error Message:</span>
                <span className='text-sm text-white'>{details?.error || 'An unknown error occurred'}</span>
              </div>
            </div>

            <div className='flex items-center justify-end'>
              {details?.signature && (
                <div className='flex items-center gap-2'>
                  <Button variant='ghost' size='sm' className='text-xs hover:text-white text-white hover:bg-white/10 gap-1.5' onClick={() => copyToClipboard(details?.signature)}>
                    {copied ? <CheckCircle className='w-3.5 h-3.5' /> : <Copy className='w-3.5 h-3.5' />}
                    {copied ? 'Copied!' : 'Copy TX'}
                  </Button>

                  <Button variant='ghost' size='sm' className='text-xs hover:text-white text-white hover:bg-white/10 gap-1.5' onClick={() => window.open(`https://solscan.io/tx/${details?.signature}`, '_blank')}>
                    <ExternalLink className='w-3.5 h-3.5' />
                    <span className='hidden sm:inline'>View on Explorer</span>
                    <span className='sm:hidden'>View</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Card className='w-full max-w-2xl bg-[#0F0F2D] border border-primary/20 transition-all duration-300 backdrop-blur-sm shadow-lg'>
        <CardHeader className='flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4 border-b border-primary/10'>
          <div className='flex items-center gap-3'>
            <CardTitle className='text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent'>Swap Summary</CardTitle>
            <Badge variant='default' className='bg-green-500/20 text-green-300 border-green-500/30 rounded-full animate-fade-in'>
              <CheckCircle className='w-3 h-3 mr-1.5' />
              Successful
            </Badge>
          </div>
          <TriggerBalanceSum amount={details?.mode === 'buy' ? Number(details?.route?.inAmount) / 1e9 : Number(details?.route?.outAmount) / 1e9} side={details?.mode} />
        </CardHeader>

        <CardContent className='space-y-4 pt-4'>
          <div className='p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/10 rounded-xl border border-primary/20'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3'>
              <div className='flex flex-col w-full sm:w-auto mb-2 sm:mb-0'>
                <span className='text-xs sm:text-sm text-primary mb-1'>You Pay</span>
                <div className='flex items-center gap-2'>
                  <span className='text-base sm:text-lg font-semibold text-white'>{details?.mode === 'sell' ? `${Number(details?.route?.inAmount) / Math.pow(10, details?.decimals)} ${details?.symbol}` : `${Number(details?.route?.inAmount) / 1e9} SOL`}</span>
                </div>
              </div>
              <ArrowRightCircle className='hidden sm:block w-6 h-6 text-primary animate-pulse mx-4' />
              <div className='flex flex-col w-full sm:w-auto items-start sm:items-end'>
                <span className='text-xs sm:text-sm text-primary mb-1'>You Receive</span>
                <div className='flex items-center gap-2'>
                  <span className='text-base sm:text-lg font-semibold text-white'>{details?.mode === 'sell' ? `${Number(details?.route?.outAmount) / 1e9} SOL` : `${Number(details?.route?.outAmount) / Math.pow(10, details?.decimals)} ${details?.symbol}`}</span>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-4'>
              <MetricItem label='USD Value' value={`$${Number(details?.route?.swapUsdValue).toFixed(2)}`} icon={<DollarSign className='w-4 h-4 text-green-400' />} tooltip={`Price per token: $${calculatedMetrics?.pricePerToken}`} highlight />
              <MetricItem label='Network Fee' value={`${(details?.route?.platformFee?.feeBps || 0) / 100}%`} icon={<Percent className='w-4 h-4 text-primary' />} tooltip='Network fee for processing the swap' />
              <MetricItem
                label='Time Taken'
                value={`${details?.executionTime?.toFixed(1)}s`}
                icon={<Clock className='w-4 h-4 text-primary' />}
                tooltip={`Quote: ${calculatedMetrics?.quoteTime}s | Execution: ${calculatedMetrics?.swapTime}s`}
                className='col-span-2 sm:col-span-1'
              />
            </div>
          </div>

          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0'>
            <Button variant='ghost' size='sm' onClick={() => setShowAdvanced(!showAdvanced)} className='text-primary hover:text-white hover:bg-primary/10 gap-2 w-full sm:w-auto'>
              {showAdvanced ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
              {showAdvanced ? 'Show Less' : 'Show More Details'}
            </Button>

            <div className='flex items-center gap-2 w-full sm:w-auto justify-end'>
              <Button variant='ghost' size='sm' className='text-xs hover:text-white text-primary hover:bg-primary/10 gap-1.5' onClick={() => copyToClipboard(details?.signature)}>
                {copied ? <CheckCircle className='w-3.5 h-3.5' /> : <Copy className='w-3.5 h-3.5' />}
                {copied ? 'Copied!' : 'Copy TX'}
              </Button>

              <Button variant='ghost' size='sm' className='text-xs hover:text-white text-primary hover:bg-primary/10 gap-1.5' onClick={() => window.open(`https://solscan.io/tx/${details?.signature}`, '_blank')}>
                <ExternalLink className='w-3.5 h-3.5' />
                <span className='hidden sm:inline'>View on Explorer</span>
                <span className='sm:hidden'>View</span>
              </Button>
            </div>
          </div>

          {showAdvanced && (
            <div className='space-y-4 animate-in slide-in-from-top duration-300 ease-out'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <MetricItem
                  label='Price Impact'
                  value={`${Number(details?.route?.priceImpactPct).toFixed(2)}%`}
                  icon={<TrendingUp className='w-4 h-4 text-yellow-400' />}
                  tooltip='Effect of your trade on the market price'
                  alert={Number(details?.route?.priceImpactPct) > 1}
                />
                <MetricItem label='Slippage Tolerance' value={`${calculatedMetrics?.slippageRate}%`} icon={<AlertTriangle className='w-4 h-4 text-orange-400' />} tooltip='Maximum allowed price movement' />
              </div>

              <div className='p-3 bg-primary/10 rounded-lg border border-primary/20'>
                <div className='flex items-center gap-2 mb-2'>
                  <Layers className='w-4 h-4 text-primary' />
                  <span className='text-xs sm:text-sm text-primary'>Route Path</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className='w-3.5 h-3.5 text-primary/60' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>The path your swap takes through different liquidity pools</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className='flex flex-wrap gap-2'>{routePlanBadges}</div>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-2'>
                    <RefreshCw className='w-4 h-4 text-primary' />
                    <span className='text-xs sm:text-sm text-primary'>Swap Efficiency</span>
                  </div>
                  <span className='text-xs sm:text-sm text-white'>{calculatedMetrics?.swapEfficiency}%</span>
                </div>
                <Progress
                  value={Number(calculatedMetrics?.swapEfficiency)}
                  className='h-1.5 bg-primary/10'
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${Number(calculatedMetrics?.swapEfficiency) > 95 ? 'rgb(34, 197, 94)' : Number(calculatedMetrics?.swapEfficiency) > 90 ? 'rgb(234, 179, 8)' : 'rgb(239, 68, 68)'} ${Number(
                      calculatedMetrics?.swapEfficiency
                    )}%, transparent 0)`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
});

const TriggerBalanceSum = React.memo(({ amount, side }: { amount: number; side: string }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (side === 'buy') {
      dispatch({
        type: 'SUM_BALANCE',
        payload: -amount,
      });
    } else {
      dispatch({
        type: 'SUM_BALANCE',
        payload: +amount,
      });
    }
    dispatch({
      type: 'SET_ON_FETCHING_ACTIVITIES',
      payload: true,
    });
    setTimeout(() => {
      dispatch({
        type: 'SET_ON_FETCHING_PORTFOLIO',
        payload: true,
      });
    }, 3000);
  }, [side, amount]);

  return null;
});

export default SwapDetailsCard;
