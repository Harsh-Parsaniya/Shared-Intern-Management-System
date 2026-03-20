export type Role = 'admin' | 'department' | 'intern';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department_id?: string | null;
}

export interface Department {
  id: string;
  name: string;
}

export interface Intern {
  id: string;
  user_id: string;
  college_name: string;
  department_id: string;
  start_date: string;
  end_date: string;
  user: User;
  department: Department;
}

export interface Feedback {
  id: string;
  intern_id: string;
  message: string;
  rating: number;
  created_at: string;
  intern: Intern;
}

export interface AuthSession {
  user: User;
  token: string;
}
