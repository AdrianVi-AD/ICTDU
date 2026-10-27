# Working on ICTDU

This remains a static HTML site. Open it with VS Code Live Server or another static server.

The contact forms prepare email drafts addressed to spcf.ictdu@spcf.edu.ph. Visitors review and send them in their email app. No server delivery is claimed.

Edit shared header, footer and form content in partials/, then run:

```sh
python tools/sync_shared.py
```

The generated HTML works directly on a static host. Preserve shared-region markers.

Run the dependency-free Node tests with:

```sh
node --test
```

Original images remain in image/ and img/. Optimized responsive copies are in assets/.
Recruitment and event dates from 2023–2024 are marked as archives. Use confirmed schedules when updating them.
