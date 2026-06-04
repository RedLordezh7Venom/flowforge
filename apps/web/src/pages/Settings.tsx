
import { useAuthStore } from '../stores/authStore';
import { User, Bell, Shield, Palette } from 'lucide-react';

export default function Settings() {
  const { user } = useAuthStore();
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
      <div className="space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4"><User className="w-5 h-5 text-forge-400" /><h2 className="text-lg font-medium text-white">Profile</h2></div>
          <div className="space-y-3">
            <div><label className="text-sm text-gray-400">Name</label><p className="text-white">{user?.name}</p></div>
            <div><label className="text-sm text-gray-400">Email</label><p className="text-white">{user?.email}</p></div>
            <div><label className="text-sm text-gray-400">Role</label><p className="text-white capitalize">{user?.role}</p></div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4"><Bell className="w-5 h-5 text-forge-400" /><h2 className="text-lg font-medium text-white">Notifications</h2></div>
          <p className="text-gray-400 text-sm">Notification settings coming soon</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4"><Shield className="w-5 h-5 text-forge-400" /><h2 className="text-lg font-medium text-white">Security</h2></div>
          <p className="text-gray-400 text-sm">Change password and manage API keys</p>
        </div>
      </div>
    </div>
  );
}
