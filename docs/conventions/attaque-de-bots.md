# Conventions — apps/attaque-de-bots

Engineering conventions for the `apps/attaque-de-bots/` React Native Android tablet app.

- **Target device:** Android tablet, 10-inch, landscape-locked. Design for
  touch (min 48dp tap targets), expect heavy fingers, no precision pointing.
- **Kiosk:** Screen Pinning is mandatory and on at all times. Test with
  `adb shell dumpsys activity | grep "Lock Task"` to confirm.
- **No network beyond LAN.** All assets bundled. Network calls only to the
  NUC server's WebSocket and HTTP endpoints, ever.
- **Énigme matrix A/B/C/D:** parcours differs per team per the CDC. The
  matrix is in `apps/attaque-de-bots/assets/config/parcours.json`. Never
  hardcode an order — always read from config.
- **Phishing mail:** the fake mailbox screen contains a piégé item; clicking
  it triggers a logged event. The list of mails (including the piégé one)
  is configured in `mailbox.json`, not coded.
- **Performance budget:** 60 fps on the target tablet. Use `useCallback` /
  `memo` aggressively. List screens use `FlashList`, not `FlatList`.
- **Don't add Expo modules.** This is a bare RN project — Expo modules
  often require their dev-client and conflict with our kiosk setup.
