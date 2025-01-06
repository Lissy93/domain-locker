export const features = [
  {
    featureTitle: 'Track Assets',
    icon: 'track',
    featureInfo: [
      'We auto-fetch assets like SSL, hosts, registrars, IPs, DNS, subdomains.',
      'You can add additional context, like costs, tags, notes, and more.',
    ],
    screenshot: 'https://placehold.co/600x300/1f2937/fff',
  },
  {
    featureTitle: 'Domain Data',
    icon: 'data',
    featureInfo: [
      'Dive into a detailed analysis of each of your domains.',
      'Security insights and recommended actions for each domain.',
    ],
  },

  {
    featureTitle: 'Stats',
    icon: 'chart',
    featureInfo: [
      'Visualize domain data with charts and analytics.',
      'Exportable maps, change timelines, provider breakdowns, and more.',
    ],
  },
  {
    featureTitle: 'Notifications',
    icon: 'notification',
    featureInfo: [
      'Alerts for expirations and configurable domain change notifications.',
      'Choose your method: email, webhook, push, Telegram, Signal, etc.',
    ],
  },
  {
    featureTitle: 'Data',
    icon: 'export',
    featureInfo: [
      'Access via API, Prometheus, iCal, RSS, or embeddable widgets (coming soon).', 
      'Export your data anytime for migration or backup.',
    ],
  },
  {
    featureTitle: 'Track Changes',
    icon: 'logs',
    featureInfo: [
      'View audit logs for all domain changes.',
      'Track updates to security, host, SSL, DNS, WHOIS, and more.',
    ],
  },
  {
    featureTitle: 'Renewal Alerts',
    icon: 'expire',
    featureInfo: [
      'View timeline of upcoming expirations.',
      'Never miss a renewal deadline, with smart alerts.',
    ],
  },
  {
    featureTitle: 'Monitor',
    icon: 'monitor',
    featureInfo: [
      'Monitor website health and performance.',
      'Track uptime, ping times, response codes and availability.',
    ],
  },
  {
    featureTitle: 'Security Check',
    icon: 'secure',
    featureInfo: [
      'Security insights and recommended actions for each domain',
      'Ensure your websites and domains have the correct security controls.',
    ],
  },
  {
    featureTitle: 'Valuation',
    icon: 'value',
    featureInfo: [
      'Track purchase price, renewal costs, and current valuation.',
      'Manage upcoming payments and monitor profit/loss trends.',
    ],
  },
  {
    featureTitle: 'Organize',
    icon: 'organize',
    featureInfo: [
      'Categorise domains in your portfolio with tags.',
      'Keep track of links, with all domain-related resources in one place.',
    ],
  },
  {
    featureTitle: 'Toolbox',
    icon: 'tools',
    featureInfo: [
      'AI-powered domain ideas, smart availability search, free valuation',
      'Enterprise-grade web analysis, monitoring and auditing tools',
    ],
  },
  // {
  //   featureTitle: 'Link',
  //   icon: 'links',
  //   featureInfo: [
  //     'Detailed map of your web presence, with automatically fetched assets.',
  //     'Never loose track of a specific URL for any of your domains, ever again.',
  //   ],
  // },
  {
    featureTitle: 'Customizable',
    icon: 'customize',
    iconViewBox: '0 0 576 512',
    featureInfo: [
      'Make the app yours, with customizable themes, fonts, layouts, and dark modes',
      'Multi-language support, with translations available for many languages.',
    ],
  },
  {
    featureTitle: 'Private & Secure',
    icon: 'private',
    featureInfo: [
      'Full control of your data with easy import/export/deletion.',
      'SSO (GitHub, Google) and 2FA for extra security.',
      'No unnecessary data collection, transparent privacy policy.',
    ],
  },
  {
    featureTitle: 'Open Source',
    icon: 'open',
    featureInfo: [
      'Download, review, and improve our open-source code.',
      'Self-host Domain Locker on your own server.',
    ],
  },
  {
    featureTitle: 'Quality',
    icon: 'quality',
    featureInfo: [
      'Accessible, responsive, and lightning-fast.',
      'Well-documented and thoroughly tested for reliability.',
    ],
  },
];

