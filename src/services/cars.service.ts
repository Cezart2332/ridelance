import { api } from '../lib/axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const getCarImageUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

export interface CarImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface CarStats {
  views: number;
  clicks: number;
  forms: number;
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  transmission: string;
  location: string;
  pricePerWeek: number;
  oldPrice?: number;
  discountActive: boolean;
  garantie?: number;
  offerType: string;
  status: string;
  uberCategories: string[];
  boltCategories: string[];
  badges: string[];
  description: string;
  active: boolean;
  listingSource: string;
  approvalStatus: string;
  postedByAdmin: boolean;
  images: CarImage[];
  createdAtUtc: string;
  stats: CarStats;
}

export interface CarLead {
  id: string;
  carId: string;
  carName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  city: string;
  interestType: string;
  status: string;
  adminNote?: string;
  createdAtUtc: string;
}

export interface CreateCarRequest {
  brand: string;
  model: string;
  year: number;
  engine: string;
  transmission: string;
  location: string;
  pricePerWeek: number;
  oldPrice?: number;
  discountActive: boolean;
  garantie?: number;
  offerType: string;
  status: string;
  uberCategories: string[];
  boltCategories: string[];
  badges: string[];
  description: string;
  active: boolean;
  listingSource: string;
}

const carsService = {
  // ── Public ──────────────────────────────────────────────────────
  async getAll(): Promise<Car[]> {
    const res = await api.get<Car[]>('/cars');
    return res.data;
  },

  async getById(id: string): Promise<Car> {
    const res = await api.get<Car>(`/cars/${id}`);
    return res.data;
  },

  // ── Admin ────────────────────────────────────────────────────────
  async getAllAdmin(): Promise<Car[]> {
    const res = await api.get<Car[]>('/cars/admin');
    return res.data;
  },

  async getMyCars(): Promise<Car[]> {
    const res = await api.get<Car[]>('/cars/mine');
    return res.data;
  },

  async approveListing(carId: string, approve: boolean): Promise<void> {
    await api.patch(`/cars/${carId}/approval`, { approve });
  },

  async create(data: CreateCarRequest): Promise<string> {
    const res = await api.post<{ id: string }>('/cars', data);
    return res.data.id;
  },

  async update(id: string, data: CreateCarRequest): Promise<void> {
    await api.put(`/cars/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/cars/${id}`);
  },

  async toggleActive(id: string): Promise<boolean> {
    const res = await api.patch<{ active: boolean }>(`/cars/${id}/toggle-active`);
    return res.data.active;
  },

  // ── Images ───────────────────────────────────────────────────────
  async uploadImage(carId: string, file: File): Promise<{ imageId: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ imageId: string; url: string }>(
      `/cars/${carId}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  async deleteImage(carId: string, imageId: string): Promise<void> {
    await api.delete(`/cars/${carId}/images/${imageId}`);
  },

  // ── Leads ────────────────────────────────────────────────────────
  async submitLead(carId: string, data: {
    userName: string;
    userEmail: string;
    userPhone: string;
    city: string;
    interestType: string;
  }): Promise<string> {
    const res = await api.post<{ leadId: string }>(`/cars/${carId}/leads`, data);
    return res.data.leadId;
  },

  async getLeads(carId?: string, status?: string): Promise<CarLead[]> {
    const params: any = {};
    if (carId) params.carId = carId;
    if (status) params.status = status;
    const res = await api.get<CarLead[]>('/cars/leads', { params });
    return res.data;
  },

  async updateLeadStatus(leadId: string, status: string, adminNote?: string): Promise<void> {
    await api.patch(`/cars/leads/${leadId}/status`, { status, adminNote });
  },

  /** Record a listing impression (public, fire-and-forget). */
  trackView(carId: string): Promise<void> {
    return api.post(`/cars/${carId}/analytics/view`).then(() => undefined);
  },

  /** Record rent / CTA click (public, fire-and-forget). */
  trackClick(carId: string): Promise<void> {
    return api.post(`/cars/${carId}/analytics/click`).then(() => undefined);
  },
};

export { carsService };
