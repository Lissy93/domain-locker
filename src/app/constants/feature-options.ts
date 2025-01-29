import { BillingPlans } from '~/app/services/billing.service';

export type FeatureConfig<T> = {
  default: T;
  managed?: T | Record<BillingPlans, T>;
  selfHosted?: T;
  dev?: T;
  demo?: T;
};

export type FeatureDefinitions = {
  domainLimit: FeatureConfig<number>;
  notificationChannels: FeatureConfig<boolean>;
  changeNotifications: FeatureConfig<boolean>;
  visualStats: FeatureConfig<boolean>;
  domainMonitor: FeatureConfig<boolean>;
  changeHistory: FeatureConfig<boolean>;
  accountSettings: FeatureConfig<boolean>;
  writePermissions: FeatureConfig<boolean>;
  disableDocs: FeatureConfig<boolean>;
  disableSignUp: FeatureConfig<boolean>;
  disableSocialLogin: FeatureConfig<boolean>;
};

export const features: FeatureDefinitions = {
  domainLimit: {
    default: 10000,
    managed: {
      free: 5,
      hobby: 20,
      pro: 100,
      enterprise: 1000,
    },
  },
  notificationChannels: {
    default: false,
    managed: {
      free: false,
      hobby: true,
      pro: true,
      enterprise: true,
    },
  },
  changeNotifications: {
    default: false,
    managed: {
      free: false,
      hobby: true,
      pro: true,
      enterprise: true,
    },
  },
  visualStats: {
    default: true,
    managed: {
      free: false,
      hobby: true,
      pro: true,
      enterprise: true,
    },
  },
  domainMonitor: {
    default: true,
    selfHosted: false,
    managed: {
      free: false,
      hobby: false,
      pro: true,
      enterprise: true,
    },
  },
  changeHistory: {
    default: true,
    selfHosted: false,
    managed: {
      free: false,
      hobby: true,
      pro: true,
      enterprise: true,
    },
  },
  accountSettings: {
    default: true,
    managed: true,
    selfHosted: false,
  },
  writePermissions: {
    default: true,
    demo: false,
  },
  disableDocs: {
    default: false,
    demo: true,
    selfHosted: true,
  },
  disableSignUp: {
    default: false,
    demo: true,
  },
  disableSocialLogin: {
    default: false,
    demo: true,
  },
};

export const featureDescriptions: Record<keyof FeatureDefinitions, { label: string; description: string }> = {
  domainLimit: {
    label: 'Domain Limit',
    description: 'The maximum number of domains you can add to your account',
  },
  notificationChannels: {
    label: 'Notification Channels',
    description: 'Receive notifications via email, push notifications, or webhooks',
  },
  changeNotifications: {
    label: 'Change Notifications',
    description: 'Receive notifications when the status of your domains change',
  },
  visualStats: {
    label: 'Stats',
    description: 'View detailed statistics for your domains',
  },
  domainMonitor: {
    label: 'Domain Monitor',
    description: 'Monitor the status of your domains for uptime, responsiveness, and more',
  },
  changeHistory: {
    label: 'Change History',
    description: 'View a history of changes to your domains',
  },
  accountSettings: {
    label: 'Account Settings',
    description: 'Update your account settings',
  },
  writePermissions: {
    label: 'Write Permissions',
    description: 'Allow others to write to your account',
  },
  disableDocs: {
    label: 'No Documentation',
    description: 'Disable access to the local documentation',
  },
  disableSignUp: {
    label: 'Disable Sign Up',
    description: 'Prevent new users from signing up',
  },
  disableSocialLogin: {
    label: 'Disable Social Login',
    description: 'Prevent users from signing up or logging in with social accounts',
  },
};
