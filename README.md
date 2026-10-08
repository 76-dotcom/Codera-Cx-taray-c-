# Codera CX

Codera CX is a Windows desktop browser built with Electron and Chromium.

## Run and build

- Install dependencies: `npm install`
- Run from source: `npm start`
- Build the Windows installer and portable executable: `npm run dist`
- Build only the installer: `npm run dist:setup`
- Build only the portable executable: `npm run dist:portable`

Build artifacts are written to `dist/`.

## License

Codera CX is provided under the CodeCraftTR personal-use license in [LICENSE.txt](./LICENSE.txt). Personal non-commercial use is free. Commercial use and redistribution require prior written permission from CodeCraftTR. Third-party components retain their own licenses.

## Streamer and gaming shortcuts

New tabs provide links to OBS Studio, Streamlabs, Twitch, YouTube Live, Kick, Discord, and major game stores and platforms. These open the services' official websites in Codera CX; they do not install or control OBS, Streamlabs, or platform-specific desktop clients.

## GoodbyeDPI

GoodbyeDPI is an optional, separate Windows DPI-circumvention utility; it is not a VPN and does not encrypt traffic or hide your IP address. Download it from the [official releases page](https://github.com/ValdikSS/GoodbyeDPI/releases), extract it, then select its `goodbyedpi.exe` from the Codera CX sidebar. Starting and stopping it requests Windows administrator permission. The browser does not ship or download the GoodbyeDPI executable.

Codera CX starts GoodbyeDPI with its documented `-9` mode. The utility can keep running after the browser closes, so stop it from its panel before exiting when you no longer need it.
