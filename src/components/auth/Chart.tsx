'use client';

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';

const ChartDialogContent = memo(({ onClose, poolAddress }: { onClose: () => void; poolAddress: string }) => (
  <DialogContent className='bg-black/95 border border-primary-800 text-primary-100 p-0 w-full h-auto max-w-4xl m-0 shadow-xl backdrop-blur-sm'>
    <DialogHeader className='p-4 border-b border-primary-800 flex items-center justify-between'>
      <DialogTitle className='text-lg font-bold bg-gradient-to-r from-primary-300 via-primary-400 to-primary-500 bg-clip-text text-transparent'>Market Chart</DialogTitle>
    </DialogHeader>
    <div className='p-4 h-[calc(100vh-4rem)]'>
      <Card className='bg-primary-900/50 border border-primary-800 p-2 h-full overflow-hidden rounded-xl'>
        <style>
          {`
            #dexscreener-embed {
              position: relative;
              width: 100%;
              height: 100%;
              border-radius: 0.5rem;
              overflow: hidden;
            }
            #dexscreener-embed iframe {
              position: absolute;
              width: 100%;
              height: 100%;
              top: 0;
              left: 0;
              border: 0;
            }
          `}
        </style>
        <div id='dexscreener-embed'>
          {!poolAddress ? (
            <div className='flex items-center justify-center h-full bg-primary-900/80'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400'></div>
              <span className='ml-3 text-primary-300'>Loading chart data...</span>
            </div>
          ) : (
            <iframe src={`https://dexscreener.com${poolAddress}?embed=1&loadChartSettings=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=usd&interval=15`} title='DexScreener Chart' loading='lazy'></iframe>
          )}
        </div>
      </Card>
    </div>
  </DialogContent>
));

ChartDialogContent.displayName = 'ChartDialogContent';

export const ChartDialog = memo(({ address, className, mode = 'default' }: { address: string; className?: string; mode?: 'default' | 'expanded' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [poolAddress, setPoolAddress] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPoolAddress = useCallback(async () => {
    // Clean up previous controller if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${address}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      if (result?.pairs?.[0]?.url) {
        const pool = result.pairs[0].url.replace('https://dexscreener.com', '');
        setPoolAddress(pool);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Chart data fetch aborted');
        return;
      }
      console.error('Error fetching chart data:', error);
    }
  }, [address]);

  useEffect(() => {
    if (isOpen && address) {
      fetchPoolAddress();
    }

    return () => {
      // Clean up on unmount or when dependencies change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchPoolAddress, isOpen, address]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPoolAddress('');
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {mode === 'default' ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-primary-300 hover:text-primary-200 bg-primary-800/40 hover:bg-primary-700/50 rounded-md transition-all duration-200 ${className}`}
            aria-label='Open chart'
          >
            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' />
            </svg>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center justify-center gap-2 bg-primary-700/50 hover:bg-primary-600/60 px-3 py-2 rounded-lg border border-primary-500/30 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-primary-500/20 ${className}`}
            title='View price chart'
          >
            <svg className='text-primary-300 w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' />
            </svg>
            <span className='whitespace-nowrap'>Chart</span>
          </motion.button>
        )}
      </DialogTrigger>
      <AnimatePresence>{isOpen && <ChartDialogContent onClose={() => handleOpenChange(false)} poolAddress={poolAddress} />}</AnimatePresence>
    </Dialog>
  );
});

ChartDialog.displayName = 'ChartDialog';

export default ChartDialog;
