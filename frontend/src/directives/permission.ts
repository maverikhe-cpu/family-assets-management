import { type Directive, type DirectiveBinding } from 'vue'
import { useAuthStore } from '@/stores/auth'

export type PermissionType = 'edit' | 'admin' | 'owner' | string

export interface PermissionBinding {
  type?: PermissionType
  role?: string
  fallback?: 'hide' | 'disable' | 'readonly'
}

/**
 * Permission directive for controlling element visibility/state based on user role
 *
 * Usage:
 * v-permission="'edit'"              - Hide if user cannot edit (viewer)
 * v-permission="'admin'"             - Hide if user is not admin/owner
 * v-permission="'owner'"             - Hide if user is not owner
 * v-permission="{ type: 'edit', fallback: 'disable' }"  - Disable instead of hide
 */
export const permissionDirective: Directive<HTMLElement, PermissionBinding | string> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionBinding | string>) {
    checkPermission(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding<PermissionBinding | string>) {
    checkPermission(el, binding)
  },
}

function checkPermission(el: HTMLElement, binding: DirectiveBinding<PermissionBinding | string>) {
  const authStore = useAuthStore()

  // Parse binding value
  let options: PermissionBinding
  if (typeof binding.value === 'string') {
    options = { type: binding.value }
  } else {
    options = binding.value
  }

  const { type = 'edit', fallback = 'hide' } = options

  // Check permission
  let hasPermission = true

  switch (type) {
    case 'edit':
      hasPermission = authStore.canEdit()
      break
    case 'admin':
      hasPermission = authStore.isAdmin()
      break
    case 'owner':
      hasPermission = authStore.isOwner()
      break
    default:
      // Check against specific role string
      if (options.role) {
        hasPermission = authStore.familyRole === options.role
      }
  }

  // Apply fallback behavior
  if (!hasPermission) {
    applyFallback(el, fallback)
  } else {
    // Restore element if permission is granted
    restoreElement(el)
  }
}

function applyFallback(el: HTMLElement, fallback: string) {
  switch (fallback) {
    case 'hide':
      el.style.display = 'none'
      break
    case 'disable':
      if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        el.disabled = true
        el.setAttribute('disabled', 'disabled')
      }
      el.classList.add('is-disabled')
      el.style.pointerEvents = 'none'
      el.style.opacity = '0.5'
      break
    case 'readonly':
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.readOnly = true
        el.setAttribute('readonly', 'readonly')
      }
      el.classList.add('is-readonly')
      el.style.pointerEvents = 'none'
      break
  }
}

function restoreElement(el: HTMLElement) {
  el.style.display = ''
  el.style.pointerEvents = ''
  el.style.opacity = ''

  if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    el.disabled = false
    el.removeAttribute('disabled')
  }
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.readOnly = false
    el.removeAttribute('readonly')
  }

  el.classList.remove('is-disabled', 'is-readonly')
}

/**
 * Register permission directive globally
 */
export function registerPermissionDirective(app: any) {
  app.directive('permission', permissionDirective)
}
