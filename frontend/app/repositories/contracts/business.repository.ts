
export interface Business {
  id: string
  name: string
  logoUrl: string | null
  ownerId: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface UpdateBusinessInput {
  name: string
}

export interface BusinessLogoResponse {
  logoUrl: string | null
}

export interface BusinessRepository {
  getMyBusiness(): Promise<Business>
  updateMyBusiness(input: UpdateBusinessInput): Promise<Business>
  uploadLogo(file: File): Promise<BusinessLogoResponse>
  removeLogo(): Promise<BusinessLogoResponse>
}
