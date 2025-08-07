declare module 'js-cookie' {
  interface CookieAttributes {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  }

  interface CookiesStatic {
    set(name: string, value: string | object, options?: CookieAttributes): string | undefined;
    get(name: string): string | undefined;
    get(): { [key: string]: string };
    remove(name: string, options?: CookieAttributes): void;
    getJSON(name: string): any;
    withAttributes(attributes: CookieAttributes): CookiesStatic;
    withConverter(converter: {
      read: (value: string, name: string) => string;
      write: (value: string, name: string) => string;
    }): CookiesStatic;
    noConflict(): CookiesStatic;
  }

  const Cookies: CookiesStatic;
  export = Cookies;
  export as namespace Cookies;
} 