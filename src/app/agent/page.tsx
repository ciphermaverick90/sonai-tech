'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ChatSection from '@/components/ChatSection';
import WalletSection from '@/components/WalletSection';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from '@/lib/axios';
import { useDispatch } from 'react-redux';

const AgentPage = () => {
  const dispatch = useDispatch();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const auth = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (!auth?.user) {
      setShowAuthDialog(true);
    }
  }, [auth]);

  const _ServerJoin = async (tokenResponse: any) => {
    try {
      const response = await axios.post('/auth/join', tokenResponse);
      const data = response.data;
      if (data.success) {
        const { user, wallet, token } = data.data;
        const userData = {
          id: user.id,
          email: user.email,
          wallet: wallet,
        };
        dispatch({ type: 'update/auth', payload: userData });
        localStorage.setItem('token', token);
      } else {
        throw new Error('Server join failed');
      }
    } catch (error: any) {
      console.error('Error during server join:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during login',
      };
    }
  };

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => _ServerJoin(tokenResponse),
  });

  useEffect(() => {
    if (auth) {
      setShowAuthDialog(false);
    } else {
      setShowAuthDialog(true);
    }
  }, [auth]);

  return (
    <div className='min-h-screen text-white relative z-10'>
      {auth && (
        <div className='grid grid-cols-12 gap-4 p-4'>
          <ChatSection />
          <WalletSection />
        </div>
      )}
      {showAuthDialog && (
        <div className='fixed inset-0 bg-transparent flex items-center justify-center z-10 animate-fadeIn'>
          {auth === null ? (
            <div className='text-center space-y-4'>
              <div className='w-16 h-16 mx-auto border-4 border-primary-400 border-t-transparent rounded-full animate-spin'></div>
              <div className='animate-pulse text-2xl font-medium bg-gradient-to-r from-primary-300 via-primary-400 to-primary-300 bg-clip-text text-transparent'>Checking authentication...</div>
              <p className='text-primary-400 text-sm animate-pulse'>Please wait while we verify your credentials</p>
            </div>
          ) : (
            <div className='bg-primary/10 backdrop-blur-xl p-6 rounded-3xl shadow-2xl max-w-lg w-full border border-highlight/20 transform hover:scale-[1.02] transition-all duration-300'>
              <div className='space-y-3'>
                <div className='text-center'>
                  <div className='flex justify-center'>
                    <img src='/logo-dark.png' alt='SONAI Logo' className='h-28 w-auto transform hover:scale-105 transition-transform duration-300' />
                  </div>
                  <h2 className='text-4xl font-bold mb-4 bg-gradient-to-r from-white to-[#FDA52C] bg-clip-text text-transparent'>Welcome to SONAI</h2>
                  <p className='text-primary-200 text-lg leading-relaxed'>Experience the future of AI-powered crypto trading with personalized insights and automated strategies</p>
                </div>

                <button
                  onClick={() => login()}
                  className='w-full bg-white/10 hover:bg-white/15 border-[#FDA52C]/60 border py-4 px-6 rounded-xl flex items-center justify-center gap-4 hover:from-primary-500 hover:to-primary-600 transition-all duration-300 shadow-xl hover:shadow-primary-500/30 font-medium text-lg group'
                >
                  <img src='/google.svg' alt='Google' className='w-7 h-7 group-hover:scale-110 transition-transform duration-300' />
                  Continue with Google
                </button>

                <div className='text-center'>
                  <p className='text-primary-400'>
                    By continuing, you agree to our{' '}
                    <a href='#' className='text-primary-300 hover:text-primary-200 underline transition-colors'>
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href='#' className='text-primary-300 hover:text-primary-200 underline transition-colors'>
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <CheckSessionHook />
    </div>
  );
};

const CheckSessionHook = () => {
  const [onChecking, setOnChecking] = useState(false);
  const dispatch = useDispatch();

  const _ServerFetching = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'update/auth', payload: false });
        return;
      }

      const response = await axios.post('/auth/verify', {
        token: token,
      });

      const data = response.data;
      if (data.success) {
        const { user, wallet } = data.data;
        const userData = {
          id: user.id,
          email: user.email,
          wallet: wallet,
        };
        dispatch({ type: 'update/auth', payload: userData });
      } else {
        dispatch({ type: 'update/auth', payload: false });
        throw new Error('Server fetching failed');
      }
    } catch (error: any) {
      dispatch({ type: 'update/auth', payload: false });
      console.error('Error during server fetching:', error);
    }
  };

  useEffect(() => {
    _ServerFetching();
  }, []);

  return null;
};

const Default = () => {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <AgentPage />
    </GoogleOAuthProvider>
  );
};

export default Default;
