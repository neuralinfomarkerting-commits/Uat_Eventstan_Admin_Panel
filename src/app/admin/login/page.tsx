'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, LogIn, Loader2, Users, CreditCard,
  Shield, ArrowRight, CheckCircle, LayoutDashboard, TrendingUp, Award,
} from 'lucide-react';
import { saveSession } from '@/lib/auth';
import { adminApi } from '@/api/adminApi';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await adminApi.login({
        email: email.trim(),
        password,
      });

      {
        const token = data.accessToken;
        const userData = data.user;
        if (!['ADMIN', 'SUPER_ADMIN', 'BLOG'].includes(userData?.role)) {
          throw new Error('This account does not have admin access.');
        }
        if (token) {
          saveSession({
            token: token,
            user: {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              permissions: userData.permissions ?? [],
            },
          });
          
          toast.success(data.message || data.msg || 'Welcome back!');
          router.push(userData?.role === 'BLOG' ? '/admin/blog' : '/admin/dashboard');
        } else {
          throw new Error(`No token received from server. Response structure: ${Object.keys(data).join(', ')}`);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-black">
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white relative overflow-hidden border-r border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-20 -left-20 w-80 h-80 rounded-full blur-3xl" style={{ background: '#f87a2520' }} />
        <div className="absolute bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl" style={{ background: '#f87a2510' }} />

        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 w-full h-full">
          <div className="flex items-center">
            <span className="text-2xl xl:text-3xl font-bold tracking-tight text-white">
              Event<span style={{ color: '#f87a25' }}>Stan</span>
            </span>
            <span className="ml-3 text-xs bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full text-white/80">Admin</span>
          </div>

          <div className="space-y-6 xl:space-y-8">
            <div className="space-y-3 xl:space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <LayoutDashboard className="w-3.5 h-3.5" style={{ color: '#f87a25' }} />
                <span className="text-xs font-medium text-white/80">Admin Portal</span>
                <ArrowRight className="w-3 h-3 text-white/60" />
              </div>
              <h1 className="text-2xl xl:text-4xl font-bold leading-tight tracking-tight text-white">
                Admin Dashboard
                <span className="block mt-1 xl:mt-2" style={{ color: '#f87a25' }}>Control Center</span>
              </h1>
              <p className="text-sm xl:text-base text-white/60 leading-relaxed">
                Manage vendors, users, bookings, and monitor platform analytics from a single powerful dashboard.
              </p>
            </div>

            <div className="flex gap-4 xl:gap-6 pt-2">
              {[['500+', 'Active Vendors'], ['10K+', 'Total Users'], ['2.5K+', 'Monthly Bookings']].map(([val, label]) => (
                <div key={label}>
                  <div className="text-xl xl:text-2xl font-bold text-white">{val}</div>
                  <div className="text-xs text-white/50">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 xl:gap-3 pt-2">
              {[
                { icon: TrendingUp, text: 'Analytics & Reports' },
                { icon: Users, text: 'User Management' },
                { icon: CreditCard, text: 'Payment Tracking' },
                { icon: Shield, text: 'Role Permissions' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg p-2 xl:p-2.5 border border-white/10">
                  <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4" style={{ color: '#f87a25' }} />
                  <span className="text-xs font-medium text-white/80">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Award className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-white/50">Super Admin Access • Full System Control</span>
            </div>
          </div>

          <div className="text-xs text-white/60">© {new Date().getFullYear()} EventStan. All rights reserved.</div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-white min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8 lg:hidden">
            <span className="text-3xl font-bold text-black">Event<span style={{ color: '#f87a25' }}>Stan</span></span>
            <span className="block text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium mt-2 w-fit mx-auto">Admin Portal</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LayoutDashboard className="w-7 h-7" style={{ color: '#f87a25' }} />
              </div>
              <h2 className="text-2xl font-semibold text-black">Welcome Back</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your admin credentials to continue</p>
            </div>

            {error && (
              <div className="mb-5 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@eventstan.ae"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50/50"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white text-sm transition-all disabled:opacity-60 hover:shadow-lg"
                style={{ background: '#f87a25' }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" />Signing In...</> : <><LogIn size={16} />Sign In</>}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="bg-gray-50 rounded-xl p-4 text-center text-xs text-gray-500">
                Authorized EventStan administrators only.
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
                {[['Secure Login'], ['256-bit SSL'], ['Role Based Access']].map(([t]) => (
                  <div key={t} className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
