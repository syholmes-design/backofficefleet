"use client";

import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import type { LoadV2 } from "@/lib/dispatch-v2-demo-data";

interface DispatchFilterBarProps {
  loads: LoadV2[];
  onFilter: (filteredLoads: LoadV2[]) => void;
}

export function DispatchFilterBar({ loads, onFilter }: DispatchFilterBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");

  // Get unique values for dropdowns
  const customers = useMemo(() => {
    const uniqueCustomers = [...new Set(loads.map(load => load.customer))];
    return uniqueCustomers.sort();
  }, [loads]);

  const drivers = useMemo(() => {
    const uniqueDrivers = [...new Set(loads.map(load => load.driver))];
    return uniqueDrivers.sort();
  }, [loads]);

  // Apply filters
  useEffect(() => {
    let filtered = loads;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(load => 
        load.id.toLowerCase().includes(term) ||
        load.driver.toLowerCase().includes(term) ||
        load.customer.toLowerCase().includes(term) ||
        load.origin.toLowerCase().includes(term) ||
        load.destination.toLowerCase().includes(term) ||
        load.commodity.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(load => load.status === statusFilter);
    }

    // Customer filter
    if (customerFilter) {
      filtered = filtered.filter(load => load.customer === customerFilter);
    }

    // Driver filter
    if (driverFilter) {
      filtered = filtered.filter(load => load.driver === driverFilter);
    }

    onFilter(filtered);
  }, [searchTerm, statusFilter, customerFilter, driverFilter, loads, onFilter]);

  return (
    <div className="mx-6 mb-4 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search loads, drivers, customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="DELIVERED">Delivered</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="PENDING">Pending</option>
        </select>

        {/* Customer Filter */}
        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
        >
          <option value="">All Customers</option>
          {customers.map(customer => (
            <option key={customer} value={customer}>{customer}</option>
          ))}
        </select>

        {/* Driver Filter */}
        <select
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
        >
          <option value="">All Drivers</option>
          {drivers.map(driver => (
            <option key={driver} value={driver}>{driver}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
