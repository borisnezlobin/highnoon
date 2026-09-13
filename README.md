# Timer / Stopwatch

A countdown timer that's nice to leave up on a screen. An ink blob sits behind the digits and splits apart when your cursor gets close, and strands of glass triangles drift around it.

**Try it at [bntimer.surge.sh](https://bntimer.surge.sh).**

![The countdown showing 20:18:08 until noon tomorrow, with glass strands curving behind a dark blob](docs/screenshot.jpg)

## Using the timer

Move your mouse to the bottom-right corner and click the cog to open the settings. Everything you change shows up behind the panel right away, and your settings stay saved in your browser for next time.

The timer counts down in one of two ways:

- **Until a time** counts toward a date and time you pick on the calendar, like noon tomorrow or the start of an event.
- **Time left** counts down a length you choose, like 15 minutes for a talk. It waits for you to press **Start**, and you can pause, resume or reset it whenever you like.

You can also write your own caption, change what the screen says when it reaches zero, and pick from four fonts.

Click **Fullscreen** to fill the screen. While the timer is fullscreen, your screen won't dim or go to sleep.

| Key | What it does |
| --- | --- |
| <kbd>F</kbd> | Enter or leave fullscreen |
| <kbd>Space</kbd> | Start or pause a time-left timer |
| <kbd>R</kbd> | Reset a time-left timer |

## Sharing a timer

At the bottom of the settings, type a link name such as `team-demo` and click **Create link**. Your countdown gets its own address, like `bntimer.surge.sh/team-demo`, that you can send to anyone. People who open it see the countdown without the settings.

A few things to know about links:

- Each link name can only be used once, so pick something specific.
- A link keeps the settings it had when you created it. If you change your timer afterwards, make a new link.
- Anyone who opens a time-left link gets their own copy of the timer, which starts when they press **Start**.

## Running your own copy

The site is built with React, TypeScript, Tailwind CSS and WebGL. Shared links are stored in Firebase Firestore.

```sh
npm install
npm run dev
```

To host your own version:

1. Create a Firebase project with a Firestore database, then replace the config in `src/firebase.ts` with your project's web app config.
2. Publish the security rules in `firestore.rules`, either by pasting them into the Firebase console or with `npx firebase deploy --only firestore:rules --project <your-project-id>`. The rules let anyone read a single timer and create a new link, and refuse edits, deletes, listing and malformed data. `npm run test:rules` checks them against the Firestore emulator, which needs Java.
3. Set `SITE_HOST` in `src/timer/timerConfig.ts` to your domain so copied links point to the right place.
4. Run `npm run build` and host the `dist` folder anywhere that serves `index.html` for unknown paths, so links like `/team-demo` load the app. On [Surge](https://surge.sh), copying `index.html` to `200.html` does this, and the `deploy` script in `package.json` shows the full command.
