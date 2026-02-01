
export interface FormData {
  nombre: string;
  dni: string;
  edad: string;
  altura: string;
  medidas: string;
  instagram: string;
  whatsappPersonal: string;
  whatsappTutor: string;
  curso: string;
}

export interface CourseOption {
  value: string;
  label: string;
}

export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
  courses?: string[]; // Array de nombres de hojas
}
