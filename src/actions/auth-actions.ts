"use server";

import crypto from "crypto";

export async function authenticateAdmin(email: string, pass: string): Promise<boolean> {
  const trimmedEmail = email.trim().toLowerCase();
  
  // SHA-256 de "admin@admin.com:admin"
  const expectedHash = '4e803d52367ba4f3fb87440ba73693e55c3c0eb4d7e2f5f190e22709210c85c2';
  
  const hash = crypto
    .createHash('sha256')
    .update(`${trimmedEmail}:${pass}`)
    .digest('hex');
    
  return hash === expectedHash;
}
