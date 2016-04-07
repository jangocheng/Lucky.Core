﻿using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Timers;
using Lucky.Hr.Caching;
using Lucky.Hr.Core.Cache.Memcached;

namespace Lucky.Hr.Core.Services
{
    public interface IMemClock : IVolatileProvider
    {
        /// <summary>
        /// Gets the current <see cref="DateTime"/> of the system, expressed in Utc
        /// </summary>
        DateTime UtcNow { get; }

        /// <summary>
        /// Provides a <see cref="IVolatileToken"/> instance which can be used to cache some information for a 
        /// specific duration.
        /// </summary>
        /// <param name="duration">The duration that the token must be valid.</param>
        /// <example>
        /// This sample shows how to use the <see cref="When"/> method by returning the result of
        /// a method named LoadVotes(), which is computed every 10 minutes only.
        /// <code>
        /// _cacheManager.Get("votes",
        ///     ctx => {
        ///         ctx.Monitor(_clock.When(TimeSpan.FromMinutes(10)));
        ///         return LoadVotes();
        /// });
        /// </code>
        /// </example>
        IVolatileToken When(string key,TimeSpan duration);

        /// <summary>
        /// Provides a <see cref="IVolatileToken"/> instance which can be used to cache some 
        /// until a specific date and time.
        /// </summary>
        /// <param name="absoluteUtc">The date and time that the token must be valid until.</param>
        /// <example>
        /// This sample shows how to use the <see cref="WhenUtc"/> method by returning the result of
        /// a method named LoadVotes(), which is computed once, and no more until the end of the year.
        /// <code>
        /// var endOfYear = _clock.UtcNow;
        /// endOfYear.Month = 12;
        /// endOfYear.Day = 31;
        /// 
        /// _cacheManager.Get("votes",
        ///     ctx => {
        ///         ctx.Monitor(_clock.WhenUtc(endOfYear));
        ///         return LoadVotes();
        /// });
        /// </code>
        /// </example>
        IVolatileToken WhenUtc(string key, DateTime absoluteUtc);
    }
    [Serializable]
    public class MemClock : IMemClock
    {
        static readonly ConcurrentDictionary<string, IVolatileToken> timeCache = new ConcurrentDictionary<string, IVolatileToken>();
        private System.Timers.Timer _timer;
        public MemClock()
        {
            _timer=new Timer();
            _timer.Interval = 1000;
            _timer.Elapsed += _timer_Elapsed;
            _timer.Start();
        }

        private void _timer_Elapsed(object sender, ElapsedEventArgs e)
        {
            foreach (KeyValuePair<string, IVolatileToken> token in timeCache)
            {
                if (!token.Value.IsCurrent)
                {
                    IVolatileToken _token=new AbsoluteExpirationToken(this,TimeSpan.Zero);
                    MemcachedHelper.GetInstance().Remove(token.Key);
                    timeCache.TryRemove(token.Key, out _token);
                }
                    
            }
        }

        public DateTime UtcNow
        {
            get { return DateTime.UtcNow; }
        }

        public IVolatileToken When(string key, TimeSpan duration)
        {
            var token = new AbsoluteExpirationToken(this, duration);
            timeCache[key] = token;
            return token;
        }

        public IVolatileToken WhenUtc(string key, DateTime absoluteUtc)
        {
            var token = new AbsoluteExpirationToken(this, absoluteUtc);
            timeCache[key] = token;
            return token;
        }
        [Serializable]  
        public class AbsoluteExpirationToken : IVolatileToken
        {
            private readonly IMemClock _clock;
            private readonly DateTime _invalidateUtc;

            public AbsoluteExpirationToken(IMemClock clock, DateTime invalidateUtc)
            {
                _clock = clock;
                _invalidateUtc = invalidateUtc;
            }

            public AbsoluteExpirationToken(IMemClock clock, TimeSpan duration)
            {
                _clock = clock;
                _invalidateUtc = _clock.UtcNow.Add(duration);
            }

            public bool IsCurrent
            {
                get
                {
                    return _clock.UtcNow < _invalidateUtc;
                }
            }
        }
    }
}
