# Arcatrans website

A modern, mobile-first website for arcatrans.com. Plain HTML, CSS and JavaScript with a small PHP form handler, so it runs on standard GoDaddy hosting with no build step.

## What's included

| Feature | Where |
|---|---|
| Hero with quick-quote widget (fills in the full quote form) | `index.html` |
| Full quote request form (lane, equipment, date, weight, contact) | `#quote` |
| Shipment status request (load/PRO number → emails dispatch) | `#track` |
| Driver / owner-operator application | `#careers` |
| Services, industries, process, FAQ, contact | `index.html` |
| Email delivery of all forms, spam honeypot, rate limit | `send.php` |
| SEO: meta tags, Open Graph, schema.org, sitemap, robots | `index.html`, `sitemap.xml`, `robots.txt` |
| HTTPS redirect, caching, compression, security headers | `.htaccess` |
| Privacy policy and 404 page | `privacy.html`, `404.html` |

## Before going live: replace the placeholders

1. **`assets/js/config.js`**: phone, email, address, USDOT and MC numbers.
2. **`send.php`**: `RECIPIENT` (your inbox) and `FROM_ADDRESS` (an address on arcatrans.com).
3. **`index.html`**:
   - The numbers in the stats bar (99% on-time, 48 states, 15 min) are examples. Change them to figures you can stand behind.
   - Check the services list matches what you actually offer, and remove what you don't.
   - Update the phone and email in the `<script type="application/ld+json">` block.

## Deploy to GoDaddy (cPanel / Linux hosting)

1. **Back up the current site first:** cPanel → File Manager → `public_html` → select all → Compress → download the zip.
2. Upload these files into `public_html`, keeping the folder structure. Include the hidden `.htaccess` file (in File Manager, Settings → "Show hidden files").
3. Make sure `index.html` is the homepage. Remove or rename any old `index.php` / `index.htm`, because those may take priority.
4. Open the site, submit each form once, and confirm the emails arrive. Check the spam folder too.

**If the site was built with GoDaddy Website Builder** (not cPanel), it can't take custom files. You'd need a hosting plan with cPanel, or another static host such as Netlify, Cloudflare Pages or GitHub Pages pointed at your domain. Without PHP, set `formEndpoint` in `config.js` to a Formspree (or similar) URL.

## Preview locally

```bash
php -S localhost:8000
```

Then open http://localhost:8000. Forms will report an error locally unless the machine can send mail.
