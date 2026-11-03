
import dashboardDemo from './dashboard.demo'
import DashboardApi from './dashboard.api'

class DashboardService {
  getProvider(mode: string, apiBase: string) {
    if (mode === 'demo') {
      return dashboardDemo
    }

    if (mode === 'live') {
      return new DashboardApi(apiBase)
    }

    throw new Error(`Unsupported application mode: ${mode}`)
  }
}

export default new DashboardService()
