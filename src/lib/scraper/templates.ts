export interface ScraperTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ecommerce' | 'news' | 'social-media' | 'lead-generation' | 'research' | 'monitoring';
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  useCase: string;
  targetSites: string[];
  selectors: Record<string, {
    selector: string;
    description: string;
    required: boolean;
    dataType: 'text' | 'number' | 'url' | 'email' | 'date' | 'image';
    validation?: string;
  }>;
  settings: {
    engine: 'PLAYWRIGHT' | 'JSDOM' | 'HTTRACK';
    delay: number;
    timeout: number;
    retries: number;
    respectRobots: boolean;
    javascript: boolean;
    userAgent?: string;
    viewport?: { width: number; height: number };
  };
  schedule?: {
    type: 'manual' | 'interval' | 'cron';
    interval?: number;
    cronExpression?: string;
  };
  outputFormat: 'JSON' | 'CSV' | 'EXCEL';
  tags: string[];
  popularity: number;
  createdAt: string;
  updatedAt: string;
}

export const SCRAPER_TEMPLATES: ScraperTemplate[] = [
  // E-COMMERCE TEMPLATES
  {
    id: 'ecommerce-product-monitor',
    name: 'E-commerce Product Monitor',
    description: 'Monitor product prices, availability, and reviews across major e-commerce platforms',
    category: 'ecommerce',
    icon: '🛒',
    difficulty: 'beginner',
    estimatedTime: '5 minutes',
    useCase: 'Track competitor pricing, monitor stock levels, analyze product performance',
    targetSites: ['Amazon', 'eBay', 'Shopify stores', 'WooCommerce sites'],
    selectors: {
      title: {
        selector: 'h1, .product-title, [data-testid="product-title"], .product-name',
        description: 'Product title or name',
        required: true,
        dataType: 'text'
      },
      price: {
        selector: '.price, .price-now, [data-testid="price"], .product-price, .cost',
        description: 'Current product price',
        required: true,
        dataType: 'number',
        validation: '^\\$?[0-9,]+\\.?[0-9]*$'
      },
      originalPrice: {
        selector: '.price-original, .was-price, .strikethrough, .price-before',
        description: 'Original price before discount',
        required: false,
        dataType: 'number'
      },
      availability: {
        selector: '.stock-status, .availability, [data-testid="availability"]',
        description: 'Stock availability status',
        required: false,
        dataType: 'text'
      },
      rating: {
        selector: '.rating, .stars, [data-testid="rating"], .review-score',
        description: 'Product rating or review score',
        required: false,
        dataType: 'number'
      },
      reviewCount: {
        selector: '.review-count, .total-reviews, [data-testid="review-count"]',
        description: 'Number of reviews',
        required: false,
        dataType: 'number'
      },
      image: {
        selector: '.product-image img, .main-image img, [data-testid="product-image"]',
        description: 'Main product image URL',
        required: false,
        dataType: 'image'
      },
      description: {
        selector: '.product-description, .description, [data-testid="description"]',
        description: 'Product description',
        required: false,
        dataType: 'text'
      },
      category: {
        selector: '.breadcrumb, .category, [data-testid="category"]',
        description: 'Product category',
        required: false,
        dataType: 'text'
      },
      seller: {
        selector: '.seller, .brand, [data-testid="seller"], .vendor',
        description: 'Product seller or brand',
        required: false,
        dataType: 'text'
      }
    },
    settings: {
      engine: 'PLAYWRIGHT',
      delay: 2000,
      timeout: 30000,
      retries: 3,
      respectRobots: true,
      javascript: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1920, height: 1080 }
    },
    schedule: {
      type: 'interval',
      interval: 3600000 // 1 hour
    },
    outputFormat: 'JSON',
    tags: ['ecommerce', 'pricing', 'monitoring', 'retail'],
    popularity: 95,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15'
  },
  {
    id: 'marketplace-listings',
    name: 'Marketplace Listings Scraper',
    description: 'Extract listings from marketplaces like eBay, Etsy, Facebook Marketplace',
    category: 'ecommerce',
    icon: '🏪',
    difficulty: 'intermediate',
    estimatedTime: '10 minutes',
    useCase: 'Research market trends, find arbitrage opportunities, monitor competition',
    targetSites: ['eBay', 'Etsy', 'Facebook Marketplace', 'Craigslist'],
    selectors: {
      listingTitle: {
        selector: '.listing-title, .item-title, h3, .title',
        description: 'Listing title',
        required: true,
        dataType: 'text'
      },
      price: {
        selector: '.price, .cost, .amount, [data-testid="price"]',
        description: 'Listing price',
        required: true,
        dataType: 'number'
      },
      location: {
        selector: '.location, .seller-location, .address',
        description: 'Item or seller location',
        required: false,
        dataType: 'text'
      },
      condition: {
        selector: '.condition, .item-condition, .state',
        description: 'Item condition',
        required: false,
        dataType: 'text'
      },
      seller: {
        selector: '.seller, .username, .seller-name',
        description: 'Seller information',
        required: false,
        dataType: 'text'
      },
      listingDate: {
        selector: '.date, .posted, .listing-date',
        description: 'Date listing was posted',
        required: false,
        dataType: 'date'
      },
      image: {
        selector: '.listing-image img, .item-image img, .photo img',
        description: 'Main listing image',
        required: false,
        dataType: 'image'
      }
    },
    settings: {
      engine: 'PLAYWRIGHT',
      delay: 1500,
      timeout: 25000,
      retries: 2,
      respectRobots: true,
      javascript: true,
      viewport: { width: 1366, height: 768 }
    },
    outputFormat: 'CSV',
    tags: ['marketplace', 'listings', 'arbitrage', 'research'],
    popularity: 78,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-10'
  },

  // NEWS TEMPLATES
  {
    id: 'news-article-aggregator',
    name: 'News Article Aggregator',
    description: 'Collect news articles, headlines, and metadata from news websites',
    category: 'news',
    icon: '📰',
    difficulty: 'beginner',
    estimatedTime: '7 minutes',
    useCase: 'Media monitoring, content curation, trend analysis, competitive intelligence',
    targetSites: ['CNN', 'BBC', 'Reuters', 'TechCrunch', 'Local news sites'],
    selectors: {
      headline: {
        selector: 'h1, .headline, .article-title, [data-testid="headline"]',
        description: 'Article headline',
        required: true,
        dataType: 'text'
      },
      author: {
        selector: '.author, .byline, [rel="author"], .writer',
        description: 'Article author',
        required: false,
        dataType: 'text'
      },
      publishDate: {
        selector: '.date, .publish-date, time, [datetime]',
        description: 'Publication date',
        required: true,
        dataType: 'date'
      },
      content: {
        selector: '.article-content, .story-content, .post-content, .entry-content',
        description: 'Full article content',
        required: true,
        dataType: 'text'
      },
      category: {
        selector: '.category, .section, .topic, .tag',
        description: 'Article category or section',
        required: false,
        dataType: 'text'
      },
      summary: {
        selector: '.summary, .excerpt, .lead, .subtitle',
        description: 'Article summary or excerpt',
        required: false,
        dataType: 'text'
      },
      image: {
        selector: '.featured-image img, .article-image img, .hero-image img',
        description: 'Featured article image',
        required: false,
        dataType: 'image'
      },
      tags: {
        selector: '.tags a, .keywords, .article-tags',
        description: 'Article tags or keywords',
        required: false,
        dataType: 'text'
      },
      readTime: {
        selector: '.read-time, .reading-time, [data-testid="read-time"]',
        description: 'Estimated reading time',
        required: false,
        dataType: 'text'
      },
      comments: {
        selector: '.comments-count, .comment-count, .discussion-count',
        description: 'Number of comments',
        required: false,
        dataType: 'number'
      }
    },
    settings: {
      engine: 'JSDOM',
      delay: 1000,
      timeout: 20000,
      retries: 2,
      respectRobots: true,
      javascript: false,
      userAgent: 'DataVault-NewsBot/1.0'
    },
    schedule: {
      type: 'cron',
      cronExpression: '0 */2 * * *' // Every 2 hours
    },
    outputFormat: 'JSON',
    tags: ['news', 'media', 'monitoring', 'content'],
    popularity: 89,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-12'
  },
  {
    id: 'press-release-monitor',
    name: 'Press Release Monitor',
    description: 'Track press releases and corporate announcements',
    category: 'news',
    icon: '📢',
    difficulty: 'intermediate',
    estimatedTime: '12 minutes',
    useCase: 'Corporate intelligence, investment research, competitor monitoring',
    targetSites: ['PR Newswire', 'Business Wire', 'Company websites', 'SEC filings'],
    selectors: {
      title: {
        selector: 'h1, .release-title, .announcement-title',
        description: 'Press release title',
        required: true,
        dataType: 'text'
      },
      company: {
        selector: '.company, .organization, .issuer',
        description: 'Company or organization name',
        required: true,
        dataType: 'text'
      },
      date: {
        selector: '.release-date, .announce-date, time',
        description: 'Release date',
        required: true,
        dataType: 'date'
      },
      content: {
        selector: '.release-content, .announcement-body, .press-release-body',
        description: 'Full press release content',
        required: true,
        dataType: 'text'
      },
      ticker: {
        selector: '.ticker, .symbol, .stock-symbol',
        description: 'Stock ticker symbol',
        required: false,
        dataType: 'text'
      },
      industry: {
        selector: '.industry, .sector, .category',
        description: 'Industry or sector',
        required: false,
        dataType: 'text'
      }
    },
    settings: {
      engine: 'PLAYWRIGHT',
      delay: 2000,
      timeout: 30000,
      retries: 3,
      respectRobots: true,
      javascript: true
    },
    outputFormat: 'JSON',
    tags: ['press-release', 'corporate', 'announcements', 'intelligence'],
    popularity: 67,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-08'
  },

  // SOCIAL MEDIA TEMPLATES
  {
    id: 'social-media-posts',
    name: 'Social Media Posts Scraper',
    description: 'Extract posts, engagement metrics, and user data from social platforms',
    category: 'social-media',
    icon: '📱',
    difficulty: 'advanced',
    estimatedTime: '15 minutes',
    useCase: 'Social listening, influencer research, brand monitoring, trend analysis',
    targetSites: ['Twitter/X', 'LinkedIn', 'Instagram', 'Facebook', 'TikTok'],
    selectors: {
      postContent: {
        selector: '.post-content, .tweet-text, .post-text, [data-testid="tweetText"]',
        description: 'Post or tweet content',
        required: true,
        dataType: 'text'
      },
      author: {
        selector: '.author, .username, .user-name, [data-testid="User-Name"]',
        description: 'Post author username',
        required: true,
        dataType: 'text'
      },
      authorHandle: {
        selector: '.handle, .username, @[data-testid="username"]',
        description: 'Author handle or @username',
        required: false,
        dataType: 'text'
      },
      timestamp: {
        selector: 'time, .timestamp, .post-date, [data-testid="Time"]',
        description: 'Post timestamp',
        required: true,
        dataType: 'date'
      },
      likes: {
        selector: '.likes, .like-count, [data-testid="like"], .favorites',
        description: 'Number of likes/favorites',
        required: false,
        dataType: 'number'
      },
      shares: {
        selector: '.shares, .retweets, .share-count, [data-testid="retweet"]',
        description: 'Number of shares/retweets',
        required: false,
        dataType: 'number'
      },
      comments: {
        selector: '.comments, .replies, .comment-count, [data-testid="reply"]',
        description: 'Number of comments/replies',
        required: false,
        dataType: 'number'
      },
      hashtags: {
        selector: '.hashtag, a[href*="hashtag"], a[href*="tag"]',
        description: 'Hashtags in the post',
        required: false,
        dataType: 'text'
      },
      mentions: {
        selector: '.mention, a[href*="@"], [data-testid="mention"]',
        description: 'User mentions in the post',
        required: false,
        dataType: 'text'
      },
      media: {
        selector: '.media img, .post-image, .tweet-media img',
        description: 'Attached media (images/videos)',
        required: false,
        dataType: 'image'
      }
    },
    settings: {
      engine: 'PLAYWRIGHT',
      delay: 3000,
      timeout: 45000,
      retries: 3,
      respectRobots: false, // Social media often blocks bots
      javascript: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X)',
      viewport: { width: 375, height: 812 }
    },
    schedule: {
      type: 'interval',
      interval: 900000 // 15 minutes
    },
    outputFormat: 'JSON',
    tags: ['social-media', 'engagement', 'trends', 'monitoring'],
    popularity: 92,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-14'
  },
  {
    id: 'influencer-profile-tracker',
    name: 'Influencer Profile Tracker',
    description: 'Monitor influencer profiles, follower counts, and engagement rates',
    category: 'social-media',
    icon: '⭐',
    difficulty: 'advanced',
    estimatedTime: '20 minutes',
    useCase: 'Influencer marketing, partnership research, audience analysis',
    targetSites: ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'LinkedIn'],
    selectors: {
      username: {
        selector: '.username, .handle, .profile-username',
        description: 'Profile username',
        required: true,
        dataType: 'text'
      },
      displayName: {
        selector: '.display-name, .profile-name, .full-name',
        description: 'Profile display name',
        required: true,
        dataType: 'text'
      },
      bio: {
        selector: '.bio, .description, .profile-description, .about',
        description: 'Profile bio or description',
        required: false,
        dataType: 'text'
      },
      followers: {
        selector: '.followers, .follower-count, [data-testid="followers"]',
        description: 'Follower count',
        required: true,
        dataType: 'number'
      },
      following: {
        selector: '.following, .following-count, [data-testid="following"]',
        description: 'Following count',
        required: false,
        dataType: 'number'
      },
      posts: {
        selector: '.post-count, .posts, .total-posts',
        description: 'Total number of posts',
        required: false,
        dataType: 'number'
      },
      verified: {
        selector: '.verified, .checkmark, .badge',
        description: 'Verification status',
        required: false,
        dataType: 'text'
      },
      profileImage: {
        selector: '.profile-image, .avatar, .profile-pic img',
        description: 'Profile picture URL',
        required: false,
        dataType: 'image'
      },
      website: {
        selector: '.website, .link, .external-link',
        description: 'Profile website link',
        required: false,
        dataType: 'url'
      },
      location: {
        selector: '.location, .geo, .address',
        description: 'Profile location',
        required: false,
        dataType: 'text'
      }
    },
    settings: {
      engine: 'PLAYWRIGHT',
      delay: 4000,
      timeout: 60000,
      retries: 3,
      respectRobots: false,
      javascript: true,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      viewport: { width: 1200, height: 800 }
    },
    schedule: {
      type: 'cron',
      cronExpression: '0 12 * * *' // Daily at noon
    },
    outputFormat: 'CSV',
    tags: ['influencer', 'social-media', 'profiles', 'marketing'],
    popularity: 73,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-11'
  },

  // LEAD GENERATION TEMPLATES
  {
    id: 'contact-information-extractor',
    name: 'Contact Information Extractor',
    description: 'Extract contact details from business websites and directories',
    category: 'lead-generation',
    icon: '📇',
    difficulty: 'intermediate',
    estimatedTime: '8 minutes',
    useCase: 'Lead generation, sales prospecting, business development',
    targetSites: ['Company websites', 'Business directories', 'Yellow Pages', 'LinkedIn'],
    selectors: {
      companyName: {
        selector: '.company-name, .business-name, h1, .organization',
        description: 'Company or business name',
        required: true,
        dataType: 'text'
      },
      email: {
        selector: 'a[href^="mailto:"], .email, [data-testid="email"]',
        description: 'Contact email address',
        required: false,
        dataType: 'email',
        validation: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$'
      },
      phone: {
        selector: '.phone, .tel, a[href^="tel:"], .contact-phone',
        description: 'Phone number',
        required: false,
        dataType: 'text',
        validation: '^[+]?[0-9\\s\\-\\(\\)]+$'
      },
      address: {
        selector: '.address, .location, .contact-address, .street',
        description: 'Business address',
        required: false,
        dataType: 'text'
      },
      website: {
        selector: '.website, a[href^="http"], .url',
        description: 'Company website',
        required: false,
        dataType: 'url'
      },
      industry: {
        selector: '.industry, .sector, .business-type, .category',
        description: 'Industry or business category',
        required: false,
        dataType: 'text'
      },
      description: {
        selector: '.description, .about, .company-description, .overview',
        description: 'Company description',
        required: false,
        dataType: 'text'
      },
      socialMedia: {
        selector: 'a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"]',
        description: 'Social media links',
        required: false,
        dataType: 'url'
      }
    },
    settings: {
      engine: 'PLAYWRIGHT',
      delay: 2000,
      timeout: 30000,
      retries: 2,
      respectRobots: true,
      javascript: true
    },
    outputFormat: 'CSV',
    tags: ['lead-generation', 'contacts', 'business', 'prospecting'],
    popularity: 84,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-09'
  },

  // RESEARCH TEMPLATES
  {
    id: 'job-listings-aggregator',
    name: 'Job Listings Aggregator',
    description: 'Collect job postings from various job boards and company websites',
    category: 'research',
    icon: '💼',
    difficulty: 'beginner',
    estimatedTime: '6 minutes',
    useCase: 'Job market analysis, salary research, hiring trends, recruitment',
    targetSites: ['LinkedIn Jobs', 'Indeed', 'Glassdoor', 'AngelList', 'Company careers pages'],
    selectors: {
      jobTitle: {
        selector: '.job-title, h1, .position-title, [data-testid="job-title"]',
        description: 'Job title or position',
        required: true,
        dataType: 'text'
      },
      company: {
        selector: '.company, .employer, .company-name, [data-testid="company"]',
        description: 'Hiring company name',
        required: true,
        dataType: 'text'
      },
      location: {
        selector: '.location, .job-location, .city, [data-testid="location"]',
        description: 'Job location',
        required: false,
        dataType: 'text'
      },
      salary: {
        selector: '.salary, .pay, .compensation, .wage',
        description: 'Salary or compensation range',
        required: false,
        dataType: 'text'
      },
      jobType: {
        selector: '.job-type, .employment-type, .position-type',
        description: 'Employment type (full-time, part-time, etc.)',
        required: false,
        dataType: 'text'
      },
      description: {
        selector: '.job-description, .description, .job-summary',
        description: 'Job description and requirements',
        required: true,
        dataType: 'text'
      },
      postedDate: {
        selector: '.posted-date, .date, time, .job-date',
        description: 'Date job was posted',
        required: false,
        dataType: 'date'
      },
      experience: {
        selector: '.experience, .years-experience, .seniority',
        description: 'Required experience level',
        required: false,
        dataType: 'text'
      },
      skills: {
        selector: '.skills, .requirements, .qualifications',
        description: 'Required skills or qualifications',
        required: false,
        dataType: 'text'
      }
    },
    settings: {
      engine: 'PLAYWRIGHT',
      delay: 1500,
      timeout: 25000,
      retries: 2,
      respectRobots: true,
      javascript: true
    },
    schedule: {
      type: 'cron',
      cronExpression: '0 9 * * 1' // Weekly on Monday at 9 AM
    },
    outputFormat: 'JSON',
    tags: ['jobs', 'recruitment', 'research', 'market-analysis'],
    popularity: 76,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-13'
  }
];

export const getTemplatesByCategory = (category: ScraperTemplate['category']) => {
  return SCRAPER_TEMPLATES.filter(template => template.category === category);
};

export const getTemplateById = (id: string) => {
  return SCRAPER_TEMPLATES.find(template => template.id === id);
};

export const getPopularTemplates = (limit = 5) => {
  return SCRAPER_TEMPLATES
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
};

export const searchTemplates = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return SCRAPER_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    template.useCase.toLowerCase().includes(lowercaseQuery)
  );
};

export const TEMPLATE_CATEGORIES = [
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Product monitoring, pricing, marketplace data',
    icon: '🛒',
    color: 'blue'
  },
  {
    id: 'news',
    name: 'News & Media',
    description: 'Articles, press releases, media monitoring',
    icon: '📰',
    color: 'green'
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Posts, profiles, engagement metrics',
    icon: '📱',
    color: 'purple'
  },
  {
    id: 'lead-generation',
    name: 'Lead Generation',
    description: 'Contact information, business data',
    icon: '📇',
    color: 'orange'
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Market research, data analysis, trends',
    icon: '🔬',
    color: 'indigo'
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    description: 'Website changes, uptime, performance',
    icon: '📊',
    color: 'red'
  }
];