// Additional features: Search, 


// Alternatives: domainLocker, domainMod, domainWatchman, domainPunch
// Features: Auto-fetch data, keep up-to-date, track changes, notifications, valuation, monitor health, view stats, open source, multi-language support, custom UI

export enum Has {
  Yes = 1,
  No = -1,
  Some = 0,
}

export type Providers = 'domainLocker' | 'domainMod' | 'domainWatchman' | 'domainPunch';

export interface FeatureComparison {
  feature: string;
  description: string;
  icon?: string;
  comparison: Record<Providers, { has: Has; notes?: string }>;
}

export interface ProviderInfo {
  name: string;
  url: string;
  icon: string;
  summary: string;
}

export const providerInfo: Record<Providers, ProviderInfo> = {
  domainLocker: {
    name: 'Domain Locker',
    url: 'https://domain-locker.com',
    icon: 'https://i.ibb.co/D7DdmVB/dl-v1.png',
    summary: '',
  },
  domainMod: {
    name: 'Domain Mod',
    url: 'https://domainmod.org',
    icon: 'https://github.com/homarr-labs/dashboard-icons/blob/a19b2ba31117a832e496777e863943802ff7fdc9/png/domainmod.png?raw=true',
    summary: '',
  },
  domainWatchman: {
    name: 'Domain Watchman',
    url: 'https://domainwatchman.com',
    icon: 'https://domainwatchman.com/android-chrome-192x192.png',
    summary: '',
  },
  domainPunch: {
    name: 'Domain Punch',
    url: 'https://domainpunch.com',
    icon: 'https://bcdn.domainpunch.com/images/icons/products/dppro.png',
    summary: '',
  },
}

