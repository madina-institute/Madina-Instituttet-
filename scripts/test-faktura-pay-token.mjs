#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { signFakturaPayToken, verifyFakturaPayToken } = require('../functions/fakturaPayToken.js');

const secret = 'test-secret-key';
const sid = 'student123abc';
const inv = 'invoice456def';

const tokenPlain = signFakturaPayToken(sid, secret);
const tokenInv = signFakturaPayToken(sid, secret, inv);

const okPlain = verifyFakturaPayToken(tokenPlain, secret);
const okInv = verifyFakturaPayToken(tokenInv, secret);
const bad = verifyFakturaPayToken(tokenPlain, 'wrong');

console.log('token length:', tokenPlain.length);
console.log('plain studentId:', okPlain?.studentId === sid, 'invoiceId null:', okPlain?.invoiceId == null);
console.log('invoice token:', okInv?.studentId === sid, 'invoiceId:', okInv?.invoiceId === inv);
console.log('verify bad:', bad === null);

const pass = okPlain?.studentId === sid && okPlain?.invoiceId == null
  && okInv?.studentId === sid && okInv?.invoiceId === inv
  && bad === null;
process.exit(pass ? 0 : 1);
