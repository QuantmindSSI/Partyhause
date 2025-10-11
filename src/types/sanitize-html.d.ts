declare module 'sanitize-html' {
  interface AllowedAttributeMap {
    [tagName: string]: string[];
  }

  interface SanitizeOptions {
    allowedTags?: string[];
    allowedAttributes?: AllowedAttributeMap;
    allowedSchemes?: string[];
    [key: string]: any;
  }

  function sanitize(dirty: string, options?: SanitizeOptions): string;

  export = sanitize;
}
