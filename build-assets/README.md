Place desktop packaging assets here for the Windows NSIS installer.

Current electron-builder config expects:
- `build-assets/icon.ico`
- `build-assets/installerSidebar.bmp`
- `build-assets/uninstallerSidebar.bmp`
- `build-assets/header.bmp`

Recommended asset usage:
- `icon.ico` - app executable, installer icon, uninstaller icon, header icon
- `installerSidebar.bmp` - left-side artwork on the installer window
- `uninstallerSidebar.bmp` - left-side artwork on the uninstall window
- `header.bmp` - top header/banner image for the installer flow

Suggested visual direction:
- dark navy base with cyan / blue / violet brand accents
- clean OrderSync.lk wordmark or icon lockup
- subtle glow, not noisy gradients
- premium and trustworthy, closer to SaaS than gaming UI

Before shipping production builds, replace placeholder assets with real branded artwork that matches the product shell.
