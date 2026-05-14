fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios pods

```sh
[bundle exec] fastlane ios pods
```

Install CocoaPods dependencies

### ios build_sim

```sh
[bundle exec] fastlane ios build_sim
```

Compile for iOS Simulator (CI smoke build, no archive)

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Build release IPA and upload to TestFlight (requires App Store Connect API key + signing)

----


## Android

### android debug

```sh
[bundle exec] fastlane android debug
```

Assemble debug APK (no Play upload)

### android internal

```sh
[bundle exec] fastlane android internal
```

Build AAB and upload to Play internal track (requires supply json + signing)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
