import {
  ApplicationConfig, importProvidersFrom,
  APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
// Importing providers
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideFileRouter } from '@analogjs/router';
import { withPrismHighlighter } from '@analogjs/content/prism-highlighter';
import { withShikiHighlighter } from '@analogjs/content/shiki-highlighter'
import { provideContent, withMarkdownRenderer } from '@analogjs/content';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
// Importing router providers
import {
    withEnabledBlockingInitialNavigation,
    withInMemoryScrolling,
} from '@angular/router';
// Importing translation providers
import {
  MissingTranslationHandler,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {
  ServerSafeTranslateLoader,
  languageInitializerFactory,
  CustomMissingTranslationHandler,
} from '~/app/utils/translation-loader.factory';

import { AuthInterceptor } from '~/app/utils/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Core Providers
    provideHttpClient(withFetch()),
    provideClientHydration(),
    provideContent(withMarkdownRenderer(), withShikiHighlighter()),
    provideAnimations(),
    provideFileRouter(
      withInMemoryScrolling({ anchorScrolling: 'enabled' }),
      withEnabledBlockingInitialNavigation()
    ),
    // HTTP Interceptors
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    
    // PrimeNG Services
    ConfirmationService,
    MessageService,
    
    // Translation Module, and language initialization
    {
      provide: APP_INITIALIZER,
      useFactory: languageInitializerFactory,
      deps: [TranslateService, PLATFORM_ID],
      multi: true,
    },
    importProvidersFrom(
      TranslateModule.forRoot({
        useDefaultLang: true,
        loader: {
          provide: TranslateLoader,
          useClass: ServerSafeTranslateLoader,
        },
        missingTranslationHandler: {
          provide: MissingTranslationHandler,
          useClass: CustomMissingTranslationHandler
        },
      })
    ),
  ],
};
