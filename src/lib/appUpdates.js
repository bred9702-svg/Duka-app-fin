import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

export const APP_VERSION = '0.4.0'
export const ANDROID_VERSION_CODE = 4

const VERSION_MANIFEST_URL = 'https://duka-app-fin.vercel.app/app-version.json'

function compareVersions(left, right) {
  const leftParts = String(left).split('.').map((part) => Number.parseInt(part, 10) || 0)
  const rightParts = String(right).split('.').map((part) => Number.parseInt(part, 10) || 0)
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0)
    if (difference !== 0) return difference
  }

  return 0
}

async function loadVersionManifest() {
  const response = await fetch(`${VERSION_MANIFEST_URL}?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('The update service is temporarily unavailable.')
  }

  const manifest = await response.json()
  if (!manifest?.version || !manifest?.androidDownloadUrl) {
    throw new Error('The update information is incomplete.')
  }

  return manifest
}

function isAndroidBrowser() {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}

export async function checkAndStartAppUpdate() {
  const manifest = await loadVersionManifest()
  const nativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

  if (nativeAndroid) {
    const latestCode = Number(manifest.androidVersionCode || 0)
    if (latestCode <= ANDROID_VERSION_CODE) {
      return { status: 'current', version: APP_VERSION }
    }

    await Browser.open({ url: manifest.androidDownloadUrl })
    return { status: 'download-opened', version: manifest.version }
  }

  // From an Android browser, always expose the latest signed APK. This lets a
  // user update the installed app without waiting for the APK to be resent.
  if (isAndroidBrowser()) {
    window.location.assign(manifest.androidDownloadUrl)
    return { status: 'download-opened', version: manifest.version }
  }

  if (compareVersions(manifest.version, APP_VERSION) > 0) {
    window.location.reload()
    return { status: 'reloading', version: manifest.version }
  }

  return { status: 'current', version: APP_VERSION }
}
