export type RoleName = 'Admin' | 'Gerente TI' | 'Soporte TI';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role_id: number;
  is_active: boolean;
  roles?: {
    name: RoleName;
  };
}

export interface Client {
  id: string;
  name: string;
  trade_name: string | null;
  nit: string | null;
  nrc: string | null;
  economic_activity: string | null;
  address: string | null;
  department_id: number | null;
  district_id: number | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  departments?: { name: string };
  districts?: { name: string };
}

export interface Department {
  id: number;
  name: string;
  is_active: boolean;
}

export interface District {
  id: number;
  department_id: number;
  name: string;
  is_active: boolean;
}

export interface Contact {
  id: string;
  client_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  is_active: boolean;
}

export interface Asset {
  id: string;
  client_id: string;
  name: string;
  type_id: number;
  status_id: number;
  is_active: boolean;
  serial_number: string | null;
  asset_tag: string | null;
  manufacturer: string | null;
  model: string | null;
  physical_location: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  custodian_id: string | null;
  description: string | null;
  asset_types?: { name: string };
  asset_status?: { name: string };
  clients?: { name: string };
  responsible_user?: { full_name: string };
  custodian?: { full_name: string };
}

export interface Custodian {
  id: string;
  client_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  job_title: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category_id: number;
  priority_id: number;
  sla_hours: number;
  service_type: string;
  service_owner: string | null;
  availability_schedule: string | null;
  request_canals: string[];
  technical_dependencies: string | null;
  cost_center: string | null;
  is_active: boolean;
  service_categories?: { name: string };
  service_priorities?: { name: string };
}

export interface LookupTable {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}
