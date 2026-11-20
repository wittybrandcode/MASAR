# Packaging notes — TIME RULER

## Current distribution mode (v1.0.0)
Unsigned developer panel. Requires `PlayerDebugMode=1` under the CSXS runtime key matching
the host's bundled CEP version (AE 2023 → CEP 11 → `CSXS.11`). See `enable-debug-windows.reg`
and `enable-debug-macos.sh`. Restart After Effects after any change or debug-flag change.

## Install locations
- Windows (current user): `%APPDATA%\Adobe\CEP\extensions\TIME_RULER\`
- macOS (current user): `~/Library/Application Support/Adobe/CEP/extensions/TIME_RULER/`
- `CSXS/manifest.xml` must sit directly inside the extension folder.

## Signing / ZXP (future)
1. Obtain a certificate: `ZXPSignCmd -createCert` (Adobe CEP Tools).
2. Package: `ZXPSignCmd -pack <src> TIME_RULER.zxp -cert <p12> -pass <pass> -stampedSrc <stamped>`
3. Distribute the signed `.zxp`; users install via ZXP installer tools (ZXPInstaller / anastasiy).
4. Signed distributions must not require PlayerDebugMode.

## CEP runtime mapping (verify per machine, do not assume)
| After Effects | CEP runtime | CSXS registry key (Windows) |
|---|---|---|
| 23.x (2023) | CEP 11 | HKCU\Software\Adobe\CSXS.11 |
| 24.x (2024) | CEP 11/12 (verify) | CSXS.11 / CSXS.12 |
| 25.x+ | verify on install | verify |

Check the actual runtime bundled with the installed AE before changing RequiredRuntime
in `CSXS/manifest.xml` (spec rule: do not raise RequiredRuntime above 11.0 blindly).

## Uninstall
Delete the extension folder from the install location above, or run the installer script
with `-Uninstall` (Windows) / `--uninstall` (macOS). No system-wide changes besides the
optional PlayerDebugMode flags, which can be removed by deleting the `PlayerDebugMode`
value or setting it to `0`.
