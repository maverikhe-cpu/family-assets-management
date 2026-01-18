import { registerPermissionDirective } from './permission'

/**
 * Register all directives globally
 */
export function registerDirectives(app: any) {
  registerPermissionDirective(app)
}

export * from './permission'
