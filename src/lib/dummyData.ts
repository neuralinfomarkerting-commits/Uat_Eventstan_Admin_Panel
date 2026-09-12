import { User, Vendor, Service, Booking } from './types';

export const usersData: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'User', status: 'Active', joined: '2024-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Vendor', status: 'Active', joined: '2024-01-20' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'User', status: 'Inactive', joined: '2024-01-25' },
];

export const vendorsData: Vendor[] = [
  { id: 1, name: 'Wedding Pros', email: 'contact@weddingpros.com', category: 'Wedding', status: 'Approved', rating: 4.5 },
  { id: 2, name: 'Event Planners', email: 'info@eventplanners.com', category: 'Corporate', status: 'Pending', rating: 4.2 },
  { id: 3, name: 'Birthday Specialists', email: 'hello@birthday.com', category: 'Birthday', status: 'Approved', rating: 4.8 },
];

export const servicesData: Service[] = [
  { id: 1, name: 'Wedding Photography', category: 'Photography', price: 50000, status: 'Active' },
  { id: 2, name: 'Catering Services', category: 'Food', price: 30000, status: 'Active' },
  { id: 3, name: 'DJ & Music', category: 'Entertainment', price: 25000, status: 'Inactive' },
];

export const bookingsData: Booking[] = [
  { id: 'BK001', customer: 'John Doe', vendor: 'Wedding Pros', amount: 50000, payment: '50%', status: 'Confirmed', date: '2024-02-15' },
  { id: 'BK002', customer: 'Jane Smith', vendor: 'Event Planners', amount: 30000, payment: '100%', status: 'Completed', date: '2024-02-10' },
  { id: 'BK003', customer: 'Mike Brown', vendor: 'Birthday Specialists', amount: 25000, payment: '50%', status: 'Pending', date: '2024-02-14' },
];

export const feedbackData = [
  { id: 1, user: 'John Doe', rating: 5, comment: 'Excellent service!', status: 'Pending Approval', date: '2024-02-14' },
  { id: 2, user: 'Jane Smith', rating: 4, comment: 'Good experience overall', status: 'Approved', date: '2024-02-12' },
];

export const notificationsData = [
  { id: 1, title: 'New Vendor Registration', message: 'Event Planners has registered', type: 'info', read: false, date: '2024-02-15' },
  { id: 2, title: 'Booking Confirmed', message: 'Booking #BK001 confirmed', type: 'success', read: true, date: '2024-02-14' },
];

export const affiliateLinksData = [
  { id: 1, name: 'Summer Campaign', link: 'https://eventstan.com/?ref=summer24', clicks: 1250, conversions: 45, earnings: 2250, status: 'Active' },
  { id: 2, name: 'Wedding Special', link: 'https://eventstan.com/?ref=wedding24', clicks: 890, conversions: 32, earnings: 1600, status: 'Active' },
];
