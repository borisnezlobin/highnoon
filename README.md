# High noon

A countdown timer for a screen people walk past. An ink blob sits behind the digits and splits apart when your cursor gets close, and strands of glass triangles drift around it.

![The countdown showing 20:18:08 until noon tomorrow, with glass strands curving behind a dark blob](docs/screenshot.jpg)

## Run it locally

```sh
npm install
npm run dev
```

Open the printed URL, move your mouse to the bottom-right corner, and click the cog to open the timer settings. Your changes apply right away and stay saved in that browser.

The timer counts down in one of two ways:

- **Until a time** counts toward a date and time you pick on the calendar, like noon tomorrow.
- **Time left** counts down a length you choose, like 15 minutes for a talk. It waits until you press **Start**, and you can pause, resume and reset it. Press <kbd>Space</kbd> to start or pause and <kbd>R</kbd> to reset.

You can also change the caption, the text shown at zero, and the font.

Press <kbd>F</kbd> or use the Fullscreen button to fill the screen. While the timer is fullscreen it asks the browser to keep the display awake, so a laptop won't dim or sleep during a presentation.

## Share a timer at its own link

Shared timers live at `bntimer.surge.sh/<link-name>` and show only the countdown, with no settings.

Set up the timer in the settings panel, type a link name such as `team-demo` under **Share link**, and click **Create link**. The link works right away, with no redeploy. Links are stored in Firestore, and once a name is taken it can't be changed or reused, so nobody can overwrite someone else's countdown.

### Firestore rules

The security rules live in `firestore.rules`. They let anyone read a single timer and create a new one, and they refuse updates, deletes, listing and malformed timers. Publish them with:

```sh
npm run deploy:rules
```

That uses the Firebase CLI, so log in first with the Google account that owns the `timer-c247f` project (`npx firebase login`). You can also paste the file into the Rules tab of Firestore in the Firebase console.

To check the rules locally against the Firestore emulator (needs Java), run `npm run test:rules`.

## Deploy

The site deploys to [Surge](https://surge.sh). The first time, log in with `npx surge login`. After that, run:

```sh
npm run deploy
```

This builds the site, copies `index.html` to `200.html` so Surge serves the app for every link name, and publishes `dist` to `bntimer.surge.sh`. You only need to redeploy when the code changes, not when someone creates a link.
