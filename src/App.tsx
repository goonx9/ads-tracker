import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart,
  Phone,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Trash2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { storage } from './lib/storage';

// Types
interface Product {
  id: number;
  name: string;
  cost_price: number;
  delivery_fee: number;
  selling_price: number;
  totalAdSpend: number;
  orderCount: number;
  revenue: number;
  profit: number;
  roas: number | string;
}

interface Order {
  id: number;
  product_id: number;
  product_name: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  selling_price: number;
  status: 'pending' | 'confirmed';
}

interface AdSpendEntry {
  id: number;
  product_id: number;
  product_name: string;
  date: string;
  amount: number;
}

interface TimelineData {
  date: string;
  revenue: number;
  ad_spend: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'entry' | 'orders'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adSpendHistory, setAdSpendHistory] = useState<AdSpendEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newProduct, setNewProduct] = useState({ name: '', cost_price: '', delivery_fee: '', selling_price: '' });
  const [newAdSpend, setNewAdSpend] = useState({ product_id: '', date: new Date().toISOString().split('T')[0], amount: '' });
  const [newOrder, setNewOrder] = useState({ product_id: '', date: new Date().toISOString().split('T')[0], customer_name: '', customer_phone: '', status: 'pending' });

  const fetchData = () => {
    setLoading(true);
    try {
      setProducts(storage.getStats());
      setOrders(storage.getOrders());
      setTimeline(storage.getTimeline());
      setAdSpendHistory(storage.getAdSpend());
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    storage.addProduct({
      name: newProduct.name,
      cost_price: parseFloat(newProduct.cost_price),
      delivery_fee: parseFloat(newProduct.delivery_fee),
      selling_price: parseFloat(newProduct.selling_price)
    });
    setNewProduct({ name: '', cost_price: '', delivery_fee: '', selling_price: '' });
    fetchData();
  };

  const handleDeleteProduct = (id: number) => {
    if (!confirm('Are you sure? This will delete all ad spend and orders for this product.')) return;
    storage.deleteProduct(id);
    fetchData();
  };

  const handleAddAdSpend = (e: React.FormEvent) => {
    e.preventDefault();
    storage.addAdSpend({
      product_id: parseInt(newAdSpend.product_id),
      date: newAdSpend.date,
      amount: parseFloat(newAdSpend.amount)
    });
    setNewAdSpend({ ...newAdSpend, amount: '' });
    fetchData();
  };

  const handleDeleteAdSpend = (id: number) => {
    if (!confirm('Are you sure you want to delete this ad spend entry?')) return;
    storage.deleteAdSpend(id);
    fetchData();
  };

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    storage.addOrder({
      product_id: parseInt(newOrder.product_id),
      date: newOrder.date,
      customer_name: newOrder.customer_name,
      customer_phone: newOrder.customer_phone,
      status: newOrder.status
    });
    setNewOrder({ ...newOrder, customer_name: '', customer_phone: '' });
    fetchData();
  };

  const handleDeleteOrder = (id: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    storage.deleteOrder(id);
    fetchData();
  };

  const handleUpdateOrderStatus = (id: number, status: string) => {
    storage.updateOrderStatus(id, status);
    fetchData();
  };

  const totalRevenue = products.reduce((acc, p) => acc + p.revenue, 0);
  const totalProfit = products.reduce((acc, p) => acc + p.profit, 0);
  const totalAdSpend = products.reduce((acc, p) => acc + p.totalAdSpend, 0);
  const avgROAS = totalAdSpend > 0 ? (totalRevenue / totalAdSpend).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-[#E9ECEF] z-10 hidden md:flex flex-col">
        <div className="p-6 border-bottom border-[#E9ECEF]">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="text-emerald-600" />
            EcomTracker
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Package size={20} />} label="Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          <NavItem icon={<PlusCircle size={20} />} label="Daily Entry" active={activeTab === 'entry'} onClick={() => setActiveTab('entry')} />
          <NavItem icon={<Users size={20} />} label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
            <p className="text-sm text-[#6C757D]">Manage your e-commerce performance</p>
          </div>
          <button 
            onClick={fetchData}
            className="p-2 rounded-full hover:bg-white border border-transparent hover:border-[#E9ECEF] transition-all"
          >
            {loading ? <Loader2 className="animate-spin text-emerald-600" /> : <TrendingUp className="text-emerald-600" />}
          </button>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Confirmed Revenue" value={`₦${totalRevenue.toLocaleString()}`} icon={<DollarSign className="text-blue-600" />} />
                <StatCard 
                  title="Total Profit" 
                  value={`₦${totalProfit.toLocaleString()}`} 
                  icon={<TrendingUp className={totalProfit >= 0 ? "text-emerald-600" : "text-red-600"} />} 
                  trend={totalProfit >= 0 ? "positive" : "negative"}
                />
                <StatCard title="Total Ad Spend" value={`₦${totalAdSpend.toLocaleString()}`} icon={<ShoppingCart className="text-orange-600" />} />
                <StatCard title="Avg. ROAS" value={avgROAS} icon={<TrendingUp className="text-purple-600" />} />
              </div>

              {/* Timeline Chart */}
              <div className="bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm">
                <h3 className="font-bold mb-6">Performance Timeline (Last 30 Days)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#64748b'}} 
                        minTickGap={30}
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                      <Area type="monotone" dataKey="ad_spend" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorAds)" name="Ad Spend" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Product Performance Table */}
              <div className="bg-white rounded-2xl border border-[#E9ECEF] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E9ECEF]">
                  <h3 className="font-bold">Product Performance (Confirmed Only)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8F9FA] text-[#6C757D] text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Product</th>
                        <th className="px-6 py-4 font-semibold text-right">Orders</th>
                        <th className="px-6 py-4 font-semibold text-right">Revenue</th>
                        <th className="px-6 py-4 font-semibold text-right">Ad Spend</th>
                        <th className="px-6 py-4 font-semibold text-right">Profit</th>
                        <th className="px-6 py-4 font-semibold text-right">ROAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9ECEF]">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-[#F8F9FA] transition-colors">
                          <td className="px-6 py-4 font-medium">{p.name}</td>
                          <td className="px-6 py-4 text-right">{p.orderCount}</td>
                          <td className="px-6 py-4 text-right">₦{p.revenue.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">₦{p.totalAdSpend.toLocaleString()}</td>
                          <td className={`px-6 py-4 text-right font-semibold ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ₦{p.profit.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-sm font-medium">
                              {p.roas}x
                            </span>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-[#6C757D]">
                            No products found. Start by adding a product.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div 
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm sticky top-8">
                  <h3 className="font-bold mb-4">Add New Product</h3>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <Input label="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. Wireless Headphones" required />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Cost Price (₦)" type="number" step="0.01" value={newProduct.cost_price} onChange={e => setNewProduct({...newProduct, cost_price: e.target.value})} required />
                      <Input label="Delivery Fee (₦)" type="number" step="0.01" value={newProduct.delivery_fee} onChange={e => setNewProduct({...newProduct, delivery_fee: e.target.value})} required />
                    </div>
                    <Input label="Selling Price (₦)" type="number" step="0.01" value={newProduct.selling_price} onChange={e => setNewProduct({...newProduct, selling_price: e.target.value})} required />
                    <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                      <PlusCircle size={18} />
                      Create Product
                    </button>
                  </form>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-lg">{p.name}</h4>
                      <div className="flex gap-4 text-sm text-[#6C757D] mt-1">
                        <span>Cost: ₦{p.cost_price}</span>
                        <span>Delivery: ₦{p.delivery_fee}</span>
                        <span>Selling: ₦{p.selling_price}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-[#6C757D] uppercase font-semibold">Margin</div>
                        <div className="text-emerald-600 font-bold text-xl">
                          ₦{(p.selling_price - p.cost_price - p.delivery_fee).toFixed(2)}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'entry' && (
            <motion.div 
              key="entry"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ad Spend Form */}
                <div className="bg-white p-8 rounded-2xl border border-[#E9ECEF] shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                      <ShoppingCart size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Record Ad Spend</h3>
                      <p className="text-sm text-[#6C757D]">Daily marketing expenses</p>
                    </div>
                  </div>
                  <form onSubmit={handleAddAdSpend} className="space-y-4">
                    <Select 
                      label="Select Product" 
                      value={newAdSpend.product_id} 
                      onChange={e => setNewAdSpend({...newAdSpend, product_id: e.target.value})}
                      options={products.map(p => ({ value: p.id.toString(), label: p.name }))}
                      required
                    />
                    <Input label="Date" type="date" value={newAdSpend.date} onChange={e => setNewAdSpend({...newAdSpend, date: e.target.value})} required />
                    <Input label="Amount Spent (₦)" type="number" step="0.01" value={newAdSpend.amount} onChange={e => setNewAdSpend({...newAdSpend, amount: e.target.value})} required />
                    <button type="submit" className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl font-semibold hover:bg-black transition-colors">
                      Save Ad Spend
                    </button>
                  </form>
                </div>

                {/* Order Form */}
                <div className="bg-white p-8 rounded-2xl border border-[#E9ECEF] shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">New Sale / Order</h3>
                      <p className="text-sm text-[#6C757D]">Record customer details</p>
                    </div>
                  </div>
                  <form onSubmit={handleAddOrder} className="space-y-4">
                    <Select 
                      label="Select Product" 
                      value={newOrder.product_id} 
                      onChange={e => setNewOrder({...newOrder, product_id: e.target.value})}
                      options={products.map(p => ({ value: p.id.toString(), label: p.name }))}
                      required
                    />
                    <Input label="Date" type="date" value={newOrder.date} onChange={e => setNewOrder({...newOrder, date: e.target.value})} required />
                    <Input label="Customer Name" value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} placeholder="John Doe" required />
                    <Input label="Phone Number" value={newOrder.customer_phone} onChange={e => setNewOrder({...newOrder, customer_phone: e.target.value})} placeholder="+1 234 567 890" required />
                    <Select 
                      label="Initial Status" 
                      value={newOrder.status} 
                      onChange={e => setNewOrder({...newOrder, status: e.target.value})}
                      options={[
                        { value: 'pending', label: 'Pending' },
                        { value: 'confirmed', label: 'Confirmed' }
                      ]}
                      required
                    />
                    <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
                      Record Sale
                    </button>
                  </form>
                </div>
              </div>

              {/* Ad Spend History */}
              <div className="bg-white rounded-2xl border border-[#E9ECEF] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E9ECEF]">
                  <h3 className="font-bold">Ad Spend History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8F9FA] text-[#6C757D] text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold">Product</th>
                        <th className="px-6 py-4 font-semibold text-right">Amount</th>
                        <th className="px-6 py-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9ECEF]">
                      {adSpendHistory.map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#F8F9FA] transition-colors">
                          <td className="px-6 py-4 text-sm">{entry.date}</td>
                          <td className="px-6 py-4 text-sm font-medium">{entry.product_name}</td>
                          <td className="px-6 py-4 text-sm text-right font-bold">₦{entry.amount}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDeleteAdSpend(entry.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {adSpendHistory.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-[#6C757D]">
                            No ad spend history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl border border-[#E9ECEF] overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#F8F9FA] text-[#6C757D] text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Customer</th>
                      <th className="px-6 py-4 font-semibold">Product</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Amount</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF]">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="px-6 py-4 text-sm flex items-center gap-2">
                          <Calendar size={14} className="text-[#6C757D]" />
                          {o.date}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{o.customer_name}</div>
                          <div className="text-xs text-[#6C757D] flex items-center gap-1">
                            <Phone size={10} /> {o.customer_phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{o.product_name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-fit ${
                            o.status === 'confirmed' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-orange-50 text-orange-700'
                          }`}>
                            {o.status === 'confirmed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {o.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">₦{o.selling_price}</td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          <select 
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="text-xs border border-[#E9ECEF] rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                          </select>
                          <button 
                            onClick={() => handleDeleteOrder(o.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-[#6C757D]">
                          No orders recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Helper Components
function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-emerald-50 text-emerald-700 font-semibold' 
          : 'text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: 'positive' | 'negative' }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-[#F8F9FA] rounded-lg">{icon}</div>
        {trend && (
          <div className={`flex items-center text-xs font-bold ${trend === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          </div>
        )}
      </div>
      <h4 className="text-sm text-[#6C757D] font-medium">{title}</h4>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-[#6C757D]">{label}</label>
      <input 
        {...props}
        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
      />
    </div>
  );
}

function Select({ label, options, ...props }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-[#6C757D]">{label}</label>
      <select 
        {...props}
        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
      >
        <option value="">Select an option</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
