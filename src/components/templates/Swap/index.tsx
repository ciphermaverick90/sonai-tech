import { memo, useMemo } from 'react';
import SwapDetailsCard from './swap-details-card';

const SwapDetailsPage = memo(function SwapDetailsPage({ details }: { details: any }) {
  // Memoize the SwapDetailsCard to prevent unnecessary re-renders
  const memoizedCard = useMemo(() => <SwapDetailsCard details={details} />, [details]);

  return (
    <div className='flex w-full relative px-4 py-6 sm:px-6 md:px-8'>
      <div className='relative z-10 translate-z-0 w-full max-w-xl'>{memoizedCard}</div>
    </div>
  );
});

// Prevent re-exports
export default SwapDetailsPage;
