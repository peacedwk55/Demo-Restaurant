'use client'
import { useEffect, useState } from 'react'
import { Users, Plus, Shield } from 'lucide-react'
import { UserRole } from '@tableflow/types'
import { cn } from '@/lib/utils'

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  OWNER:   { label: 'Owner',   color: 'bg-purple-100 text-purple-700' },
  ADMIN:   { label: 'Admin',   color: 'bg-blue-100 text-blue-700' },
  CASHIER: { label: 'Cashier', color: 'bg-green-100 text-green-700' },
  KITCHEN: { label: 'Kitchen', color: 'bg-orange-100 text-orange-700' },
}

const DEMO_STAFF = [
  { id: '1', name: 'Restaurant Owner', email: 'owner@demo.com', role: 'OWNER' as UserRole, isActive: true },
  { id: '2', name: 'Head Chef',        email: 'kitchen@demo.com', role: 'KITCHEN' as UserRole, isActive: true },
  { id: '3', name: 'Cashier Staff',    email: 'cashier@demo.com', role: 'CASHIER' as UserRole, isActive: true },
]

export default function StaffPage() {
  const [staff] = useState(DEMO_STAFF)

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            Staff
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{staff.length} staff members</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.map((member) => {
              const roleCfg = ROLE_CONFIG[member.role]
              return (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {member.name[0]}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full', roleCfg.color)}>
                      <Shield className="w-3 h-3" />
                      {roleCfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
