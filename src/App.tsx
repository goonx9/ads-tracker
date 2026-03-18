import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Plus, 
  Trash2, 
  LayoutDashboard, 
  Package, 
  History, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  X,
  PlusCircle,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from './lib/storage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [adSpendHistory, setAdSpendHistory] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newProduct, setNewProduct] = useState({ name: '', cost_price: '', delivery_fee: '', selling_price: '' });
  const [newAdSpend, setNewAdSpend] = useState({ product_id: '', date: new Date().toISOString().split('T')[0], amount: '' });
  const [newOrder, setNewOrder] = useState({ product_id: '', date: new Date().toISOString().split('T')[0], customer_name: '', customer_phone: '', status: 'pending' });

  const fetchData = () => {
    setLoading(true);
    try {
      const p = storage.getStats();
      const o = storage.getOrders();
      const a = storage.getAdSpendHistory();
      const t = storage.getTimeline();
      
      setProducts(p || []);
      setOrders(o || []);
      setAdSpendHistory(a || []);
      setTimeline(t || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalRevenue = useMemo(() => products.reduce((acc, p) => acc + (p.revenue || 0), 0), [products]);
  const totalProfit = useMemo(() => products.reduce((acc, p) => acc + (p.profit || 0), 0), [products]);
  const totalAdSpend = useMemo(() => products.reduce((acc, p) => acc + (p.totalAdSpend || 0), 0), [products]);
  const avgROAS = totalAdSpend > 0 ? (totalRevenue / totalAdSpend).toFixed(2) : '0.00';

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.selling_price) return;
    storage.addProduct({
      name: newProduct.name,
      cost_price: parseFloat(newProduct.cost_price) || 0,
      delivery_fee: parseFloat(newProduct.delivery_fee) || 0,
      selling_price: parseFloat(newProduct.selling_price) || 0
    });
    setNewProduct({ name: '', cost_price: '', delivery_fee: '', selling_price: '' });
    fetchData();
  };

  const handleDeleteProduct = (id: number) => {
    storage.deleteProduct(id);
    fetchData();
  };

  const handleAddAdSpend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdSpend.product_id || !newAdSpend.amount) return;
    storage.addAdSpend({
      product_id: parseInt(newAdSpend.product_id),
      date: newAdSpend.date,
      amount: parseFloat(newAdSpend.amount) || 0
    });
    setNewAdSpend({ ...newAdSpend, amount: '' });
    fetchData();
  };

  const handleDeleteAdSpend = (id: number) => {
    storage.deleteAdSpend(id);
    fetchData();
  };

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.product_id || !newOrder.customer_name) return;
    storage.addOrder({
      product_id: parseInt(newOrder.product_id),
      date: newOrder.date,
      customer_name: newOrder.customer_name,
      customer_phone: newOrder.customer_phone,
      status: newOrder.status as 'pending' | 'confirmed'
    });
    setNewOrder({ ...newOrder, customer_name: '', customer_phone: '' });
    fetchData();
  };

  const handleDeleteOrder = (id: number) => {
    storage.deleteOrder(id);
    fetchData();
  };

  const handleUpdateOrderStatus = (id: number, status: 'pending' | 'confirmed') => {
    storage.updateOrderStatus(id, status);
    fetchData();
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1A1A1A] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E9ECEF] flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-[#E9ECEF]">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">EcomTracker</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavItem 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')}
            icon={<Package size={20} />}
            label="Products"
          />
          <NavItem 
            active={activeTab === 'entry'} 
            onClick={() => setActiveTab('entry')}
            icon={<PlusCircle size={20} />}
            label="Daily Entry"
          />
          <NavItem 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')}
            icon={<Users size={20} />}
            label="Orders"
          />
        </nav>

        <div className="p-4 border-t border-[#E9ECEF]">
          <div className="bg-emerald-50 p-4 rounded-xl">
            <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Status</p>
            <p className="text-sm text-emerald-600 font-medium">Standalone Mode (Local)</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight capitalize">{activeTab}</h2>
            <p className="text-[#6C757D] text-sm">Real-time performance tracking</p>
          </div>
          <button 
            onClick={fetchData}
            className="p-2 hover:bg-white border border-transparent hover:border-[#E9ECEF] rounded-lg transition-all"
          >
            {loading ? <Loader2 className="animate-spin text-emerald-600" /> : <RefreshCw className="text-[#6C757D] w-5 h-5" />}
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard 
                    title="Total Revenue" 
                    value={`₦${totalRevenue.toLocaleString()}`}
                    icon={<DollarSign className="text-blue-600" />}
                    trend="+12.5%"
                  />
                  <StatCard 
                    title="Net Profit" 
                    value={`₦${totalProfit.toLocaleString()}`}
                    icon={<TrendingUp className={totalProfit >= 0 ? "text-emerald-600" : "text-red-600"} />}
                    trend={totalProfit >= 0 ? "Healthy" : "Loss"}
                    color={totalProfit >= 0 ? "text-emerald-600" : "text-red-600"}
                  />
                  <StatCard 
                    title="Ad Spend" 
                    value={`₦${totalAdSpend.toLocaleString()}`}
                    icon={<ShoppingCart className="text-orange-600" />}
                    trend="Last 30 days"
                  />
                  <StatCard 
                    title="Avg ROAS" 
                    value={`${avgROAS}x`}
                    icon={<Activity className="text-purple-600" />}
                    trend="Return on Ad Spend"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg">Revenue vs Ad Spend</h3>
                      <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                          <span>Revenue</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span>Ads</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeline}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#6C757D'}}
                            tickFormatter={(str) => str.split('-').slice(1).join('/')}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6C757D'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                          <Area type="monotone" dataKey="ad_spend" stroke="#f97316" strokeWidth={2} fill="transparent" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm">
                    <h3 className="font-bold text-lg mb-6">Product Performance</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto no-scrollbar">
                      {products.length === 0 ? (
                        <p className="text-center text-[#6C757D] py-8">No products yet</p>
                      ) : (
                        products.map(p => (
                          <div key={p.id} className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E9ECEF]">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-sm">{p.name}</h4>
                              <span className={`text-xs font-bold ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                ₦{p.profit.toLocaleString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-[#6C757D] uppercase font-bold">
                              <div>Orders: <span className="text-[#1A1A1A]">{p.orderCount}</span></div>
                              <div>ROAS: <span className="text-[#1A1A1A]">{p.roas}x</span></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E9ECEF] shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#E9ECEF]">
                    <h3 className="font-bold">Detailed Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#F8F9FA] text-[#6C757D] text-xs uppercase font-bold">
                        <tr>
                          <th className="px-6 py-4">Product</th>
                          <th className="px-6 py-4">Orders</th>
                          <th className="px-6 py-4">Revenue</th>
                          <th className="px-6 py-4">Ads</th>
                          <th className="px-6 py-4">Profit</th>
                          <th className="px-6 py-4">ROAS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9ECEF]">
                        {products.map(p => (
                          <tr key={p.id} className="hover:bg-[#F8F9FA] transition-colors">
                            <td className="px-6 py-4 font-medium">{p.name}</td>
                            <td className="px-6 py-4">{p.orderCount}</td>
                            <td className="px-6 py-4">₦{p.revenue.toLocaleString()}</td>
                            <td className="px-6 py-4">₦{p.totalAdSpend.toLocaleString()}</td>
                            <td className={`px-6 py-4 font-bold ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              ₦{p.profit.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-bold">
                                {p.roas}x
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm sticky top-8">
                    <h3 className="font-bold text-lg mb-6">Add New Product</h3>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <Input 
                        label="Product Name" 
                        placeholder="e.g. Wireless Earbuds"
                        value={newProduct.name}
                        onChange={(v) => setNewProduct({...newProduct, name: v})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          label="Cost Price (₦)" 
                          type="number"
                          placeholder="0"
                          value={newProduct.cost_price}
                          onChange={(v) => setNewProduct({...newProduct, cost_price: v})}
                        />
                        <Input 
                          label="Delivery Fee (₦)" 
                          type="number"
                          placeholder="0"
                          value={newProduct.delivery_fee}
                          onChange={(v) => setNewProduct({...newProduct, delivery_fee: v})}
                        />
                      </div>
                      <Input 
                        label="Selling Price (₦)" 
                        type="number"
                        placeholder="0"
                        value={newProduct.selling_price}
                        onChange={(v) => setNewProduct({...newProduct, selling_price: v})}
                      />
                      <button 
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={20} />
                        Create Product
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-bold text-lg">Product List</h3>
                  {products.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-dashed border-[#CED4DA] text-center">
                      <Package className="w-12 h-12 text-[#ADB5BD] mx-auto mb-4" />
                      <p className="text-[#6C757D]">No products added yet. Start by adding one!</p>
                    </div>
                  ) : (
                    products.map(p => (
                      <div key={p.id} className="bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <Package size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{p.name}</h4>
                            <div className="flex gap-4 text-xs text-[#6C757D] font-medium uppercase">
                              <span>Cost: ₦{p.cost_price}</span>
                              <span>Sell: ₦{p.selling_price}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 text-[#ADB5BD] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'entry' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <History className="text-orange-600" />
                      <h3 className="font-bold text-lg">Record Ad Spend</h3>
                    </div>
                    <form onSubmit={handleAddAdSpend} className="space-y-4">
                      <Select 
                        label="Product"
                        value={newAdSpend.product_id}
                        options={products.map(p => ({ label: p.name, value: p.id }))}
                        onChange={(v) => setNewAdSpend({...newAdSpend, product_id: v})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          label="Date" 
                          type="date"
                          value={newAdSpend.date}
                          onChange={(v) => setNewAdSpend({...newAdSpend, date: v})}
                        />
                        <Input 
                          label="Amount (₦)" 
                          type="number"
                          placeholder="0"
                          value={newAdSpend.amount}
                          onChange={(v) => setNewAdSpend({...newAdSpend, amount: v})}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                      >
                        Save Ad Spend
                      </button>
                    </form>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm">
                    <h3 className="font-bold mb-4">Recent Ad Spend</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                      {adSpendHistory.length === 0 ? (
                        <p className="text-center text-[#6C757D] py-4">No entries yet</p>
                      ) : (
                        adSpendHistory.map(a => (
                          <div key={a.id} className="flex justify-between items-center p-3 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF]">
                            <div>
                              <p className="text-sm font-bold">{a.product_name}</p>
                              <p className="text-[10px] text-[#6C757D]">{a.date}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-orange-600">₦{a.amount.toLocaleString()}</span>
                              <button onClick={() => handleDeleteAdSpend(a.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <PlusCircle className="text-emerald-600" />
                      <h3 className="font-bold text-lg">New Order</h3>
                    </div>
                    <form onSubmit={handleAddOrder} className="space-y-4">
                      <Select 
                        label="Product"
                        value={newOrder.product_id}
                        options={products.map(p => ({ label: p.name, value: p.id }))}
                        onChange={(v) => setNewOrder({...newOrder, product_id: v})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          label="Date" 
                          type="date"
                          value={newOrder.date}
                          onChange={(v) => setNewOrder({...newOrder, date: v})}
                        />
                        <Select 
                          label="Status"
                          value={newOrder.status}
                          options={[
                            { label: 'Pending', value: 'pending' },
                            { label: 'Confirmed', value: 'confirmed' }
                          ]}
                          onChange={(v) => setNewOrder({...newOrder, status: v})}
                        />
                      </div>
                      <Input 
                        label="Customer Name" 
                        placeholder="e.g. John Doe"
                        value={newOrder.customer_name}
                        onChange={(v) => setNewOrder({...newOrder, customer_name: v})}
                      />
                      <Input 
                        label="Customer Phone" 
                        placeholder="e.g. 08012345678"
                        value={newOrder.customer_phone}
                        onChange={(v) => setNewOrder({...newOrder, customer_phone: v})}
                      />
                      <button 
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                      >
                        Record Order
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl border border-[#E9ECEF] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#E9ECEF] flex justify-between items-center">
                  <h3 className="font-bold">Order History</h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold">
                      {orders.filter(o => o.status === 'pending').length} Pending
                    </span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                      {orders.filter(o => o.status === 'confirmed').length} Confirmed
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8F9FA] text-[#6C757D] text-xs uppercase font-bold">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9ECEF]">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-[#6C757D]">No orders recorded yet</td>
                        </tr>
                      ) : (
                        orders.map(o => (
                          <tr key={o.id} className="hover:bg-[#F8F9FA] transition-colors">
                            <td className="px-6 py-4 text-sm">{o.date}</td>
                            <td className="px-6 py-4">
                              <div className="font-medium">{o.customer_name}</div>
                              <div className="text-xs text-[#6C757D]">{o.customer_phone}</div>
                            </td>
                            <td className="px-6 py-4 text-sm">{o.product_name}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                o.status === 'confirmed' 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : 'bg-orange-50 text-orange-700'
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleUpdateOrderStatus(o.id, o.status === 'confirmed' ? 'pending' : 'confirmed')}
                                  className="text-xs font-bold text-emerald-600 hover:underline"
                                >
                                  Flip Status
                                </button>
                                <button 
                                  onClick={() => handleDeleteOrder(o.id)}
                                  className="p-1 text-[#ADB5BD] hover:text-red-500 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

// --- Subcomponents ---

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  active, onClick, icon, label 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm' 
        : 'text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#1A1A1A]'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend?: string; color?: string }> = ({ 
  title, value, icon, trend, color = "" 
}) => (
  <div className="bg-white p-6 rounded-2xl border border-[#E9ECEF] shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-[#F8F9FA] rounded-lg">
        {icon}
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-[#6C757D] uppercase bg-[#F8F9FA] px-2 py-1 rounded">
          {trend}
        </span>
      )}
    </div>
    <p className="text-[#6C757D] text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
    <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
  </div>
);

const Input: React.FC<{ label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({ 
  label, type = "text", value, onChange, placeholder 
}) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase text-[#6C757D] tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
    />
  </div>
);

const Select: React.FC<{ label: string; value: string | number; options: { label: string; value: any }[]; onChange: (v: string) => void }> = ({ 
  label, value, options, onChange 
}) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase text-[#6C757D] tracking-widest ml-1">{label}</label>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
    >
      <option value="">Select Option</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

export default App;
