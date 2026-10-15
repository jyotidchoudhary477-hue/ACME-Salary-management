/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_ORG_NAME?: string;
  readonly VITE_APP_TAGLINE?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_DEV_PORT?: string;
  readonly VITE_SALARY_PLACEHOLDER?: string;
  readonly VITE_DEFAULT_PAGE_SIZE?: string;
  readonly VITE_PAGE_SIZE_OPTIONS?: string;
  readonly VITE_COMPARE_MAX?: string;
  readonly VITE_DEFAULT_SALARY_REASON?: string;
  readonly VITE_NOTE_AUTHOR?: string;
  readonly VITE_NAV_DASHBOARD?: string;
  readonly VITE_NAV_EMPLOYEES?: string;
  readonly VITE_NAV_ANALYTICS?: string;
  readonly VITE_NAV_SETTINGS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
