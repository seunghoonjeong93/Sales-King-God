export interface Customer {
  id: string;
  name: string;
  industry?: string;
  location?: string;
  contactPerson?: string;
  address?: string;
}

export interface Report {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  summary: string;
  fullTranscript?: string;
  voiceMemoUrl?: string;
  receipts?: Receipt[];
  authorId: string;
  authorName: string;
}

export interface Receipt {
  amount: number;
  merchant: string;
  date: string;
}

export interface ActionItem {
  id: string;
  reportId?: string;
  customerId: string;
  customerName: string;
  task: string;
  assignee: string;
  dueDate: string;
  status: 'todo' | 'in_progress' | 'done';
  category: '견적' | '샘플' | '도면수정' | '사양협의' | '기타';
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
}
