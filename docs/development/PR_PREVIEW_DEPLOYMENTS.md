# PR Preview Deployments

Honor a Life Song uses GitHub Pages to publish a static visual preview for each same-repository pull request targeting `main`.

## Preview lifecycle

1. `pages-preview.yml` runs for PR open/synchronize/reopen/ready events.
2. The workflow builds the Next.js chassis in static-export mode with a PR-specific base path such as `/Honor-a-life-song/pr-12`.
3. The build uploads the `out/` directory as an Actions artifact using read-only repository permissions.
4. `pages-preview-publish.yml`, running from trusted workflow code on `main`, downloads the successful artifact, publishes it under `gh-pages/pr-12/`, deploys the combined Pages site, and posts or updates the preview URL on the PR.
5. When the PR closes, the publisher removes that PR directory and updates the PR comment to show the preview was removed.

## Expected URL

`https://accelanalysis.github.io/Honor-a-life-song/pr-<PR-number>/`

## Security model

The PR build workflow has `contents: read` only. Repository, PR-comment and Pages write permissions are held by the trusted `workflow_run` publisher. Forked PR artifacts are not published because the publisher requires the workflow-run head repository to equal this repository.

The preview is a static visual-review projection. Production-only identity, database, payments, email/SMS, object storage, authorization and secure-delivery services must remain fail-closed and must not be mocked merely to make the preview appear operational.

## Static export support

`next.config.mjs` switches to `output: "export"` only when `HALS_PAGES_PREVIEW=1`. Normal production builds remain unchanged. Dynamic chassis routes expose finite `generateStaticParams()` projections so the complete current navigation can be visually reviewed on Pages.

## One-time repository setting

GitHub Pages must be enabled for this repository with **Settings → Pages → Build and deployment → Source: GitHub Actions**. Once enabled, no manual work is required for normal same-repository PRs: the preview URL is posted automatically after the preview build and publication workflows succeed.
