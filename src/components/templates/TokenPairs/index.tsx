'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { CopyIcon } from 'lucide-react';
import { ChartDialog } from '@/components/auth/Chart';

import TokenInfo from '../TokenInfo';

interface Pair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
    h6: {
      buys: number;
      sells: number;
    };
    h24: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info: {
    imageUrl?: string;
    header: string;
    openGraph: string;
    websites: string[];
    socials: {
      type: string;
      url: string;
    }[];
  };
}

const formatNumber = (num: number, decimals = 2) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
};

const TableRow = React.memo(({ pair, index, selectedPair, onSelect }: { pair: any; index: number; selectedPair: number | null; onSelect: (index: number) => void }) => {
  const isSelected = selectedPair === index;
  const [copied, setCopied] = useState(false);

  const _HandleSelect = (index: any) => {
    onSelect(index);
    const info = pair;
    console.log('🚀 ~ _HandleSelect ~ info:', info);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pair.baseToken.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  console.log('🚀 ~ pair:', pair);

  return (
    <div className='flex flex-row items-center justify-between p-3 hover:bg-primary-700/20 backdrop-blur-sm transition-all duration-300 border-b border-primary-700/10'>
      {/* Token Info Column */}
      <div className='flex items-center gap-3 flex-1 min-w-[200px]'>
        <div className='relative group'>
          <img
            src={pair?.info?.imageUrl}
            alt={pair?.baseToken?.symbol}
            className='w-8 h-8 rounded-full object-cover transition-transform group-hover:scale-110'
            onError={(e) => {
              e.currentTarget.src = 'https://cdn.bullx.ai/tokens/default.png';
            }}
          />
        </div>
        <div className='flex flex-col'>
          <div className='text-primary-200 font-medium'>
            {pair?.baseToken?.symbol}/{pair?.quoteToken?.symbol}
          </div>
          <div className='flex items-center gap-1'>
            <span className='text-xs text-primary-400 font-mono bg-primary-700/30 px-1.5 py-0.5 rounded'>
              {pair.baseToken.address.slice(0, 4)}...
              {pair.baseToken.address.slice(-4)}
            </span>
            <Button size='sm' variant='ghost' className='h-5 w-5 p-0 hover:bg-primary-700/30' onClick={handleCopy}>
              {copied ? <CheckIcon className='h-3 w-3 text-green-400' /> : <CopyIcon className='h-3 w-3 text-primary-400' />}
            </Button>
          </div>
        </div>
      </div>

      {/* Price & Change Column */}
      <div className='flex flex-col items-end min-w-[120px]'>
        <div className='font-medium bg-gradient-to-r from-primary-400 to-primary-400 bg-clip-text text-transparent'>
          $
          {Number(pair?.priceUsd)?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
        </div>
        <div className={`text-sm ${pair?.priceChange?.h24 > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {pair?.priceChange?.h24 > 0 ? '+' : ''}
          {pair?.priceChange?.h24?.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
          %
        </div>
      </div>

      {/* Volume & MCap Column */}
      <div className='hidden sm:flex flex-col items-end min-w-[100px]'>
        <div className='text-sm text-primary-200'>${formatNumber(pair?.volume?.h24)}</div>
        <div className='text-xs text-primary-400'>${formatNumber(pair?.marketCap || 0)}</div>
      </div>

      {/* Actions Column */}
      <div className='flex items-center gap-2 min-w-[90px] justify-end'>
        <Button
          onClick={() => _HandleSelect(index)}
          variant={isSelected ? 'secondary' : 'default'}
          className={`h-8 w-8 p-0 ${isSelected ? 'bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 border border-primary-500/30' : 'bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 border border-primary-500/30'}`}
        >
          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
          </svg>
        </Button>
        <ChartDialog address={pair?.baseToken?.address} className='h-8 w-8 p-0 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 border border-primary-500/30' />
      </div>
    </div>
  );
});

TableRow.displayName = 'TableRow';

const CryptoPairsTable: React.FC<{
  pairs: any[];
  triggerMessage?: any;
  prefixPrompt?: any;
}> = ({ pairs, triggerMessage, prefixPrompt }) => {
  const [selectedPair, setSelectedPair] = useState<number | null>(null);

  const handleSelect = useCallback((index: number) => {
    setSelectedPair((prev) => (prev === index ? null : index));
    const next_prompt = `${prefixPrompt?.replace('____', pairs[index]?.baseToken?.symbol)}. Please token address: ${pairs[index]?.baseToken?.address}`;
    triggerMessage(next_prompt);
  }, []);

  return (
    <div className='w-full max-w-4xl px-2 space-y-3'>
      <h1 className='text-2xl font-bold bg-gradient-to-r from-primary-400 via-primary-400 to-primary-400 bg-clip-text text-transparent'>Trading Pairs</h1>
      {selectedPair === null && (
        <div className='overflow-hidden rounded-xl border border-highlight/20  /50 bg-gradient-to-r from-primary-800/50 via-primary-900/20 to-primary-800/50 backdrop-blur-sm'>
          <div className='w-full hidden md:block divide-y divide-highlight/20'>
            {pairs?.map((pair: Pair, index: number) => (
              <TableRow key={index} pair={pair} index={index} selectedPair={selectedPair} onSelect={handleSelect} />
            ))}
          </div>
          <div className='md:hidden divide-y divide-highlight/20'>
            {pairs?.map((pair: Pair, index: number) => (
              <TableRow key={index} pair={pair} index={index} selectedPair={selectedPair} onSelect={handleSelect} />
            ))}
          </div>
        </div>
      )}
      {selectedPair !== null && (
        <div className='max-w-lg'>
          <TokenInfo tokenInfo={pairs[selectedPair]} />
        </div>
      )}
    </div>
  );
};

export default React.memo(CryptoPairsTable);
