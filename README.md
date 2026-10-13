# arcatrans.com

Source for the ARCA website (ARPI Transport Inc.), hosted on GoDaddy cPanel. These files mirror what is served at www.arcatrans.com.

Static HTML/CSS/JS, no build step. Forms are emailed through FormSubmit; the delivery addresses are in `assets/main.js` (`ROUTES`).

## Driver application

The orange "Now hiring" bar at the top of every page, and the Apply buttons on `careers.html`, open the Google Apps Script driver application in a new tab. To change the link, search for `script.google.com` across the `.html` files and replace every match.

## Deploy

cPanel → File Manager → `public_html`: upload the changed files, replacing the existing ones. Back up first (select all → Compress → download).