export const alternativeComparison: FeatureComparison[] = [
  {
    feature: 'Auto-fetch data',
    description: '',
    comparison: {
      domainLocker: {
        has: Has.Yes,
        notes: 'Registrar, SSL, DNS, IPs, Hosts and more is auto-fetched when you add a domain',
      },
      domainMod: {
        has: Has.Some,
        notes: 'Data is entered manually when you add a domain, but there is auto-fetching functionality for keeping it up-to-date',
      },
      domainWatchman: {
        has: Has.Yes,
        notes: 'Registrar, expiry and name servers are auto-fetched when you add a domain',
      },
      domainPunch: {
        has: Has.Yes,
        notes: '',
      },
    },
  },
  {
    feature: 'Data Updated Regularly',
    description: '',
    comparison: {
      domainLocker: {
        has: Has.Yes,
        notes: '',
      },
      domainMod: {
        has: Has.Yes,
        notes: '',
      },
      domainWatchman: {
        has: Has.No,
        notes: '',
      },
      domainPunch: {
        has: Has.Yes,
        notes: 'Yes, but manual refresh is required',
      },
    },
  },
  {
    feature: 'Track Changes',
    description: '',
    comparison: {
      domainLocker: {
        has: Has.Yes,
        notes: 'View audit logs for all domain changes, including security, host, SSL, DNS, WHOIS, and more',
      },
      domainMod: {
        has: Has.No,
        notes: 'Data is updated, but there is no audit log',
      },
      domainWatchman: {
        has: Has.No,
        notes: '',
      },
      domainPunch: {
        has: Has.No,
        notes: '',
      },
    },
  },
  {
    feature: 'Alerts',
    description: '',
    comparison: {
      domainLocker: {
        has: Has.Yes,
        notes: 'Alerts for expirations or changes to SSL, host, registrar, etc.',
      },
      domainMod: {
        has: Has.Some,
        notes: 'Expiration emails',
      },
      domainWatchman: {
        has: Has.Some,
        notes: 'Expiration alerts',
      },
      domainPunch: {
        has: Has.Some,
        notes: 'DNS only',
      },
    },
  },
  {
    feature: 'Notifications Channels',
    description: '',
    comparison: {
      domainLocker: {
        has: Has.Yes,
        notes: 'Email, Slack, Telegram, Webhook, etc',
      },
      domainMod: {
        has: Has.Yes,
        notes: 'Email',
      },
      domainWatchman: {
        has: Has.Yes,
        notes: 'Email, Discord, Slack, Telegram',
      },
      domainPunch: {
        has: Has.No,
        notes: '',
      },
    },
  },
  {
    feature: 'Expiry Notifications',
    description: '',
    comparison: {
      domainLocker: {
        has: Has.Yes,
      },
      domainMod: {
        has: Has.Yes,
      },
      domainWatchman: {
        has: Has.Yes,
      },
      domainPunch: {
        has: Has.Yes,
      },
    },
  },
  {
    feature: 'Value Tracking',
    description: '',
    comparison: {
      domainLocker: {
        has: Has.Yes,
        notes: '',
      },
      domainMod: {
        has: Has.Yes,
        notes: '',
      },
      domainWatchman: {
        has: Has.No,
        notes: '',
      },
      domainPunch: {
        has: Has.Yes,
        notes: '',
      },
    },
  },
  {
    feature: 'Domain Health',
    description: 'Track uptime, web status, response code, handshake, DNS resolution time',
    comparison: {
      domainLocker: {
        has: Has.Some,
        notes: 'Yes, but only on Pro plan',
      },
      domainMod: {
        has: Has.No,
        notes: '',
      },
      domainWatchman: {
        has: Has.No,
        notes: '',
      },
      domainPunch: {
        has: Has.No,
        notes: '',
      },
    },
  },
  {
    feature: 'Segements / Tags',
    description: 'Categories for domains into buckets',
    comparison: {
      domainLocker: {
        has: Has.Yes,
      },
      domainMod: {
        has: Has.Yes,
      },
      domainWatchman: {
        has: Has.Yes,
      },
      domainPunch: {
        has: Has.Yes,
      },
    },
  },
  {
    feature: 'Registrar API Access',
    description: 'Integrate with domain registrar API for advanced domain management',
    comparison: {
      domainLocker: {
        has: Has.No,
      },
      domainMod: {
        has: Has.Some,
      },
      domainWatchman: {
        has: Has.No,
      },
      domainPunch: {
        has: Has.No,
      },
    },
  },
  {
    feature: 'Stats',
    description: 'Visualize domain data with charts and analytics',
    comparison: {
      domainLocker: {
        has: Has.Yes,
        notes: '',
      },
      domainMod: {
        has: Has.No,
        notes: '',
      },
      domainWatchman: {
        has: Has.No,
        notes: '',
      },
      domainPunch: {
        has: Has.No,
        notes: '',
      },
    },
  },
  {
    feature: 'Open Source',
    description: 'The source code is available for download and review',
    comparison: {
      domainLocker: {
        has: Has.Yes,
      },
      domainMod: {
        has: Has.Yes,
      },
      domainWatchman: {
        has: Has.No,
      },
      domainPunch: {
        has: Has.No,
      },
    },
  },
  {
    feature: 'Multi-language Support',
    description: 'The UI is translatable into multiple locales',
    comparison: {
      domainLocker: {
        has: Has.Yes,
      },
      domainMod: {
        has: Has.Yes,
      },
      domainWatchman: {
        has: Has.No,
      },
      domainPunch: {
        has: Has.No,
      },
    },
  },
  {
    feature: 'Themable UI',
    description: 'The apps colors and layout can be adjusted according to preference',
    comparison: {
      domainLocker: {
        has: Has.Yes,
      },
      domainMod: {
        has: Has.No,
      },
      domainWatchman: {
        has: Has.No,
      },
      domainPunch: {
        has: Has.No,
      },
    },
  },
  {
    feature: 'Data Backup / Restore',
    description: 'Domain lists can be exported and imported with ease',
    comparison: {
      domainLocker: {
        has: Has.Yes,
      },
      domainMod: {
        has: Has.Yes,
      },
      domainWatchman: {
        has: Has.No,
      },
      domainPunch: {
        has: Has.Yes,
      },
    },
  },
];

