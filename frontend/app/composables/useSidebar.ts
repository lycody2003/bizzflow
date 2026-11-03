
export default function useSidebar() {
  const isCollapsed = useCookie<boolean>('bizzflow-sidebar-collapsed', {
    default: () => false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  const isMobileOpen = useState<boolean>(
    'app-sidebar-mobile-open',
    () => false,
  )

  const toggleSidebar = (): void => {
    isCollapsed.value = !isCollapsed.value
  }

  const toggleMobileSidebar = (): void => {
    isMobileOpen.value = !isMobileOpen.value
  }

  const closeMobileSidebar = (): void => {
    isMobileOpen.value = false
  }

  return {
    isCollapsed,
    isMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
  }
}
