# DRef 1.0 — medication album and consistent clinical tools

This release brings the medicine photographs and DRef's clinical tools inside https://dref-my.pages.dev. It uses the existing blue-and-white design, self-hosted IBM Plex Sans, consistent headings, form controls and spacing. Meaningful clinical risk colours are preserved. Clinical arithmetic, thresholds, wording and units were not rewritten: all original inline tool scripts are checked against their exported source.

The migration includes 70 drug classes, 154 medicine/brand entries, 572 photo placements and 526 unique original photo files. Photos have not been AI generated, recoloured or resized. There are 32 tools from the original clinical-tools index, plus two supporting CVD screens and the KK Mahligai screening screen. The FRS entry opens a native choice screen for its two existing risk tools.

## Update the existing GitHub repository first

Your hourly updater publishes whatever is in the GitHub repository. If you only upload the new ZIP to Cloudflare while GitHub still contains 0.9, the updater can replace the new deployment with the old app again. Keep both in step using the following procedure.

1. Open https://github.com/azree989/dref-public-app/actions. Select **Update DRef formulary**, open its **…** menu and choose **Disable workflow** temporarily.
2. Download **DRef_Automatic_Updates_v1.0.zip** and extract it into a folder outside your repository.
3. Download/install GitHub Desktop from https://desktop.github.com/download/ and sign in to **azree989**.
4. In GitHub Desktop choose **File → Clone repository → GitHub.com**, select **dref-public-app** and click **Clone**. If needed, use the URL tab with https://github.com/azree989/dref-public-app.
5. Choose **Repository → Show in Explorer**. This opens the local repository folder.
6. Copy these items from the extracted package into that repository folder, merging folders and replacing the existing files when Windows asks:

   - `site`
   - `automation`
   - `migration`
   - `.github`
   - `package.json`
   - `README.md`

   Do not copy the ZIP file itself into the repository. Do not remove the repository's `.git` folder. The package has no Cloudflare token or account ID; your existing GitHub repository secrets remain in GitHub.

7. Return to GitHub Desktop. Under **Changes**, enter the summary **DRef 1.0 album and clinical tools**, click **Commit to main**, then **Push origin**. The photo files are numerous; allow the upload to finish. All individual assets are below the GitHub/Cloudflare file-size limits checked for this release.
8. On GitHub, verify that `site/photos`, `site/clinical`, `site/tool-theme.css` and `.github/workflows/update-formulary.yml` are present.
9. Open **Actions → Update DRef formulary**, choose **Enable workflow**, then **Run workflow → main → Run workflow**. Leave the large-change option unticked.
10. Wait for a green run. It will validate the current Google Sheet and publish the app plus the current formulary data to your existing **dref-my** Pages project. No separate Google Apps Script deployment or new token is required if your 0.9 setup was already successful.

This is the preferred update path. GitHub Desktop handles the hundreds of photo files together; repeated browser uploads are not needed.

## Alternative: dashboard upload after GitHub is updated

If you need a dashboard deployment, use **DRef_Pages_Upload_v1.0.zip** in **Cloudflare → Workers & Pages → dref-my → Create a new deployment → Production**. Keep the ZIP zipped. It has index.html at its root, with static assets only and fewer than 1,000 files. After GitHub contains the matching 1.0 source, the hourly updater will keep using this release. It may republish once to align the current Sheet snapshot.

## Check the release on your device

1. Close existing DRef tabs/the installed app once, then open https://dref-my.pages.dev in a new Incognito window.
2. Open **Medication Album → Antihypertensives → CCB – Dihydropyridines**. You should see the medicine/brand selector and actual photographs inside DRef.
3. Move between photos using thumbnails/arrows or a sideways swipe on mobile. Change medicines with the selector or previous/next buttons. Tap **Enlarge** to inspect packaging; use zoom controls and **Fit photo**.
4. Open **Clinical Tools**. Search for eGFR, warfarin, FIB-4, asthma and one of your screening tools. The tools should open inside DRef with the common font, blue controls and white background.
5. Try your usual known test cases and compare results with the original tools. Check PDF/download actions, the fetal-growth charts and the image-measurement tool on your devices. Styling/source-integrity tests do not constitute a new clinical validation of the inherited tools.
6. Confirm the formulary still searches normally and displays 379 medicines unless the source has since changed.

All module imports are versioned in 1.0 to address the mixed old/new module cache behaviour seen during the 0.9 update. The formulary and app shell are saved for offline use. Tool pages/libraries and viewed images are cached on demand; this is not a download of the whole photo collection. The photo cache is capped at 40 files. Official external reference links still require their providers.

## Source findings to review

- **Enalapril 5mg Tablet — Invoril-5, Ranbaxy:** the export contains the heading/brand but no photographs under it.
- **Rifampicin 300mg Capsule — Royce:** the export contains the heading/brand but no photographs under it.
- **Pantoprazole 40mg — Vencid:** the original brand label says **Vencid 20**, but the box photograph says **40mg**. That discrepancy is marked in the album. Source wording was preserved for your review.

## Maintenance and cost

Medicine/formulary updates continue in your existing Google Sheet and publish through the hourly workflow. Album/tool changes are maintained in `site/` in this repository. Changes made later in the original Google Site are not automatically imported into the PWA. To migrate another set of Google Site changes, provide a new export or update the corresponding PWA files.

The album, tool HTML, fonts, libraries and photos are ordinary Cloudflare Pages static files. This release adds no Worker, Pages Function, R2, KV, D1, paid subscription or domain registration. GitHub's standard public-repository runner is used as before, without artifact storage or dependency caches. Provider uptime and future pricing cannot be guaranteed, but a failed publisher retains the last successful deployment.

Third-party library licences are included in `site/vendor/licenses`. The copied Google Site shell/runtime is not included; only your album media/labels and embedded clinical-tool source are migrated. Duplicate draft Cobb tools and non-clinical pages were not promoted into the main clinical index.

## Verification performed

Checks cover catalogue/routing, all photo hashes/files and source grouping, photo captions, original inline clinical-script hashes, executable-script syntax and structured metadata, local dependencies, album navigation/zoom contracts, iframe sender/origin guards, exact cache allowlists, service-worker fallback, portable publisher behaviour, ZIP integrity and upload-file limits. Visual browser/device QA was unavailable in this environment; the device checks above remain necessary.

## Official guidance

- https://docs.github.com/en/desktop/adding-and-cloning-repositories/cloning-and-forking-repositories-from-github-desktop
- https://docs.github.com/en/desktop/making-changes-in-a-branch/pushing-changes-to-github-from-github-desktop
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/functions/pricing/
