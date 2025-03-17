import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { APP_ID } from '@angular/core';

const serverProviders = [
  provideServerRendering(),
  { provide: APP_ID, useValue: 'domain-locker' },
];

const serverConfig: ApplicationConfig = {
  providers: serverProviders,
};

export const config = mergeApplicationConfig(serverConfig);
