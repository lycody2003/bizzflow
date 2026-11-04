export interface Category {
  id: string
  businessId: string
  name: string
  icon?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryInput {
  name: string
  icon?: string | null
}

export interface UpdateCategoryInput {
  name?: string
  icon?: string | null
  isActive?: boolean
}
