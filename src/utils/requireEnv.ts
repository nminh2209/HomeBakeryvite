/** Read a required VITE_* variable (no in-repo defaults). */
export function requireEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `Missing ${key}. Copy .env.example to .env, set all VITE_* values, and rebuild. ` +
        `On Vercel/GitHub Actions, add the same variables in project secrets.`,
    );
  }
  return value.trim();
}

/** Optional env var (empty string if unset). */
export function optionalEnv(key: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[key];
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  return value.trim();
}
