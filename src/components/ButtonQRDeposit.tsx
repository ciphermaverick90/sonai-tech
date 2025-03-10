import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { FaQrcode, FaTimes, FaCopy, FaCheck, FaBell } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ButtonQRCode = React.memo(({ children, className }: { children?: React.ReactNode; className?: string }) => {
  const [showQR, setShowQR] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [animateQR, setAnimateQR] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);
  const auth = useSelector((state: any) => state.auth);
  const walletAddress = auth?.wallet?.address || '';
  const qrRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<ethers.WebSocketProvider | null>(null);

  // Memoize handlers to prevent unnecessary re-renders
  const handleCopyAddress = useCallback(async () => {
    if (!walletAddress) return;

    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopySuccess(true);
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  }, [walletAddress]);

  const handleOpenQR = useCallback(() => {
    setShowQR(true);
    // Delay animation slightly for better performance
    requestAnimationFrame(() => {
      setAnimateQR(true);
    });
  }, []);

  const handleCloseQR = useCallback(() => {
    setAnimateQR(false);
    setShowQR(false);
  }, []);

  // Listen for incoming transactions when QR code is displayed
  useEffect(() => {
    if (!walletAddress || !showQR) return;

    const setupTransactionListener = async () => {
      try {
        // Only create a new WebSocket provider if one doesn't already exist
        if (!providerRef.current) {
          const wsProvider = new ethers.WebSocketProvider('wss://sonic-rpc.publicnode.com:443');
          providerRef.current = wsProvider;
          console.log('WebSocket transaction listener set up for address:', walletAddress);

          // Set up the listener only once when provider is created
          const provider = providerRef.current;
          setIsListening(true);

          // Listen for new blocks instead of pending transactions
          provider.on('block', async (blockNumber) => {
            try {
              // Only process if QR is still showing
              if (!showQR) return;
              const block = await provider.getBlock(blockNumber, true);
              if (!block || !block.transactions) return;

              // Check transactions in the block for transfers to our address
              for (const tx of block.transactions) {
                const transaction = await provider.getTransaction(tx);
                if (!transaction) continue;

                if (transaction.to?.toLowerCase() === walletAddress.toLowerCase() && transaction.value > 0) {
                  // Avoid duplicate notifications
                  if (lastTransaction === transaction.hash) continue;

                  setLastTransaction(transaction.hash);

                  // Format the amount
                  const amount = ethers.formatEther(transaction.value);
                  const fromAddress = transaction.from.slice(0, 6) + '...' + transaction.from.slice(-4);

                  // Show notification
                  toast.success(
                    <div className='flex flex-col gap-1'>
                      <span className='font-bold'>Incoming Transaction!</span>
                      <span>
                        Received {parseFloat(amount).toFixed(4)} ETH from {fromAddress}
                      </span>
                    </div>,
                    {
                      position: 'top-right',
                      autoClose: 5000,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                    }
                  );

                  // Trigger balance update
                  window.postMessage({ type: 'BALANCE_UPDATE_TRIGGER' }, '*');
                }
              }
            } catch (error) {
              console.error('Error processing block:', error);
            }
          });
        }
      } catch (error) {
        console.error('Failed to set up WebSocket transaction listener:', error);
        setIsListening(false);
      }
    };

    // Only set up the listener if not already listening
    if (!isListening) {
      setupTransactionListener();
    }

    // Don't disconnect on every render, only when component unmounts
    return () => {
      if (!showQR && providerRef.current) {
        providerRef.current.removeAllListeners('block');
        providerRef.current = null;
        setIsListening(false);
        console.log('WebSocket transaction listener stopped');
      }
    };
  }, [walletAddress, isListening, lastTransaction, showQR]);

  // Optimize 3D effect with throttling and hardware acceleration
  useEffect(() => {
    if (!qrRef.current || !showQR) return;

    const qrElement = qrRef.current;
    let rafId: number;
    let lastMoveTime = 0;
    const THROTTLE_MS = 16; // ~60fps

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMoveTime < THROTTLE_MS) return;

      lastMoveTime = now;
      cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const rect = qrElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const tiltX = (y - centerY) / 10;
        const tiltY = (centerX - x) / 10;

        qrElement.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        qrElement.style.willChange = 'transform';
      });
    };

    const handleMouseLeave = () => {
      cancelAnimationFrame(rafId);
      qrElement.style.transition = 'transform 0.3s ease-out';
      qrElement.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

      // Reset willChange after transition to free up resources
      setTimeout(() => {
        qrElement.style.willChange = 'auto';
      }, 300);
    };

    qrElement.addEventListener('mousemove', handleMouseMove, { passive: true });
    qrElement.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      qrElement.removeEventListener('mousemove', handleMouseMove);
      qrElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [showQR]);

  // Memoize QR code to prevent re-rendering
  const qrCodeElement = useMemo(() => (walletAddress ? <QRCode value={walletAddress} size={240} level='H' className='rounded-lg' /> : null), [walletAddress]);

  return (
    <>
      <button
        onClick={handleOpenQR}
        className={`p-2 bg-primary-500/20 rounded-sm transition-all duration-200 hover:bg-primary-500/30 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-primary-500/10 focus:outline-none focus:ring-2 focus:ring-primary-400/50 ${className || ''}`}
        aria-label='Show QR code'
        title='View wallet QR code'
      >
        {children || (
          <div className='relative overflow-hidden group'>
            <FaQrcode size={24} className='text-primary-400 transition-all duration-300 hover:text-primary-300 transform-gpu relative z-10' />
            <div className='absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse'></div>
          </div>
        )}
      </button>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className='bg-gradient-to-br from-highlight/10 to-highlight/5 backdrop-blur border border-highlight/40 max-w-md p-0 shadow-2xl'>
          <div className='relative'>
            <DialogHeader className='p-6 pb-0'>
              <DialogTitle className='text-2xl font-bold bg-gradient-to-r from-primary-300 to-primary-100 bg-clip-text text-transparent text-center drop-shadow-sm'>
                Wallet Address QR
                <div className='h-1 w-1/2 bg-gradient-to-r from-primary-400 to-transparent rounded-full mx-auto mt-1 animate-pulse'></div>
              </DialogTitle>
            </DialogHeader>

            <div className='flex flex-col items-center gap-6 relative z-10 p-6'>
              <div className='flex items-center justify-center gap-2'>
                <img src='/sonic.webp' alt='SONAI Logo' className='h-8 w-auto' />
                <span className='text-primary-200 font-semibold text-2xl'>$SONIC</span>
              </div>
              {walletAddress && (
                <div
                  ref={qrRef}
                  className='bg-white p-4 rounded-xl shadow-inner hover:shadow-md transition-all duration-300 hover:shadow-primary-400/20'
                  style={{
                    transition: 'transform 0.2s ease-out, box-shadow 0.3s ease',
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(0)', // Force hardware acceleration
                  }}
                >
                  <div className='relative'>
                    {qrCodeElement}
                    <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-300/30 rounded-lg pointer-events-none'></div>
                  </div>
                </div>
              )}

              <div className='flex flex-col items-center gap-3 w-full'>
                <div className='bg-transparent px-4 py-3 rounded-lg w-full border border-highlight/40 relative overflow-hidden group shadow-inner shadow-highlight/20'>
                  <div className='absolute inset-0 bg-gradient-to-r from-highlight/10 to-highlight/5 transform translate-x-full group-hover:translate-x-0 transition-transform duration-700 pointer-events-none'></div>
                  <p className='text-sm text-primary-200 font-mono break-all text-center relative z-10'>
                    {walletAddress.slice(0, 18)}...{walletAddress.slice(-18)}
                  </p>
                </div>

                <button
                  onClick={handleCopyAddress}
                  className={`w-full py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium relative overflow-hidden transform-gpu
                    ${
                      copySuccess
                        ? 'bg-green-500/20 text-green-300 border border-highlight/30 shadow-md shadow-green-500/20'
                        : 'bg-primary-700/40 text-highlight hover:bg-primary-600/50 hover:text-primary-200 border border-highlight/30 hover:border-highlight/50 hover:shadow-md hover:shadow-primary-500/20'
                    }`}
                  disabled={!walletAddress || copySuccess}
                >
                  {!copySuccess && <div className='absolute inset-0 bg-gradient-to-r from-highlight/10 to-highlight/5 transform translate-x-full hover:translate-x-0 transition-transform duration-500'></div>}
                  {copySuccess ? (
                    <>
                      <FaCheck size={14} className='text-green-500 animate-bounce' />
                      <span className='font-semibold'>Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <FaCopy size={14} className='text-highlight group-hover:rotate-12 transition-transform' />
                      <span className='font-semibold'>Copy Address</span>
                    </>
                  )}
                </button>

                <div className='w-full mt-2 px-4 py-2 rounded-lg text-center shadow-inner shadow-green-500/5'>
                  <p className='text-sm text-green-300 flex gap-2 font-medium'>
                    <FaBell className='animate-[pulse_1.5s_ease-in-out_infinite]' />
                    <span className='bg-gradient-to-r from-green-300 to-green-200 bg-clip-text text-transparent'>Listening for incoming transactions</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

ButtonQRCode.displayName = 'ButtonQRCode';

export default ButtonQRCode;
