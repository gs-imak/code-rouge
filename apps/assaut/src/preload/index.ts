import { contextBridge, ipcRenderer } from 'electron'
import { GameState } from '@code-rouge/shared-types'
import {
  IpcChannel,
  KioskStatusResponse,
  AppVersionResponse,
  SetGameStateResponse,
  type AssautBridge,
} from '../shared/ipc.js'

// `contextIsolation: true` + this preload script is the only legitimate
// path for the renderer to call into main. The renderer never touches
// `ipcRenderer` directly. Each method validates the response with Zod so
// a buggy main can't poison renderer state with the wrong shape.

const bridge: AssautBridge = {
  async getKioskStatus() {
    const raw = await ipcRenderer.invoke(IpcChannel.KioskStatus)
    return KioskStatusResponse.parse(raw)
  },
  async getAppVersion() {
    const raw = await ipcRenderer.invoke(IpcChannel.AppVersion)
    return AppVersionResponse.parse(raw)
  },
  async getGameState() {
    const raw = await ipcRenderer.invoke(IpcChannel.GetGameState)
    return GameState.parse(raw)
  },
  async setGameState(next) {
    const raw = await ipcRenderer.invoke(IpcChannel.SetGameState, next)
    return SetGameStateResponse.parse(raw)
  },
}

contextBridge.exposeInMainWorld('assaut', bridge)
