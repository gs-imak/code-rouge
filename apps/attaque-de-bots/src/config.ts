// Runtime config. Compiled into the bundle at build time — chantier 06+
// will add a GM-driven "set NUC IP" admin flow and a config screen on
// first boot. For chantier 05's demo on a single dev machine, the
// emulator default is the host's localhost.
//
// Override paths:
//   - Android emulator → host: `ws://10.0.2.2:8080/ws`
//   - Real device on LAN → use the NUC's static IP
//   - Hard local dev (RN running on the same Windows box as the server,
//     unusual): `ws://127.0.0.1:8080/ws`

export const SERVER_WS_URL =
  // process.env is available in RN at metro-bundle time; missing → fall
  // back to the emulator default. RN's env story without
  // react-native-config is awkward; this string is fine as a default.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((globalThis as any).process?.env?.['CODE_ROUGE_SERVER_URL'] as string | undefined) ??
  'ws://10.0.2.2:8080/ws'
