# ReactNativeWebRTC + Socket.io Server

## Configuration (Works on iOS & Android)

## Usage

- Clone the repository, run `npm install` OR `yarn`.
- For iOS, run the project on Xcode.
- For Android, run `react-native run-android` in the directory.
- 同時需要啟動 server 內的伺服器 `nodemon index.js`

**react-native-webrtc 基本設定請參照**:

- Android: https://github.com/react-native-webrtc/react-native-webrtc/blob/master/Documentation/AndroidInstallation.md

- iOS: https://github.com/react-native-webrtc/react-native-webrtc/blob/master/Documentation/iOSInstallation.md

## Ngrok

- download: [ngrok](https://ngrok.com/)
- install
- login

- After you create the server and deploy it with ngrok copy the link, something like that "https://a4cd7858.ngrok.io" and paste it to `App.js`

```javascript
const url = 'paste_it_here';
```

- It must look like than

```javascript
const url = 'https://a4cd7858.ngrok.io/';
```
