import createInventoryApiRepository from '../repositories/api/inventory.repository'
import { InventoryService } from '../services/inventory/inventory.service'

export default defineNuxtPlugin(() => {
  const repository = createInventoryApiRepository()
  const inventoryService = new InventoryService(repository)

  return {
    provide: {
      inventoryService,
    },
  }
})
