'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Copy, ExternalLink, TrendingUp, DollarSign, Droplet, BarChart2, Send, Twitter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useState, useMemo, memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  notation: 'compact',
});

const formatNumber = (num: number, compact = false) => {
  return (compact ? compactNumberFormatter : numberFormatter).format(num);
};

const PriceChange = memo(({ value }: { value: number }) => {
  const isPositive = value >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-1`}>
      <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
        {' '}
        {isPositive ? '+' : '-'}
        {Number(Math.abs(Number(value) || 0).toFixed(2)).toLocaleString()}%
      </span>
    </motion.div>
  );
});
PriceChange.displayName = 'PriceChange';

const AddressDisplay = memo(({ address }: { address: string }) => {
  const [copied, setCopied] = useState(false);
  const truncatedAddress = useMemo(() => address?.slice(0, 4) + '...' + address?.slice(-4), [address]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='flex items-center gap-2 transition-all'>
      <span className='text-sm text-zinc-300 font-medium'>{truncatedAddress}</span>
      <Button variant='ghost' size='icon' className='h-6 w-6 hover:bg-zinc-800' onClick={copyToClipboard}>
        <Copy className='h-3 w-3' />
        <span className='sr-only'>Copy address</span>
      </Button>
      {copied && (
        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className='text-xs text-emerald-500'>
          Copied!
        </motion.span>
      )}
    </div>
  );
});
AddressDisplay.displayName = 'AddressDisplay';

const TimeBasedStats = memo(({ priceChange }: { priceChange: any }) => (
  <div className='grid grid-cols-4 gap-2 p-3 bg-zinc-900/50 rounded-xl'>
    {['5m', '1h', '6h', '24h'].map((period) => {
      const key = period === '5m' ? 'm5' : `h${period.replace('h', '')}`;
      return (
        <TooltipProvider key={period}>
          <Tooltip>
            <TooltipTrigger>
              <div className='text-center p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-all cursor-help'>
                <div className='text-xs text-zinc-400 mb-1 font-medium'>{period}</div>
                <PriceChange value={priceChange?.[key]} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Price change in last {period}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    })}
  </div>
));
TimeBasedStats.displayName = 'TimeBasedStats';

const TokenNotFound = () => (
  <Card className='w-full border border-[#582D24] bg-black/50 text-white backdrop-blur-xl shadow-xl'>
    <CardContent className='p-8 text-center space-y-4'>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className='mx-auto w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center'>
        <ExternalLink className='w-8 h-8 text-zinc-400' />
      </motion.div>
      <h2 className='text-xl font-semibold text-zinc-200'>Token Not Found</h2>
      <p className='text-zinc-400 text-sm max-w-md mx-auto'>We couldn't locate this token. It might not exist or hasn't been indexed yet. Please verify the token address and try again.</p>
    </CardContent>
  </Card>
);

const TokenCard = memo(({ tokenInfo }: { tokenInfo: any }) => {
  if (!tokenInfo?.baseToken?.address) {
    return <TokenNotFound />;
  }

  return (
    <Card className='w-full border border-[#582D24] bg-[#130401] text-white backdrop-blur-xl shadow-xl'>
      <CardContent className='p-3 space-y-3'>
        <div>
          <div className='flex items-center gap-3'>
            <motion.img initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={tokenInfo?.info?.imageUrl || '/placeholder.svg'} alt={tokenInfo?.baseToken?.name} className='w-12 h-12 rounded-full ring-1 ring-zinc-800 p-0.5 bg-zinc-900' />
            <div className='w-full space-y-1'>
              <div className='flex justify-between w-full'>
                <div className='flex items-center gap-2'>
                  <div>
                    <h2 className='text-base font-bold text-white items-center flex gap-1'>
                      <span>
                        {tokenInfo?.baseToken?.symbol}/{tokenInfo?.quoteToken?.symbol}
                      </span>
                      <AddressDisplay address={tokenInfo?.baseToken?.address} />
                    </h2>
                  </div>
                </div>
                <div className='flex items-baseline gap-3'>
                  <div className='text-lg font-bold tracking-tight text-white'>${Number(tokenInfo?.priceUsd || 0).toFixed(5)}</div>
                  <div className='flex items-center gap-3'>
                    <div className='flex items-center gap-1'>
                      <span className='text-xs text-zinc-400'>1H</span>
                      <PriceChange value={tokenInfo?.priceChange?.h1} />
                    </div>
                    <div className='flex items-center gap-1'>
                      <span className='text-xs text-zinc-400'>24H</span>
                      <PriceChange value={tokenInfo?.priceChange?.h24} />
                    </div>
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-2 text-sm justify-between'>
                <div className='flex items-center border-[#582D24] border rounded p-1 px-2 gap-2'>
                  <span className='text-gray-500'>Mkt Cap: </span>
                  <span>${formatNumber(tokenInfo?.marketCap || 0, true)}</span>
                </div>
                <div className='flex items-center border-[#582D24] border rounded p-1 px-2 gap-2'>
                  <span className='text-gray-500'>Liq: </span>
                  <span>${formatNumber(tokenInfo?.liquidity?.usd || 0, true)}</span>
                </div>
                <div className='flex items-center border-[#582D24] border rounded p-1 px-2 gap-2'>
                  <span className='text-gray-500'>24h Vol: </span>
                  <span>${formatNumber(tokenInfo?.volume?.h24 || 0, true)}</span>
                </div>
                <div className='flex items-center border-[#582D24] border rounded p-1 px-2 gap-2'>
                  <span className='text-gray-500'>Tsx: </span>
                  <div className='flex items-center gap-1'>
                    <span className='text-green-500'>{tokenInfo?.txns?.h24?.buys || 0}</span>
                    <span className='text-red-500'>{tokenInfo?.txns?.h24?.sells || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex gap-3'>
            <Button variant='outline' size='sm' className='border-0 !bg-transparent ' onClick={() => window.open(`https://twitter.com/search?q=${tokenInfo?.baseToken?.symbol}`, '_blank')}>
              <Twitter className='w-3 h-3 mr-1' />
              Twitter
            </Button>
            <Button variant='outline' size='sm' className='border-0 !bg-transparent ' onClick={() => window.open(`https://t.me/s/${tokenInfo?.baseToken?.symbol}`, '_blank')}>
              <Send className='w-3 h-3 mr-1' />
              Telegram
            </Button>
            <Button variant='outline' size='sm' className='border-0 !bg-transparent ' onClick={() => window.open(`https://sonicscan.org/token/${tokenInfo?.baseToken?.address}  `, '_blank')}>
              <ExternalLink className='w-3 h-3 mr-1' />
              Explorer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TokenCard.displayName = 'TokenCard';

export default TokenCard;
