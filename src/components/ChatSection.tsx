'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaPaperclip, FaPaperPlane } from 'react-icons/fa';
import { useChat } from '@ai-sdk/react';
import functionName from '@/components/constants/functionName.json';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import News from './templates/News';
import TechAnalyst from './templates/TechAnalyst';
import TokenInfo from './templates/TokenInfo';

import TokenPairs from './templates/TokenPairs';
import SwapDetailsPage from './templates/Swap';
import Kols from './templates/Kols';
import WhalesTransaction from './templates/WhalesTransaction';
import SmartMoney from './templates/SmartMoney';
import SwapQuote from './templates/SwapQuote';
import ListAssets from './templates/ListAssets';
import { Bot } from 'lucide-react';

//templates message

interface Message {
  role: string;
  content: string;
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'seen';
  reaction?: string;
  attachments?: string[];
  isAIResponse?: boolean;
}

const TemplateMessageCustom = React.memo(({ result, template, name, triggerMessage }: { result: any; template: string | null; name: string; triggerMessage?: any }) => {
  // Loading state
  if (!result) {
    const currentFunction = name ? (functionName as Record<string, string>)[name] : '';

    return (
      <div className='w-full animate-fadeIn'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 relative'>
            <div className='absolute inset-0 rounded-full border-2 border-primary-500/50 animate-[spin_2s_linear_infinite]' />
            <div className='absolute inset-0 rounded-full border-2 border-t-transparent border-primary-400 animate-[spin_1.5s_linear_infinite]' />
            <div className='absolute inset-1 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 animate-pulse' />
            <div className='absolute inset-[6px] rounded-full bg-gradient-to-br from-primary-400 to-primary-500 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]' />
          </div>
          <div className='flex-1'>
            <div className='text-sm text-primary-400 mt-1 animate-pulse'>
              <span className='mr-1'>{currentFunction}</span>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`inline-block animate-bounce ${i > 0 ? `delay-${i}00` : ''}`}>
                  .
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Template components mapping
  const templates: Record<string, null | any> = {
    news: (
      <div className='w-full bg-black border border-primary-500/30 rounded-xl p-4'>
        <News news={result.news} />
      </div>
    ),
    technicalAnalysis: (
      <div className='w-full bg-black rounded-xl p-4 border border-primary-500/30'>
        <TechAnalyst data={result.parsed_data} />
      </div>
    ),
    basicTokenInfo: <div className='max-w-2xl w-full flex flex-col space-y-6'>{result.token_info && <TokenInfo tokenInfo={result.token_info} />}</div>,
    socialSentiment: result?.socialSentiment ? (
      <div className='w-full bg-black rounded-xl p-4 border border-primary-500/30'>
        <div className='flex flex-col space-y-2'>
          <h3 className='text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'>Social Sentiment</h3>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {result.socialSentiment}
          </ReactMarkdown>
        </div>
      </div>
    ) : null,
    kolMentions:
      (result?.kols_mentions || []).length > 0 ? (
        <div className='w-full bg-black rounded-xl p-4 border border-primary-500/30'>
          <h3 className='text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'>KOL Mentions</h3>
          <Kols kols={result.kols_mentions} />
        </div>
      ) : null,
    whaleActivity:
      (result?.whale_activity || []).length > 0 ? (
        <div className='w-full bg-black rounded-xl p-4 border border-primary-500/30'>
          <WhalesTransaction whaleTransactions={result?.whale_activity || []} />
        </div>
      ) : null,
    smartMoneyFlow:
      (result?.smart_money_flow || []).length > 0 ? (
        <div className='w-full bg-black rounded-xl p-4 border border-primary-500/30'>
          <SmartMoney smartMoneys={result?.smart_money_flow || []} />
        </div>
      ) : null,
    swapTemplate: <SwapDetailsPage details={result.json} />,
    tokenPairs: <TokenPairs pairs={result.list} triggerMessage={triggerMessage} prefixPrompt={result.prefixPrompt} />,
    quoteSwap: <SwapQuote details={result.json?.data} triggerMessage={triggerMessage} />,
    listAssets: <ListAssets amount={result.amount} keyword={result.keyword} triggerMessage={triggerMessage} />,
  };

  // Return template component or null if template not found
  return template && templates[template] ? templates[template] : null;
});

const AIMessage = ({ message }: { message: Message }) => (
  <div className='flex items-start gap-4 mb-6 ml-1'>
    <div className='relative'>
      <img src='/avatar.png' alt='AI Logo' className='w-12 h-12' />
    </div>
    <div className='flex-1'>
      <div>
        <div className='flex items-center justify-between mb-1'>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-primary-400'>
              {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
      <motion.div className=''>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ node, ...props }) => <a {...props} target='_blank' className='text-primary-400 hover:text-primary-300' rel='noopener noreferrer' />,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </motion.div>
    </div>
  </div>
);

