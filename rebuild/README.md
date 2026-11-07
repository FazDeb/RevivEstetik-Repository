# RevivEstetik: local content editor

This checkout uses Astro and Decap CMS. Work remains on dev/cms-rebuild. Cloudflare Pages hosts the test site. GitHub login and publishing code is prepared; follow CMS-SETUP.md to configure credentials and verify online publishing.

## Start locally

Use a supported Node version (22.23.4+). From rebuild/, run npm install once, then keep these two terminals running:

1. npm run dev â€” website at http://127.0.0.1:4321
2. npm run cms â€” file proxy on 127.0.0.1:8081

Open http://127.0.0.1:4321/admin/ and click Login. This local Login button does not require an account. In local mode Publish / Publish now saves files on this computer only, without committing or pushing. Refresh the website to see edits. Keep the proxy bound to loopback; it is a local development tool.

## Content

content/home.json: clinic name, tagline, homepage introduction.
content/about.json: About copy, sections, Google Maps embed URLs.
content/contact.json: telephone, mobile, email, address and opening hours.
content/social.json: Facebook, Instagram and TikTok.
content/treatments/: one JSON file per treatment, including sections and image path.
public/images/: existing images and CMS uploads.

In Treatments, add/edit/remove records. Page addresses must be unique lowercase slugs. Display order controls listing order. For existing treatments, keep page addresses stable to preserve links. Media uploads write to rebuild/public/images and content stores /images/... paths.

## Verification and production

npm run build generates static output in dist/. scripts/check-build.py verifies current page count and internal assets/links. Update the expected count when adding/removing treatments.

The editor uses a locally served pinned Decap browser bundle (see public/admin/decap-version.txt), so the UI does not require an external CDN at runtime. public/admin/config.yml is JSON, which is valid YAML. The canonical test-site editor uses the GitHub backend after OAuth credentials are configured in Cloudflare. Other online hosts are blocked. The local proxy is filesystem mode, never Git mode.

Sanity is no longer used. Its old configuration and seed data were moved outside this repository into the chat workspace's work/sanity-backup folder. The previous single content.json is also archived there; the split content files are the source of truth.

Before launch: configure GitHub sign-in and automated deployment, check old URL redirects and canonical metadata, review treatment content, remove noindex for public pages, and resolve remaining dependency advisories. Do not expose the local editing proxy online.
