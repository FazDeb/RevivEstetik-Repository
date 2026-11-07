# Test-site CMS sign-in

The editor at https://revivestetik-dev.pages.dev/admin/ uses Decap's GitHub backend.
Publish commits content/images to `dev/cms-rebuild`; Cloudflare then rebuilds the
test site. The owner needs a GitHub account with write access to this repository.
The local editor still uses the loopback filesystem proxy.

## Account setup (performed by the account owner)

1. GitHub Settings > Developer settings > OAuth Apps > New OAuth App:
   - Application name: `RevivEstetik Dev CMS`
   - Homepage URL: `https://revivestetik-dev.pages.dev`
   - Authorization callback URL: `https://revivestetik-dev.pages.dev/api/callback`
   - Leave device flow disabled.
2. In Cloudflare Pages > `revivestetik-dev` > Settings > Variables and Secrets,
   add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (use Secret for the secret).
   Use the **Production** environment of this test project: its production branch
   is `dev/cms-rebuild`. Do not put these in GitHub, chat, or public/admin/config.yml.
3. Commit/push the prepared code to `dev/cms-rebuild` and deploy after saving the
   variables. Cloudflare detects `rebuild/functions` because `rebuild` is the build
   root; only `/api/*` invokes a Function. No Astro adapter is required.
4. Visit the canonical test-site `/admin/`, click GitHub login, and authorize.
   Test with an agreed small content change, Publish, wait for a successful build,
   verify the result, and restore the content through the editor.

## Permissions and boundaries

This public repository uses the `public_repo` OAuth scope. GitHub OAuth scopes are
not limited to one repository or branch: the token can access other public repos
the user can write to. The CMS configuration chooses the dev branch; it is not a
security boundary. Use GitHub branch protection/rulesets to restrict main if needed.
The auth service checks repository write permission before returning a token.

The callback uses a signed ten-minute Secure/HttpOnly cookie, state and PKCE.
Tokens are sent only to the same-origin opener through Decap's handshake. Secrets
stay in Cloudflare; Decap receives a user access token in the editor browser.
Preview hostnames cannot authenticate; use the canonical `revivestetik-dev.pages.dev`
address. Updating the future production host requires an explicit configuration
change and a matching OAuth callback.

`node --test scripts/auth.test.mjs` covers session rejection, permissions, popup
restrictions, and local/online config. Real GitHub login and publish must still be
checked after account setup; mocked tests do not establish that those work live.
