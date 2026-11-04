import createCategoryApiRepository from '../repositories/api/category.repository'
import { CategoryService } from '../services/category/category.service'

export default defineNuxtPlugin(() => {
  const repository = createCategoryApiRepository()
  const categoryService = new CategoryService(repository)

  return {
    provide: {
      categoryService,
    },
  }
})
