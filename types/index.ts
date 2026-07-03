import type { ServiceId } from '@/lib/constants/services'
import type { SizeCategory } from '@/lib/constants/sizes'
import type { AddonId, CoatCondition } from '@/lib/constants/addons'
import type { PaymentMethod } from '@/lib/constants/finance'

export type { ServiceId, SizeCategory, AddonId, CoatCondition, PaymentMethod }

export type AppointmentStatus = 'booked' | 'arrived' | 'completed' | 'cancelled' | 'no_show'
export type AppointmentSource = 'online' | 'walk_in' | 'manual'

export interface Client {
  id: string
  owner_name: string
  owner_phone: string
  created_at: string
}

export interface Pet {
  id: string
  client_id: string
  name: string
  breed: string
  size_category: SizeCategory
  temperament: string | null
  allergies: string | null
  notes: string | null
  created_at: string
}

export interface Appointment {
  id: string
  client_id: string | null
  pet_id: string | null

  owner_name: string
  owner_phone: string
  pet_name: string
  pet_breed: string
  size_category: SizeCategory

  service: string
  addons: AddonId[]
  coat_condition: CoatCondition | null

  appointment_date: string // YYYY-MM-DD
  start_time: string       // HH:MM
  duration_minutes: number

  status: AppointmentStatus
  source: AppointmentSource

  arrival_time: string | null
  departure_time: string | null
  price_charged: number | null
  payment_method: PaymentMethod | null

  notes: string | null
  created_at: string
  updated_at: string
}

export interface BlockedDate {
  id: string
  blocked_date: string // YYYY-MM-DD
  reason: string | null
  created_at: string
}

export interface ManualIncome {
  id: string
  amount: number
  description: string | null
  income_date: string // YYYY-MM-DD
  payment_method: PaymentMethod | null
  created_at: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  includes: string[]
  active: boolean
  sort_order: number
  created_at?: string
}

export interface Expense {
  id: string
  amount: number
  category: string
  description: string | null
  expense_date: string // YYYY-MM-DD
  payment_method: PaymentMethod | null
  created_at: string
}

export type InventoryCategory = string

export interface InventoryProduct {
  id: string
  category: InventoryCategory
  variant: string | null
  display_name: string
  current_stock: number
  unit: string
  created_at: string
}

export interface InventoryMovement {
  id: string
  product_id: string
  movement_type: 'in' | 'out'
  quantity: number
  note: string | null
  created_by: string | null
  created_at: string
  product?: InventoryProduct
}

export interface BookingInput {
  service: string
  sizeCategory: SizeCategory
  addons: AddonId[]
  coatCondition: CoatCondition | null
  date: string
  time: string
  petName: string
  petBreed: string
  ownerName: string
  ownerPhone: string
}