const UserMessage = ({ message }: { message: Message }) => (
  <div className='flex items-start mb-4 flex-row-reverse gap-3 overflow-hidden r-3'>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className='max-w-[80%] bg-[#280C06] p-4 rounded-2xl rounded-tr-sm border border-[#582D24] backdrop-blur-md shadow-xl'>
      <div className='prose prose-invert prose-sm max-w-none'>{message.content}</div>
    </motion.div>
  </div>
);

const ChatHeader = ({ onClear, messages }: { onClear: () => void; messages: any[] }) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const handleInfoClick = useCallback(() => {
    setIsInfoModalOpen(true);
  }, []);

  const handleRefreshClick = useCallback(() => {
    onClear();
  }, [onClear]);

  const handleCloseModal = useCallback(() => {
    setIsInfoModalOpen(false);
  }, []);

  return (
    <div className='mb-4 border-b border-primary-700/50 p-6 bg-[rgba(255,255,255,0.01)] rounded-t-2xl'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-5'>
          <img src='/star.png' alt='SONAI Logo' className='w-10 h-10' />
          <div className='flex flex-col'>
            <h2 className='text-xl font-bold text-primary-200'>Chat with SONAI</h2>
            <p className='text-sm text-primary-400'>AI-powered assistance, anytime, anywhere</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <button className='p-2 hover:bg-primary-700/50 rounded-lg transition-all' title='Thông tin' onClick={handleInfoClick}>
            <svg className='w-5 h-5 text-primary-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </button>
          {messages.length > 0 && (
            <button className='p-2 hover:bg-primary-700/50 rounded-lg transition-all' title='Làm mới tin nhắn' onClick={handleRefreshClick}>
              <svg className='w-5 h-5 text-primary-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
              </svg>
            </button>
          )}
        </div>
      </div>

      {isInfoModalOpen && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-primary-800/90 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-primary-500/30 animate-in fade-in-0 slide-in-from-bottom-5'>
            <div className='flex flex-col gap-6'>
              <div>
                <h3 className='text-2xl font-bold bg-gradient-to-r from-primary-200 to-primary-400 bg-clip-text text-transparent'>Welcome to SONAI - Your Trading Assistant</h3>
                <p className='text-primary-300 mt-2'>Your AI-powered assistant for intelligent trading, market analysis and automated transactions on Sonic Network</p>
              </div>

              <div className='space-y-4 text-primary-200'>
                <div className='flex items-start gap-3'>
                  <div className='p-2 bg-primary-700/50 rounded-lg'>
                    <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none'>
                      <path d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z' stroke='currentColor' strokeWidth='2' />
                      <path d='M15 9.354a4 4 0 11-6 0M12 17v.01' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                    </svg>
                  </div>
                  <p>Execute trades, analyze market trends, and get real-time insights through natural conversations</p>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='p-2 bg-primary-700/50 rounded-lg'>
                    <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none'>
                      <path d='M13 10V3L4 14h7v7l9-11h-7z' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                    </svg>
                  </div>
                  <p>Automated trading capabilities with smart contract integration on Sonic Network</p>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='p-2 bg-primary-700/50 rounded-lg'>
                    <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none'>
                      <path
                        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                      />
                    </svg>
                  </div>
                  <p>Buy and sell tokens automatically with AI-optimized timing and pricing strategies</p>
                </div>
              </div>

              <button onClick={handleCloseModal} className='w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors'>
                Start Trading Now!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatForm = ({ input, handleInputChange, isLoading, handleSubmit }: { input: string; handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void; isLoading: boolean; handleSubmit: (e: React.FormEvent) => void }) => {
  return (
    <div className='bg-primary-900/90 backdrop-blur-xl rounded-2xl border border-[#582D24] shadow-2xl'>
      <form onSubmit={handleSubmit} className='flex  items-center'>
        <div className='flex-1 relative'>
          <input
            type='text'
            value={input}
            onChange={handleInputChange}
            className='w-full focus:ring-0 focus:outline-none bg-transparent shadow-none text-white rounded-xl pl-5  py-4  transition-all placeholder-primary-400'
            placeholder={'Type your message...'}
          />
        </div>
        <button type='submit' className='relative bg-transparent text-white px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-3 font-medium overflow-hidden' disabled={isLoading}>
          <div className='absolute inset-0 bg-[url("/send-bg.png")] bg-no-repeat bg-cover bg-center opacity-20'></div>
          <motion.div className='relative z-10' whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
            <motion.img
              src='/send.png'
              alt='Send'
              className='w-8 h-8'
              initial={{ rotate: 0 }}
              whileHover={{
                rotate: 15,
                filter: 'drop-shadow(0 0 8px rgba(254, 165, 43, 0.7))',
              }}
              animate={isLoading ? { opacity: [1, 0.5, 1], scale: [1, 0.95, 1] } : {}}
              transition={{
                duration: 0.3,
                repeat: isLoading ? Infinity : 0,
                repeatType: 'reverse',
              }}
            />
          </motion.div>
        </button>
      </form>
    </div>
  );
};

const ChatSection = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPostingMessage, setIsPostingMessage] = useState<any>(false);
  const isPostingMessageRef = useRef(isPostingMessage);

  // Update ref when state changes to avoid stale closures
  useEffect(() => {
    isPostingMessageRef.current = isPostingMessage;
  }, [isPostingMessage]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    api: '/api/chat',
    headers: {
      token: typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '',
    },
    onFinish: useCallback((message: any) => {
      if (message.content) {
        // No-op for now
        // const text = stripTags(message.content);
        // _HandleSendPostMessageToModel(text);
      } else {
        const tool = message?.toolInvocations?.[0];
        if (tool?.result?.auto_submit) {
          append({
            role: 'system',
            content: tool?.result?.next_prompt,
          });
        }
      }
    }, []),
    onToolCall: useCallback((tool: any) => {
      const toolName = tool.toolCall.toolName;

      if (toolName === 'aboutToken') {
        const messagesData = [
          "I'm analyzing the token details for you...",
          'Let me check the market data...',
          'Looking up the latest trading activity...',
          'Gathering information about recent transactions...',
          "Checking the token's social sentiment...",
          'Analyzing smart money movements...',
          'Looking into whale activity...',
          'Reviewing technical indicators...',
          'Checking recent news and updates...',
          'Almost done with my analysis...',
        ];
        setIsPostingMessage(messagesData[Math.floor(Math.random() * messagesData.length)]);
      } else {
        const messagesData = ['Just a moment...', 'Thinking...', 'Analyzing...', 'Checking...', 'Almost done...'];
        setIsPostingMessage(messagesData[Math.floor(Math.random() * messagesData.length)]);
      }
    }, []),
  });

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Only scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  const triggerMessage = useCallback(
    (text: string) => {
      append({
        role: 'system',
        content: text,
      });
    },
    [append]
  );

  // Listen for swap events to trigger messages
  useEffect(() => {
    const handleSwapMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === 'SWAP_MESSAGE') {
        if (event.data.message) {
          triggerMessage(event.data.message);
        }
      }
    };
    window.addEventListener('message', handleSwapMessage);
    return () => {
      window.removeEventListener('message', handleSwapMessage);
    };
  }, [triggerMessage]);

  // Memoize message rendering to prevent unnecessary re-renders
  const renderedMessages = useMemo(() => {
    return messages.map((message: any, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`${message.role === 'assistant' ? 'text-primary-200 hover:text-primary-100' : 'text-primary-300 hover:text-primary-200'} transition-all`}
      >
        {message?.toolInvocations?.[0] ? (
          <TemplateMessageCustom triggerMessage={triggerMessage} result={message?.toolInvocations?.[0]?.result} name={message?.toolInvocations?.[0]?.toolName} template={message?.toolInvocations?.[0]?.result?.template} />
        ) : message.role === 'assistant' ? (
          <AIMessage message={message} />
        ) : message.role !== 'system' ? (
          <UserMessage message={message} />
        ) : null}
      </motion.div>
    ));
  }, [messages, triggerMessage]);

  // Memoize loading indicator to prevent re-renders
  const loadingIndicator = useMemo(() => {
    if (!isLoading) return null;

    return (
      <div className='text-primary-400'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='flex gap-2 items-center p-4 bg-primary-800/50 rounded-xl'>
          <div className='w-2 h-2 bg-primary-400 rounded-full animate-bounce' />
          <div className='w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-100' />
          <div className='w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-200' />
        </motion.div>
      </div>
    );
  }, [isLoading]);

  // Memoize the chat form to prevent re-renders
  const chatForm = useMemo(() => {
    return <ChatForm input={input} handleInputChange={handleInputChange} isLoading={isLoading} handleSubmit={handleSubmit} />;
  }, [input, handleInputChange, isLoading, handleSubmit]);
  return (
    <div className='col-span-8 bg-transparent backdrop-blur-xl rounded-2xl h-[calc(100vh-32px)] border border-[#F1B90C]/20 shadow-2xl'>
      <div className='flex flex-col h-full'>
        <ChatHeader onClear={clearMessages} messages={messages} />
        {/* Messages */}
        <div className='flex-1 overflow-y-auto mb-4 space-y-4 custom-scrollbar p-6'>
          {messages.length === 0 ? (
            <EmptyMessage />
          ) : (
            <>
              <AnimatePresence>{renderedMessages}</AnimatePresence>
              {loadingIndicator}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className='p-6'>{chatForm}</div>
      </div>
    </div>
  );
};

const EmptyMessage = memo(() => {
  // Optimized animations with precise performance values
  const botAnimation = {
    rotateX: [0, 10, 0, -10, 0],
    rotateY: [0, 15, 0, -15, 0],
    z: [0, 10, 0],
  };

  const glowAnimation = {
    scale: [1, 1.3, 1],
    opacity: [0.3, 0.8, 0.3],
  };

  const textShadowAnimation = {
    textShadow: ['0 0 8px rgba(99,102,241,0.3)', '0 0 16px rgba(99,102,241,0.6)', '0 0 8px rgba(99,102,241,0.3)'],
  };

  // Pre-calculate particle positions for better performance
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 3,
      })),
    []
  );

  return (
    <div className='flex flex-col items-center justify-center mt-24 overflow-hidden text-primary-400 p-8 relative'>
      {/* Hardware-accelerated particle system */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className='absolute w-1 h-1 rounded-full bg-primary-400/30 will-change-transform'
          style={{
            left: particle.left,
            top: particle.top,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 0.7, 0],
            y: [0, -20, -40],
          }}
          transition={{
            delay: particle.delay,
            duration: particle.duration,
            repeat: Infinity,
            repeatType: 'loop',
          }}
        />
      ))}

      <motion.div className='relative group z-10' whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
        <motion.div
          initial={{ rotateX: 0, rotateY: 0 }}
          animate={botAnimation}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatType: 'loop',
          }}
          className='transform-gpu perspective-800'
        >
          <div className='relative'>
            <img src='/avatar.png' alt='SONIC' className='w-20 h-20 text-primary-300' />
          </div>
        </motion.div>

        {/* Enhanced ripple effect with staggered animations */}
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute -inset-4 rounded-full border border-primary-500/20'
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.8, 1.2, 1.8],
              opacity: [0.8, 0.4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 1,
            }}
          />
        ))}
      </motion.div>
      <motion.div className='mt-12 text-center backdrop-blur-sm p-6 rounded-2xl bg-primary-800/10  shadow-lg shadow-primary-900/20 max-w-xl' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}>
        <motion.h3
          className='text-3xl font-bold bg-gradient-to-r from-white to-[#FDA52C] text-transparent bg-clip-text'
          animate={textShadowAnimation}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'loop',
            useCompositeCache: true,
          }}
        >
          Welcome to SONAI
        </motion.h3>
        <motion.p className='text-sm opacity-80 text-center mt-3 leading-relaxed w-full' initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.8, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
          Start a conversation to unlock AI-powered crypto insights, market analysis, and personalized assistance for your Web3 journey
        </motion.p>
        <motion.div className='mt-6 flex flex-wrap justify-center gap-2' initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
          {['token analysis', 'market trends', 'swap options'].map((topic, index) => (
            <motion.div
              key={topic}
              className='px-4 py-2 bg-primary-700/50 rounded-lg border border-primary-500/30 text-primary-200 text-sm'
              whileHover={{
                scale: 1.05,
                backgroundColor: 'rgba(99,102,241,0.3)',
                boxShadow: '0 0 15px rgba(99,102,241,0.5)',
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              Try asking about <span className='text-primary-300 font-medium'>{topic}</span>
            </motion.div>
          ))}
        </motion.div>
        {/* Pulsing arrow indicator */}
        <motion.div className='mt-8 text-primary-400/70 flex justify-center' animate={{ y: [0, 5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M12 5V19M12 19L5 12M12 19L19 12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
});

EmptyMessage.displayName = 'EmptyMessage';

export default ChatSection;
