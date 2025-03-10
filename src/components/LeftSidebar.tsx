'use client';

import { useState, useEffect, useCallback, memo, Suspense, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface LeftSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const menuItems = [
  { id: 'terminal', icon: <img src='/terminal-active.png' alt='SONAI Logo' className='w-5 h-5' />, iconUnactive: <img src='/terminal-unactive.png' alt='SONAI Logo' className='w-5 h-5' />, label: 'Terminal', url: '/' },
  { id: 'ai_agent', icon: <img src='/agent-active.png' alt='SONAI Logo' className='w-5 h-5' />, iconUnactive: <img src='/agent-unactive.png' alt='SONAI Logo' className='w-5 h-5' />, label: 'AI Agent', url: '/agent' },
] as const;

// Optimized animation variants with memoization
const sidebarVariants = {
  open: {
    width: 240,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40,
      mass: 1,
    },
  },
  closed: (isMobile: boolean) => ({
    width: isMobile ? 240 : 68,
    x: isMobile ? -240 : 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40,
      mass: 1,
    },
  }),
};

// Enhanced AI pulse animation
const pulseAnimation = {
  scale: [1, 1.02, 1],
  opacity: [0.8, 1, 0.8],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Optimized MenuItem component with better performance
const MenuItem = memo(({ item, isOpen, isActive, onClick }: { item: (typeof menuItems)[number]; isOpen: boolean; isActive: boolean; onClick: () => void }) => {
  // Memoize class names to prevent unnecessary re-renders
  const buttonClassName = useMemo(() => {
    return `flex items-center w-full p-3 mb-1 rounded-lg transition-colors relative overflow-hidden
      ${
        isActive
          ? 'bg-transparent text-primary-50 border border-highlight/50 shadow-lg shadow-highlight/10' // Enhanced active state with primary color
          : 'hover:bg-primary-700/70 text-primary-200' // Enhanced hover state
      }`;
  }, [isActive]);

  // Memoize animations for active state
  const activeRotation = useMemo(() => {
    return isActive
      ? {
          rotate: [0, 5, -5, 0],
          transition: { duration: 0.5 },
        }
      : {};
  }, [isActive]);

  return (
    <Link href={item.url} passHref>
      <motion.button
        key={item.id}
        whileHover={{
          scale: 1.02,
          boxShadow: '0 0 12px rgba(97, 97, 97, 0.4)',
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={buttonClassName}
      >
        <motion.div
          animate={isActive ? pulseAnimation : {}}
          className='absolute inset-0 bg-gradient-to-r from-transparent via-primary-400/10 to-transparent'
          style={{
            mixBlendMode: 'overlay',
          }}
        />

        <motion.div animate={activeRotation}>{isActive ? item.icon : item.iconUnactive}</motion.div>

        <AnimatePresence mode='wait'>
          {isOpen && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className='ml-3 font-medium text-sm truncate'>
              {item.label}
              {item.id === 'ai_agent' && (
                <motion.span
                  className='ml-2 inline-block text-xs bg-primary-500/30 px-1.5 py-0.5 rounded'
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  AI
                </motion.span>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </Link>
  );
});

MenuItem.displayName = 'MenuItem';

// Optimized sidebar content with better performance
const LeftSidebarContent = memo(({ isOpen, setIsOpen }: LeftSidebarProps) => {
  const pathname = usePathname();

  // Memoize active item calculation
  const [activeItem, setActiveItem] = useState(() => {
    const matchingItem = menuItems.find((item) => item.url === pathname);
    return matchingItem ? matchingItem.id : 'terminal';
  });

  const [isMobile, setIsMobile] = useState(false);

  // Optimized mobile check with debounce
  const checkMobile = useCallback(() => {
    const isMobileView = window.innerWidth <= 768;
    setIsMobile(isMobileView);
    if (isMobileView) {
      setIsOpen(false);
    }
  }, [setIsOpen]);

  // Attach resize listener with cleanup
  useEffect(() => {
    checkMobile();

    // Debounce resize handler for better performance
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [checkMobile]);

  // Update active item when pathname changes
  useEffect(() => {
    const matchingItem = menuItems.find((item) => item.url === pathname);
    if (matchingItem) {
      setActiveItem(matchingItem.id);
    }
  }, [pathname]);

  // Memoized handler for menu item clicks
  const handleMenuItemClick = useCallback(
    (id: string) => {
      setActiveItem(id as 'terminal' | 'ai_agent');
      if (isMobile) setIsOpen(false);
    },
    [isMobile, setIsOpen]
  );

  // Memoize sidebar class for better performance
  const sidebarClass = useMemo(() => {
    return `fixed left-0 h-screen  bg-gradient-to-b from-primary-900/40 to-primary/10 border-r border-primary-600/30 shadow-lg z-30
      ${isMobile ? 'w-[240px]' : ''}`;
  }, [isMobile]);

  // Render optimized sidebar
  return (
    <>
      {/* Mobile overlay with improved performance */}
      {isMobile && isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 bg-gradient-to-b from-primary-900/40 via-transparent to-transparent backdrop-blur-sm z-20' onClick={() => setIsOpen(false)} />
      )}

      {/* Main sidebar with optimized animations */}
      <motion.div initial={false} custom={isMobile} variants={sidebarVariants} animate={isOpen ? 'open' : 'closed'} className={sidebarClass}>
        {/* Enhanced background gradient with optimized animation */}
        <motion.div
          className='absolute inset-0 bg-gradient-to-b from-primary-500/10 via-transparent to-transparent'
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />

        {/* Header with optimized animations */}
        <div className='flex h-16 items-center justify-between px-4 border-b border-primary-600/30 relative'>
          <AnimatePresence mode='wait'>
            {isOpen && (
              <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className='text-xl font-semibold text-primary-100 truncate flex items-center gap-2'>
                <img src='/logo.png' alt='SONAI Logo' className='w-6 h-6' />
                <span className='text-2xl font-bold font-handwriting bg-gradient-to-r from-primary-300 to-primary-500 text-transparent bg-clip-text animate-writing'>SONAI</span>
              </motion.h1>
            )}
          </AnimatePresence>

          {/* Toggle button with optimized animations */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className='p-2 hover:bg-primary-700/80 rounded-lg transition-colors relative group'
            aria-label={isOpen ? 'Collapse menu' : 'Expand menu'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={false}
            animate={{
              backgroundColor: isOpen ? 'rgba(33, 33, 33, 0.8)' : 'transparent',
              transition: { duration: 0.2 },
            }}
          >
            <AnimatePresence mode='wait'>
              {isOpen ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, type: 'spring' }}>
                  <ChevronLeft className='text-primary-200' size={20} />
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, type: 'spring' }}>
                  <img src='/logo.png' alt='SONAI Logo' className='w-5 h-5' />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Navigation menu with optimized rendering */}
        <nav className='mt-4 px-3 relative space-y-3' role='navigation'>
          {menuItems.map((item) => (
            <MenuItem key={item.id} item={item} isOpen={isOpen} isActive={activeItem === item.id} onClick={() => handleMenuItemClick(item.id)} />
          ))}
        </nav>
      </motion.div>
    </>
  );
});

LeftSidebarContent.displayName = 'LeftSidebarContent';

// Lazy-loaded sidebar for better initial load performance
export const LeftSidebar = memo(({ isOpen, setIsOpen }: LeftSidebarProps) => {
  return (
    <Suspense fallback={null}>
      <LeftSidebarContent isOpen={isOpen} setIsOpen={setIsOpen} />
    </Suspense>
  );
});

LeftSidebar.displayName = 'LeftSidebar';
