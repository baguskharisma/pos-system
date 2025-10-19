import { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { User, Mail, Shield, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile | POS System",
  description: "User profile page",
};

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Profile</h2>
        <p className="text-slate-500 mt-2">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {user.name || "User"}
              </h3>
              <p className="text-sm text-slate-500">{user.role}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">Email:</span>
              <span className="font-medium text-slate-900">{user.email}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">Role:</span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {user.role}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">Member since:</span>
              <span className="font-medium text-slate-900">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Account Settings
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
              <p className="text-sm font-medium text-slate-900">Change Password</p>
              <p className="text-xs text-slate-500 mt-1">
                Update your password to keep your account secure
              </p>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
              <p className="text-sm font-medium text-slate-900">
                Notification Preferences
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Manage how you receive notifications
              </p>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors">
              <p className="text-sm font-medium text-slate-900">Privacy Settings</p>
              <p className="text-xs text-slate-500 mt-1">
                Control who can see your information
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
