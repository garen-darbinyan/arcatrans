# arcatrans.com

Source for the ARCA website (ARPI Transport Inc.), hosted on GoDaddy cPanel. These files mirror what is served at www.arcatrans.com.

Static HTML/CSS/JS, no build step. Forms are emailed through FormSubmit; the delivery addresses are in `assets/main.js` (`ROUTES`).

## Driver application

The orange "Now hiring" bar at the top of every page, and the Apply buttons on `careers.html`, open the Google Apps Script driver application in a new tab. To change the link, search for `script.google.com` across the `.html` files and replace every match.

## Deploy

Pushing to `main` deploys automatically: `.github/workflows/deploy.yml` uploads changed files to `public_html` on GoDaddy over FTPS. Progress and errors show under the repository's **Actions** tab, which can also re-run a deploy by hand ("Run workflow").

One-time setup, in GitHub → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| `FTP_SERVER` | `ftp.arcatrans.com` (or the server shown in cPanel → FTP Accounts) |
| `FTP_USERNAME` | cPanel FTP username, e.g. `deploy@arcatrans.com` |
| `FTP_PASSWORD` | that FTP account's password |

If the FTP account was created with a directory other than your home folder, change `server-dir` in the workflow (an account rooted at `public_html` needs `server-dir: ./`).
