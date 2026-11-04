import createUnitApiRepository from '../repositories/api/unit.repository'
import { UnitService } from '../services/unit/unit.service'

export default defineNuxtPlugin(() => {
  const repository = createUnitApiRepository()
  const unitService = new UnitService(repository)

  return {
    provide: {
      unitService,
    },
  }
})
