interface SupportInfo {
  title: string;
  intro: string[];
  links: {
    title: string;
    routerLink?: string;
    href?: string;
    description: string;
    icon: string;
  }[];
}


export const hostedSupport: SupportInfo = {
  title: 'Domain-Locker.com Support',
  intro: [
  'We offer support to all users on the Pro plan or above.'
  + 'As well as some assistance with issues, data requests and security'
  + 'queries to all other users.',
  'Where possible, we aim to resolve issues within a few hours, depending on'
  + 'severity and complexity.'
  + 'You will receive a (human!) response within 2 working days of submitting any a ticket.',
  ],
  links: [
    {
      title: 'Submit a ticket',
      routerLink: '/about/support/contact',
      description: '',
      icon: '',
    },
    {
      title: 'Frequently Asked Questions',
      routerLink: '/about/support/faq',
      description: '',
      icon: '',
    },
    {
      title: 'Learn',
      routerLink: '/about/articles',
      description: '',
      icon: '',
    },
  ],
};

export const selfHostedSupport: SupportInfo = {
  title: 'Support for Self-Hosted Instances',
  intro: [
    'Please note, that we are unable to guarantee support for those running a self-hosted '
    + 'instance of Domain Locker on their own infrastructure at this time. '
    + 'But we have got comprehensive docs and resources which should cover '
    + 'any issues you might be facing. ',
    'If that fails, enable debug mode to determine where and why the issue occurs. '
    + 'You will then be able to locate the source of the problem in the code, '
    + 'and apply any fixes or mitigations to resolve your bug.' ,
  ],
  links: [
    {
      title: 'Developing Documentation',
      routerLink: '/about/developing',
      description: '',
      icon: '',
    },
    {
      title: 'Third-Party Docs',
      routerLink: '/about/developing/third-party-docs',
      description: '',
      icon: '',
    },
    {
      title: 'Source Code',
      href: 'https://github.com/lissy93/domain-locker',
      description: '',
      icon: '',
    },
    {
      title: 'Resolving a Bug',
      routerLink: '/about/developing/debugging',
      description: '',
      icon: '',
    },
  ],
};

export const supportContent: SupportInfo[] = [ hostedSupport, selfHostedSupport ];
