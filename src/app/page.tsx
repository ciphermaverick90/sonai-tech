'use client';
import { ScrollArea } from '@/components/ui/scroll-area';
import axiosInstance from '@/lib/axios';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className='py-3'>
      <div className='relative bg-transparent grid grid-cols-9 2xl:grid-cols-7 gap-3'>
        {/* Left section */}
        <div className='2xl:col-span-2 col-span-3'>
          <NewsTweets />
        </div>

        {/* Middle section */}
        <div className='2xl:col-span-3 col-span-3'>
          <MessagesRender />
        </div>

        {/* Right section */}
        <div className='2xl:col-span-2 col-span-3'>
          <TrendingProjects />
        </div>
      </div>
    </div>
  );
}

const MessagesRender = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get('/feeds');
        setMessages(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err as any);
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  if (loading === null) {
    return <div className='text-white' />;
  }

  if (error) {
    return <div className='text-red-500'>Đã xảy ra lỗi: {error.message}</div>;
  }

  return (
    <div className='relative z-10'>
      <h2 className='text-2xl font-bold text-white mb-3 flex items-center gap-2'>
        <img src='/star.png' alt='Star icon' className='w-8 h-8' />
        Feeds
      </h2>
      <ScrollArea className='h-[calc(100vh-4.5rem)]'>
        {messages.map((message: any) => (
          <div key={message.id} className='border p-4 group bg-[#130401]/50 border-[#582D24] rounded-lg mb-4 hover:bg-primary-900/20 transition-all duration-300 hover:shadow-[1px_0px_10px_1px_rgba(253,165,44,.5)] shadow-[rgba(253,165,44,0.1)] shadow-md'>
            <div className='relative text-sm z-10'>
              <div className='flex flex-col'>
                <div className='flex items-center justify-between'>
                  <span className='text-primary-400 text-sm font-medium'>
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  <div className='flex items-center gap-2'>
                    <button className='text-primary-500 hover:text-primary-400 transition-colors bg-white/10 px-1.5 py-1.5 rounded-sm'>
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                        <path d='M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z' />
                      </svg>
                    </button>
                    <span
                      className={`text-sm font-medium px-3 uppercase py-1.5 rounded-sm ${message.sentiment === 'positive' ? 'text-green-400 bg-green-400/10' : message.sentiment === 'negative' ? 'text-red-400 bg-red-400/10' : 'text-primary-400 bg-white/10'}`}
                    >
                      {message.sentiment}
                    </span>
                  </div>
                </div>
                <p className='text-white leading-relaxed break-words bg-gradient-to-r from-primary-900/40 to-transparent py-4 rounded-lg'>{message.content}</p>
                <div className='flex justify-between'>
                  <div className='flex flex-wrap gap-2'>
                    {message.tags.map((tag: any) => (
                      <span key={tag} className='text-[#808191] text-xs font-medium bg-white/10 px-3 py-2 rounded-sm'>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    {message.tokens.map((token: any) => (
                      <span key={token} className='text-[#4BE4FF] text-xs font-medium bg-green-400/10 px-2 py-1 rounded-sm'>
                        {token}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

// News Tweets Component
const NewsTweets = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const response = await axiosInstance.get('/last-news');
        setTweets(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err as any);
        setLoading(false);
      }
    };

    fetchTweets();
  }, []);

  useEffect(() => {
    setLoading(true);
  }, []);

  if (loading == null) {
    return <div>Loading...</div>;
  }

  return (
    <div className='relative z-10 w-full'>
      <h2 className='text-2xl font-bold text-white mb-3 flex items-center gap-2'>
        <img src='/star.png' alt='Star icon' className='w-8 h-8' />
        News & Tweets
      </h2>
      <div className='h-[calc(100vh-4.5rem)] w-full overflow-y-auto scrollbar-thin scrollbar-thumb-primary-500 scrollbar-track-primary-900/20 scrollbar-thumb-rounded-full hover:scrollbar-thumb-primary-400 pr-2'>
        {tweets.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64'>
            <div className='animate-pulse mb-4'>
              <img src='/star.png' alt='Loading' className='w-10 h-10 opacity-50' />
            </div>
            <p className='text-primary-400'>Loading latest tweets...</p>
          </div>
        ) : (
          tweets.map((tweet: any) => <TwitterCard key={tweet.id} tweet={tweet} />)
        )}
      </div>
    </div>
  );
};
const TwitterCard = memo(({ tweet }: { tweet: any }) => {
  const [expanded, setExpanded] = useState(false);
  const tweetText = tweet.text || '';
  const isLongTweet = tweetText.length > 150;

  return (
    <div className='border bg-[#130401]/50 w-auto border-[#582D24] rounded-lg mb-4 hover:bg-primary-900/20 transition-all duration-300 hover:shadow-[1px_0px_10px_1px_rgba(253,165,44,.5)] shadow-[rgba(253,165,44,0.1)] shadow-md'>
      <div className='relative overflow-hidden p-4 group'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.3 }} className='absolute pointer-events-none left-0 top-0 z-0'>
          <div className='absolute inset-0 pointer-events-none opacity-100 z-0'>
            <img src='/tweet-background-card.png' alt='Tweet background' className='absolute -top-14 -left-12' />
          </div>
          <img src='/tweet-card.svg' alt='Twitter icon' className='w-full h-full z-5' />
        </motion.div>

        <div className='flex flex-col z-10 relative'>
          <div className='flex items-start gap-3'>
            <img src={tweet.avatar || tweet.author?.profilePicture} className='w-12 h-12 rounded-xl' alt={tweet.fullname || tweet.author?.name} loading='lazy' />
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <h3 className='font-bold text-white text-lg truncate flex items-center gap-1'>
                  {tweet.fullname || tweet.author?.name}
                  {(tweet.verified || tweet.author?.isBlueVerified) && (
                    <svg className='w-5 h-5 text-blue-400' viewBox='0 0 24 24'>
                      <path
                        fill='currentColor'
                        d='M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z'
                      />
                    </svg>
                  )}
                </h3>
                {(tweet.verified || tweet.author?.isVerified) && (
                  <svg className='w-5 h-5 text-primary-400 flex-shrink-0' viewBox='0 0 24 24'>
                    <path fill='currentColor' d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z' />
                  </svg>
                )}
              </div>
              <div className='text-primary-400 text-sm'>@{tweet.username || tweet.author?.userName}</div>
            </div>
            <span className='text-primary-400 text-sm whitespace-nowrap'>
              {formatDistanceToNow(new Date(tweet.timestamp), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className='text-white leading-relaxed break-words bg-primary-900/40 py-3 rounded text-sm mt-2'>
            {isLongTweet && !expanded ? (
              <>
                <p>{tweetText.substring(0, 150)}...</p>
                <button onClick={() => setExpanded(true)} className='text-primary-400 hover:text-primary-300 text-xs mt-1'>
                  Show more
                </button>
              </>
            ) : (
              <p>{tweetText}</p>
            )}
            {isLongTweet && expanded && (
              <button onClick={() => setExpanded(false)} className='text-primary-400 hover:text-primary-300 text-xs mt-1'>
                Show less
              </button>
            )}
          </div>

          <div className='flex items-center gap-2 justify-between mt-3'>
            <div className='flex items-center justify-between text-sm text-primary-400 gap-2'>
              <div className='flex items-center gap-2 bg-white/10 px-3 py-2 rounded-sm hover:bg-white/15 transition-colors'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                  <path d='M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z' />
                </svg>
                <span className='text-white'>{tweet.replies || 0}</span>
              </div>
              <div className='flex items-center gap-2 bg-white/10 px-3 py-2 rounded-sm hover:bg-white/15 transition-colors'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                  <path d='M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z' />
                </svg>
                <span className='text-white'>{tweet.retweets || 0}</span>
              </div>
              <div className='flex items-center gap-2 bg-white/10 px-3 py-2 rounded-sm hover:bg-white/15 transition-colors'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                  <path fillRule='evenodd' d='M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z' clipRule='evenodd' />
                </svg>
                <span className='text-white'>{tweet.likes || 0}</span>
              </div>
            </div>
            <div>
              <div className='flex items-center gap-2 bg-white/10 px-3 py-2 rounded-sm hover:bg-white/15 transition-colors'>
                <a href={tweet.url || tweet.data?.url} target='_blank' rel='noopener noreferrer' className='text-primary-300 hover:text-primary-200 transition-colors'>
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                    <path
                      fillRule='evenodd'
                      d='M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z'
                      clipRule='evenodd'
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TwitterCard.displayName = 'TwitterCard';

// Trending Projects Component
const TrendingProjects = () => {
  const [tokens, setTokens] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        const response = await axiosInstance.get('/token/trending');
        setTokens(response.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching trending tokens:', err);
        setError(err as any);
        setLoading(false);
      }
    };

    fetchTrendingTokens();
  }, []);

  if (loading) {
    return (
      <div className='relative z-10 flex justify-center items-center h-[calc(100vh-4.5rem)]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-400'></div>
      </div>
    );
  }

  if (error) {
    return <div className='relative z-10 text-red-500 p-4 border border-red-500 rounded-lg'>Failed to load trending tokens. Please try again later.</div>;
  }

  return (
    <div className='relative z-10'>
      <h2 className='text-2xl font-bold text-white mb-3 flex items-center gap-2 z'>
        <img src='/star.png' alt='Star icon' className='w-8 h-8' />
        Token Info
      </h2>
      <ScrollArea className='h-[calc(100vh-4.5rem)]'>
        <div className='space-y-4'>
          {tokens.map((token: any, index: any) => {
            // const isPositiveChange = Number(token.priceChange24h) > 0;
            return (
              <div key={index} className='hover:bg-primary-900/30 p-4 space-y-2 transition-colors duration-200 border border-[#582D24] rounded-lg'>
                {/* Desktop view */}
                <div className='text-sm flex justify-between'>
                  <div className='flex gap-3'>
                    <div className='w-12 h-12 rounded-full border border-highlight/20 bg-primary-800/50 flex items-center justify-center text-xl shadow-inner shadow-primary-900'>
                      <ImageTokenRender token={token} />
                    </div>
                    <div>
                      <div className='text-white font-medium flex items-center gap-1.5'>
                        <span className='text-white-400 font-normal text-lg'>{token.name}</span>
                        <span className='text-primary-400'>{token.symbol}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className={`${token.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'} text-xs font-normal`}>{token.priceChange24h ? `${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(2)}%` : token.change || '--'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className='flex items-center gap-2'>
                      <button className='flex items-center justify-center bg-white/10 hover:bg-white/15 transition-colors p-2 rounded-sm'>
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-primary-400' viewBox='0 0 20 20' fill='currentColor'>
                          <path d='M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z' />
                        </svg>
                      </button>
                      <button className='flex items-center justify-center bg-white/10 hover:bg-white/15 transition-colors p-2 rounded-sm'>
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-primary-400' viewBox='0 0 20 20' fill='currentColor'>
                          <path d='M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z' />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className='bg-white/10 p-3 rounded-sm'>
                  <div className='grid grid-cols-3 gap-2'>
                    <div className='col-span-1 flex flex-col'>
                      <span className='text-primary-400 font-normal'>Price</span>
                      <span>{token.priceUsd ? `$${token.priceUsd.toLocaleString()}` : token.priceUsd || '--'}</span>
                    </div>
                    <div className='col-span-1 flex flex-col'>
                      <span className='text-primary-400 font-normal'>Volume</span>
                      <span>{token.volume24h ? `$${token.volume24h.toLocaleString()}` : token.volume || '--'}</span>
                    </div>
                    <div className='col-span-1 flex flex-col'>
                      <span className='text-primary-400 font-normal'>MCap</span>
                      <span>{token.marketCap ? `$${token.marketCap.toLocaleString()}` : token.marketCap || '--'}</span>
                    </div>
                    <div className='col-span-1 flex flex-col'>
                      <span className='text-primary-400 font-normal'>Liquidity</span>
                      <span>{token.liquidity ? `$${token.liquidity.toLocaleString()}` : token.liquidity || '--'}</span>
                    </div>
                    <div className='col-span-1 flex flex-col'>
                      <span className='text-primary-400 font-normal'>FDV</span>
                      <span>{token.fdv ? `$${token.fdv.toLocaleString()}` : token.fdv || '--'}</span>
                    </div>
                    <div className='col-span-1 flex flex-col'>
                      <span className='text-primary-400 font-normal'>Circulating</span>
                      <span>{token.circulatingSupply ? token.circulatingSupply.toLocaleString() : token.circulatingSupply || '--'}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop additional info */}
                <div>
                  <p>{token.description}</p>
                </div>
                <div className='text-xs text-primary-400'>
                  <div className='flex flex-wrap items-center gap-3 mt-2'>
                    {token.links &&
                      Object.entries(token.links || {}).map(([key, value], index) => {
                        // Skip if no value
                        if (!value) return null;

                        let url = '';
                        let displayText = typeof value === 'string' ? value : key;

                        if (key === 'website') {
                          url = `https://${displayText}`;
                        } else if (key === 'twitter') {
                          url = `https://twitter.com/${typeof displayText === 'string' ? displayText.replace('@', '') : ''}`;
                        } else if (key === 'telegram') {
                          url = `https://${displayText}`;
                          displayText = 'Telegram';
                        } else if (key === 'discord') {
                          url = `https://${displayText}`;
                          displayText = 'Discord';
                        } else if (key === 'github') {
                          url = `https://github.com/${displayText}`;
                        }
                        // Only show first 3 links on small screens, show all on larger screens
                        return (
                          <a key={key} href={url} target='_blank' rel='noopener noreferrer' className={`bg-white/10 text-white px-2 py-1 rounded hover:text-primary-300 transition-colors ${index >= 3 ? 'hidden sm:inline-block' : ''}`}>
                            {displayText}
                          </a>
                        );
                      })}
                    {token.links && Object.keys(token.links).length > 3 && <span className='sm:hidden text-primary-500 bg-white/10 px-2 py-1 rounded'>+{Object.keys(token.links).length - 3} more</span>}

                    {token.labels &&
                      token.labels.length > 0 &&
                      token.labels.map((label: string) => (
                        <span key={label} className='bg-primary-500/20 text-primary-300 px-2 py-1 rounded'>
                          {label}
                        </span>
                      ))}

                    {token.address && (
                      <a href={`https://explorer.sonic.ooo/address/${token.address}`} target='_blank' rel='noopener noreferrer' className='bg-white/10 text-white px-2 py-1 rounded hover:text-primary-300 transition-colors'>
                        {token.address.substring(0, 6)}...{token.address.substring(token.address.length - 4)}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

const ImageTokenRender = ({ token }: { token: any }) => {
  const [isError, setIsError] = useState(false);
  const imageUrl = useMemo(() => (token.address === '3rQK45d1ojXR7vtvCmeNjKKVycnVWqaVcP3zk1G39RJR' ? '/sonic.webp' : `https://dd.dexscreener.com/ds-data/tokens/sonic/${token.address}.png?key=5e5b9c`), [token.address]);

  const handleError = useCallback(() => {
    setIsError(true);
  }, []);

  if (isError) {
    return <div className='w-12 h-12 rounded-full border border-highlight/20 bg-primary-800/50 flex items-center justify-center text-xl shadow-inner shadow-primary-900' />;
  }

  return (
    <div className='rounded-full overflow-hidden'>
      <img src={imageUrl} alt={token.name} className='w-full h-full object-cover' onError={handleError} loading='lazy' width={48} height={48} />
    </div>
  );
};
