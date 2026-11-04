import DashboardApi from './dashboard.api'

class DashboardService {
  getProvider() {
    return new DashboardApi()
  }
}

export default new DashboardService()
