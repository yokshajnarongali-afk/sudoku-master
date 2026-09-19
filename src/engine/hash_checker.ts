// src/engine/hash_checker.ts

export class HashChecker {
  /**
   * Generates a SHA-256 string hash from an 81-element array.
   */
  public static async generateHash(grid: number[]): Promise<string> {
    const rawString = grid.join('');
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Synchronous fallback hashing for execution contexts where Web Crypto is unavailable.
   */
  public static generateSimpleHash(grid: number[]): string {
    const str = grid.join('');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(36);
  }
}