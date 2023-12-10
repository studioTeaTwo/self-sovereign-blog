import { dev } from '$app/environment';
import { PUBLIC_BLOG_SERVER, PUBLIC_L402_SERVER } from '$env/static/public';
import type { CookieSerializeOptions } from 'cookie';

export const Title = 'Self Sovereign Blog';
export const SiteUrl = dev ? 'http://localhost:5137' : PUBLIC_BLOG_SERVER;
export const L402server = dev ? 'http://localhost:8180' : PUBLIC_L402_SERVER;
export const Author = 'TeaTwo';
export const SiteUrl = dev ? 'http://localhost:5137' : 'https://self-sovereign-blog.vercel.app';
export const RepositoryUrl = 'https://github.com/studioTeaTwo/self-sovereign-blog';
export const BitcoinDonationAddress = 'bc1q8pmsy0xfrkpr3vky9kw5kjmqrm0fsg70q963dg';

export const CookieOptions: CookieSerializeOptions = { path: '/', maxAge: 2592000 };
