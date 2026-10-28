# QR Attendance (online)
Attendees scan a QR code -> sign in / sign out. Only YOU (admin Google account) can view records, times, durations, export CSV.

## Setup (about 10 min, free)
1. https://console.firebase.google.com -> Add project.
2. Project settings -> Your apps -> Web (</>) -> copy the config into `firebase-config.js`; set ADMIN_EMAIL to your Google email.
3. Build -> Firestore Database -> Create database. Then Rules tab -> paste `firestore.rules` (change the email in it to yours) -> Publish.
4. Build -> Authentication -> Get started -> enable Google. Then Settings -> Authorized domains -> add `YOURNAME.github.io`.
5. Put these files on GitHub (new repo -> Add file -> Upload files). Repo Settings -> Pages -> deploy from `main` branch, root.
6. Open `https://YOURNAME.github.io/REPO/admin.html`, sign in with Google, print the QR code shown there.

Sign-in/out times are stamped by the server, so phone clocks can't be faked. A person signs out from the same phone they signed in on.
