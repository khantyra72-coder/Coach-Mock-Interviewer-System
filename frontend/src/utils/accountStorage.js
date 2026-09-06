const USER_KEY = 'aceinterview_user'

function currentAccountScope() {
  if (typeof localStorage === 'undefined') return 'guest'

  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY))
    if (user?.id !== undefined && user?.id !== null) return `user-${user.id}`
    if (user?.email) return `email-${String(user.email).trim().toLowerCase()}`
  } catch {
    // Invalid authentication storage is treated as a signed-out browser.
  }

  return 'guest'
}

export function accountStorageKey(baseKey) {
  return `${baseKey}:${currentAccountScope()}`
}
