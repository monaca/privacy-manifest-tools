# privacy-manifest-tools

## Usage

To use the tool, run the following command:
```
npx pmtools add <path/to/privacy-manifest> <path/to/app>
```

### Parameters

1. **Privacy Manifest Path:** The first argument is the path to your (new) `PrivacyInfo.xcprivacy` file.
2. **App Directory Path:** The second argument is the path to your app directory that contains `.xcodeproj`, but does not include `.xcworkspace`.

### Command Behavior

- **Creating a New Privacy Manifest:** If your app does not yet have a `PrivacyInfo.xcprivacy` file, this command will copy and set up the new `PrivacyInfo.xcprivacy` file.
- **Overwriting an Existing Privacy Manifest:** If your app already has a `PrivacyInfo.xcprivacy` file, this command will overwrite it with the provided one.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.