import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Search, RefreshCw, Key, Mail, Phone, Calendar } from 'lucide-react';

export const CustomerApprovalsView: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'>('ALL');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleUpdateStatus = async (customerId: string, newStatus: string, licenseKey?: string) => {
    setActionLoadingId(customerId);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, licenseKey: licenseKey || 'MDZ-LIC-VIP-8899-7700' })
      });
      const data = await res.json();
      if (data && data.success) {
        await fetchCustomers();
      } else {
        alert(data.error || 'Failed to update customer status.');
      }
    } catch (err) {
      alert('Network error updating customer status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesFilter = filter === 'ALL' || c.status === filter;
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Customer Account Approvals & Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review customer registration requests, approve or suspend accounts, and assign secure license keys.
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 w-fit cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab} {tab === 'PENDING' && customers.filter(c => c.status === 'PENDING').length > 0 && `(${customers.filter(c => c.status === 'PENDING').length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Key</th>
                <th className="py-3.5 px-4 text-right">Owner Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No customer accounts found matching filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {cust.name ? cust.name.slice(0, 2).toUpperCase() : 'CU'}
                        </div>
                        <div>
                          <div className="font-bold text-white">{cust.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">ID: {cust.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{cust.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{cust.phone || 'No phone'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(cust.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                        cust.status === 'APPROVED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : cust.status === 'PENDING'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : cust.status === 'SUSPENDED'
                          ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          cust.status === 'APPROVED' ? 'bg-emerald-400' : cust.status === 'PENDING' ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'
                        }`} />
                        <span>{cust.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-indigo-300">
                      {cust.licenseKey || <span className="text-slate-500 italic">Not Assigned</span>}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {cust.status !== 'APPROVED' && (
                          <button
                            disabled={actionLoadingId === cust.id}
                            onClick={() => handleUpdateStatus(cust.id, 'APPROVED', cust.licenseKey || 'MDZ-LIC-VIP-8899-7700')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        )}

                        {cust.status !== 'SUSPENDED' && (
                          <button
                            disabled={actionLoadingId === cust.id}
                            onClick={() => handleUpdateStatus(cust.id, 'SUSPENDED', cust.licenseKey)}
                            className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-sm"
                          >
                            Suspend
                          </button>
                        )}

                        {cust.status !== 'REJECTED' && (
                          <button
                            disabled={actionLoadingId === cust.id}
                            onClick={() => handleUpdateStatus(cust.id, 'REJECTED', cust.licenseKey)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
