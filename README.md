# privacy-manifest-tools

## Usage

Usage:
```
npx pmtools add <path/to/privacy-manifest> <path/to/app>
```

The first arg is path to your (new) `PrivacyInfo.xcprivacy` file.
The second arg is path to your App directory which has `.xcodeproj` w/o `.xcworkspace` directories.

If your app doesn't have `PrivacyInfo.xcprivacy` yet, this command copy and set the (new) `PrivacyInfo.xcprivacy`.
If your app already has `PrivacyInfo.xcprivacy`, this command override that.

