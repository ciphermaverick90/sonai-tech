'use client';

import { useState } from 'react';
import { LeftSidebar } from '@/components/LeftSidebar';
import { Provider as ReduxProvider } from 'react-redux';
import store from '@/lib/store';

import { ToastContainer } from 'react-toastify';
interface ProviderProps {
  children: React.ReactNode;
}

export const Provider = ({ children }: ProviderProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <ReduxProvider store={store}>
      <div className='flex h-screen'>
        <LeftSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <main className={`flex-1 transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'}`}>{children}</main>
      </div>
      <ToastContainer />
    </ReduxProvider>
  );
};
