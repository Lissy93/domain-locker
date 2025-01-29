
export interface AboutLink {
  title: string;
  description: string;
  link?: string;
  href?: string;
  icon: string;
}

export interface AboutPage {
  title: string;
  dirSlug?: string;
  links: AboutLink[];
}

export const aboutPages: AboutPage[] = [
  {
    title: 'Intro',
    links: [
      {
        title: 'Why?',
        description: 'Discover why Domain Locker exists, and why you need a domain management system',
        link: '/about/domain-management',
        icon: '',
      },
      { title: 'Features', description: 'Domain Locker is packed full of features, discover what it can do for you', link: '/about/features', icon: '' },
      { title: 'Pricing', description: 'Getting started is free, if you need to scale up, we\'ve got an affordable plan for you', link: '/about/pricing', icon: '' },
      { title: 'Comparison', description: 'Compare alternatives to Domain Locker, to find the right solution for you', link: '/about/alternatives', icon: '' },
      { title: 'Self-Hosting', description: 'Domain Locker is open source, and can be self-hosted with Docker', link: '/about/self-hosting', icon: 'pi pi-server' },
      { title: 'Live Demo', description: 'Try Domain Locker live, before you signup/self-host', link: '/about/demo', icon: 'pi pi-desktop' },
    ],
  },
  {
    title: 'Articles',
    links: [
      { title: 'Useful tools and resources', description: 'Free and/or open source tools, utils and services for managing domains', link: '/about/external-tools', icon: '' },
      { title: 'What is a domain name', description: '', link: '', icon: '' },
      { title: 'Registering and managing domains', description: '', link: '', icon: '' },
      { title: 'Using a custom domain for your app', description: '', link: '', icon: '' },
      
    ],
  },
  {
    title: 'Community',
    links: [
      { title: 'Attributions', description: 'Shout outs to everyone whose made Domain Locker possible', link: '/about/attributions', icon: 'pi pi-heart' },
      { title: 'Support Domain Locker', description: 'Ways you can help us out', link: '/about/we-need-you', icon: 'pi pi-heart' },
      { title: 'Contributing', description: 'Contributing guidelines for Domain Locker\'s open source code', link: '', icon: '' },
    ],
  },
  {
    title: 'Support',
    links: [
      { title: 'How-Tos', description: 'Short guides to help you mae the most of Domain Locker', link: '/about', icon: '' },
      { title: 'FaQ', description: 'Answers to commonly asked questions', link: '/about/faq', icon: 'pi pi-question-circle' },
      { title: 'Contact', description: 'Get in touch or raise a support ticket', link: '/about/contact', icon: '' },
    ],
  },
  {
    title: 'Legal',
    dirSlug: 'legal',
    links: [
      // These pages are auto-populated from the /src/content/docs/legal/*.md files
      // Files include: accessibility, community-guidelines, cookies, gdpr-statement,
      // license, privacy-policy, security and terms-of-service
    ],
  },
  {
    title: 'Developing',
    dirSlug: 'developing',
    links: [
      
    ],
  },
  {
    title: 'External Links',
    links: [
      { title: 'GitHub', description: 'Domain Locker source code', href: 'https://github.com/lissy93/domain-locker', icon: 'pi pi-github' },
      { title: 'DockerHub', description: 'Docker container for self-hosting', href: 'https://hub.docker.com/r/lissy93/domain-locker', icon: '' },
      { title: 'Useful Domain Tools', description: 'More free & open source tools for domain management', link: '/about/external-tools', icon: 'pi pi-external-link' },
      { title: 'AS93 Apps', description: 'More apps developed by the creator of Domain Locker', href: 'https://apps.aliciasykes.com', icon: '' },
    ],
  },
];
