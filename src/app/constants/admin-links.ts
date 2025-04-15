
export interface LinkItem {
  purpose: string;
  provider: string;
  url: string;
  description?: string;
  upstreamSite?: string;
}

export const selfHostedLinks: LinkItem[] = [
  {
    purpose: 'Container',
    provider: 'Docker',
    url: 'https://docs.docker.com/',
    description: 'Runtime environment',
  },
  {
    purpose: 'Database',
    provider: 'Postgres',
    url: 'https://www.postgresql.org/docs/current/',
    description: 'Database server',
  },
  {
    purpose: 'Framework',
    provider: 'Angular Analog',
    url: 'https://analogjs.org/docs',
    description: 'App client and server library',
  },
];

export const serviceLinks: LinkItem[] = [
  {
    purpose: 'Database',
    provider: 'Supabase',
    url: 'https://supabase.com/dashboard',
    description: 'Postgres DB, auth and edge functions',
  },
  {
    purpose: 'Email',
    provider: 'Resend',
    url: 'https://resend.com/emails',
    description: 'STMP email sending',
  },
  {
    purpose: 'Payments',
    provider: 'Stripe',
    url: 'https://dashboard.stripe.com',
    description: 'Payment processing and subscriptions',
  },
  {
    purpose: 'SMS',
    provider: 'Twilio',
    url: 'https://console.twilio.com',
    description: 'SMS and WhatsApp notification sending',
  },
  {
    purpose: 'DNS',
    provider: 'Cloudflare',
    url: 'https://dash.cloudflare.com',
    description: 'Registrar, DNS, WAF and bot protection',
  },
  {
    purpose: 'Hosting',
    provider: 'Vercel',
    url: 'https://vercel.com',
    description: 'HTTP server for client app and API',
  },
  {
    purpose: 'Error Logs',
    provider: 'Glitchtip',
    url: 'https://glitch.as93.net',
    description: 'Error logging, tracing and alerts',
  },
  {
    purpose: 'Analytics',
    provider: 'Plausible',
    url: 'https://no-track.as93.net',
    description: 'Hit counting and zero-tracking usage stats',
  },
  {
    purpose: 'Status',
    provider: 'Kuma',
    url: 'https://uptime.as93.net/',
    description: 'Uptime and availability monitoring',
    upstreamSite: 'https://uptime.kuma.pet/',
  },
  {
    purpose: 'Feedback',
    provider: 'Formbricks',
    url: 'https://app.formbricks.com/',
    description: 'User surveys and feedback collection',
    upstreamSite: 'https://formbricks.com/',
  },
  {
    purpose: 'Support',
    provider: 'Freshdesk',
    url: 'https://as93.freshdesk.com/',
    description: 'Customer support and ticketing',
    upstreamSite: 'https://www.freshworks.com/',
  },
  {
    purpose: 'Source',
    provider: 'GitHub',
    url: 'https://github.com/Lissy93/domain-locker',
    description: 'Sourcecode VCS, releases, tickets and CI/CD',
  },
  // {
  //   purpose: 'Monitoring',
  //   provider: 'Grafana',
  //   url: '#',
  //   description: 'System logs, alerts and metrics',
  //   upstreamSite: 'https://grafana.com/',
  // },
];
