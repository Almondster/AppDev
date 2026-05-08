import CreatorDashboardPage from './CreatorDashboardPage';
import ClientDashboardPage from './ClientDashboardPage';
import AdminDashboardPage from './AdminDashboardPage';

const DashboardPage = ({ userRole, firebaseUid }) => {
  // Render based on user role from backend
  if (userRole === 'admin') return <AdminDashboardPage firebaseUid={firebaseUid} />;
  if (userRole === 'client') return <ClientDashboardPage firebaseUid={firebaseUid} />;
  return <CreatorDashboardPage firebaseUid={firebaseUid} />;
};

export default DashboardPage;
