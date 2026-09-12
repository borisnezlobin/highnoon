# High noon

A countdown timer for a screen people walk past. An ink blob sits behind the digits and splits apart when your cursor gets close, and strands of glass triangles drift around it.

![The countdown showing 20:18:08 until noon tomorrow, with glass strands curving behind a dark blob](docs/screenshot.jpg)

## Run it locally

```sh
npm install
npm run dev
```

Open the printed URL, move your mouse to the bottom-right corner, and click the cog to open the timer settings. There you can pick the end date on a calendar, choose the time, change the caption and the text shown at zero, and switch fonts. Your changes apply right away and stay saved in that browser.

Press <kbd>F</kbd> or use the Fullscreen button to fill the screen. While the timer is fullscreen it asks the browser to keep the display awake, so a laptop won't dim or sleep during a presentation.

## Share a timer at its own link

Shared timers live at `presenttimer.surge.sh/<link-name>` and show only the countdown, with no settings.

1. Run `npm run dev` and set up the timer in the settings panel.
2. Under **Share link**, type a link name such as `team-demo` and click **Save link**. This writes the timer into `timers.json`.
3. Deploy with `npm run deploy`.

The Share link section only appears while you run the dev server, because the deployed site has nowhere to write to. You can also edit `timers.json` by hand:

```json
{
  "team-demo": {
    "target": "2026-10-02T22:00:00.000Z",
    "caption": "until the demo starts",
    "finishedText": "",
    "font": "unbounded"
  }
}
```

`target` is an ISO timestamp. Leave `caption` or `finishedText` empty to get the automatic wording, like "until noon tomorrow" and "It’s noon". `font` is one of `bricolage`, `bigShoulders`, `unbounded` or `jetbrains`.

## Deploy

The site deploys to [Surge](https://surge.sh). The first time, log in with `npx surge login`. After that, run:

```sh
npm run deploy
```

This builds the site, copies `index.html` to `200.html` so Surge serves the app for every link name, and publishes `dist` to `presenttimer.surge.sh`.
