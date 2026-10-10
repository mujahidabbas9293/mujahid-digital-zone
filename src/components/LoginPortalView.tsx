import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Mail, Phone, Key, ArrowRight, CheckCircle2, AlertCircle, Loader2, Sparkles, Building, Globe } from 'lucide-react';

interface LoginPortalViewProps {
  onLoginSuccess: (role: 'OWNER' | 'RESELLER' | 'CUSTOMER', tokenOrData: any) => void;
}

export const LoginPortalView: React.FC<LoginPortalViewProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'owner' | 'reseller' | 'customer' | 'register'>('customer');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/owner-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('mdz_owner_session', data.token || 'owner_active');
        window.history.pushState(null, '', '/admin');
        onLoginSuccess('OWNER', data);
      } else {
        setErrorMsg(data.error || 'Invalid Owner credentials.');
      }
    } catch (err) {
      setErrorMsg('Network error during owner login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResellerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/reseller-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('mdz_reseller_session', data.token || 'reseller_active');
        window.history.pushState(null, '', '/reseller');
        onLoginSuccess('RESELLER', data);
      } else {
        setErrorMsg(data.error || 'Invalid Reseller credentials.');
      }
    } catch (err) {
      setErrorMsg('Network error during reseller login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, license_key: licenseKeyInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.status === 'PENDING') {
          setErrorMsg('Your account is waiting for Owner approval.');
          return;
        }
        if (data.status === 'SUSPENDED' || data.status === 'REJECTED') {
          setErrorMsg(`Your account status is ${data.status}. Please contact support.`);
          return;
        }
        localStorage.setItem('customer_active_license_key', data.license_key || licenseKeyInput);
        window.history.pushState(null, '', `/customer/${data.license_key || licenseKeyInput}`);
        onLoginSuccess('CUSTOMER', data);
      } else {
        setErrorMsg(data.error || 'Customer login failed or pending approval.');
      }
    } catch (err) {
      setErrorMsg('Network error during customer login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/auth/customer-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, email, phone, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Account registered successfully! Status is PENDING. Your account is waiting for Owner approval.');
        setUsername('');
        setEmail('');
        setPhone('');
        setPassword('');
      } else {
        setErrorMsg(data.error || 'Registration failed.');
      }
    } catch (err) {
      setErrorMsg('Network error during customer registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto text-2xl font-bold shadow-lg shadow-emerald-500/10">
            🛡️
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Mujahid Digital Zone</h1>
            <p className="text-xs text-emerald-400 font-mono mt-0.5">Secure Role-Based Authentication Portal</p>
          </div>
        </div>

        {/* Role Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setActiveTab('customer'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 px-1 rounded-xl font-bold transition-all ${activeTab === 'customer' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('reseller'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 px-1 rounded-xl font-bold transition-all ${activeTab === 'reseller' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Reseller
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('owner'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 px-1 rounded-xl font-bold transition-all ${activeTab === 'owner' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Owner
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 px-1 rounded-xl font-bold transition-all ${activeTab === 'register' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Register
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* CUSTOMER LOGIN */}
        {activeTab === 'customer' && (
          <form onSubmit={handleCustomerLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Customer Email / License Key</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="customer@example.com or MDZ-LIC-..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>CUSTOMER LOGIN → /customer</span>}
            </button>
          </form>
        )}

        {/* RESELLER LOGIN */}
        {activeTab === 'reseller' && (
          <form onSubmit={handleResellerLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Reseller Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="reseller@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>RESELLER LOGIN → /reseller</span>}
            </button>
          </form>
        )}

        {/* OWNER LOGIN */}
        {activeTab === 'owner' && (
          <form onSubmit={handleOwnerLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Owner / Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="admin@mujahiddigitalzone.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Master Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>OWNER LOGIN → /admin</span>}
            </button>
          </form>
        )}

        {/* CUSTOMER REGISTRATION / APPROVAL REQUEST */}
        {activeTab === 'register' && (
          <form onSubmit={handleCustomerRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Full Name</label>
              <input
                type="text"
                placeholder="Muhammad Mujahid"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Email Address</label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Phone Number</label>
              <input
                type="text"
                placeholder="+923001234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-[11px] text-purple-300 leading-relaxed">
              <strong>Approval Policy:</strong> New accounts are created with status = PENDING. Access to the Customer Dashboard is granted after Owner approval.
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>REGISTER ACCOUNT (PENDING APPROVAL)</span>}
            </button>
          </form>
        )}

        <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
          Mujahid Digital Zone • 24/7 Secure Multi-Role Infrastructure
        </div>
      </div>
    </div>
  );
};
