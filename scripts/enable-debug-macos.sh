#!/bin/sh
# MASAR PRO development only: allow unsigned CEP extensions (PlayerDebugMode).
# AE 2023 ships CEP 11; AE 2024/2025 may ship CEP 12. Both are set; harmless.
# Run, then fully restart After Effects. Do NOT ship this step to end users of a signed distribution.
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
echo "PlayerDebugMode=1 written for CSXS.11 and CSXS.12. Restart After Effects."
