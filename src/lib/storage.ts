
const STORAGE_KEYS = {
  PRODUCTS: 'ecom_products',
  AD_SPEND: 'ecom_ad_spend',
  ORDERS: 'ecom_orders'
};

const getStorage = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storage = {
  getProducts: () => getStorage(STORAGE_KEYS.PRODUCTS),
  
  addProduct: (product: any) => {
    const products = getStorage(STORAGE_KEYS.PRODUCTS);
    const newProduct = { ...product, id: Date.now() };
    setStorage(STORAGE_KEYS.PRODUCTS, [...products, newProduct]);
    return newProduct;
  },

  deleteProduct: (id: number) => {
    const products = getStorage(STORAGE_KEYS.PRODUCTS).filter((p: any) => p.id !== id);
    const adSpend = getStorage(STORAGE_KEYS.AD_SPEND).filter((a: any) => a.product_id !== id);
    const orders = getStorage(STORAGE_KEYS.ORDERS).filter((o: any) => o.product_id !== id);
    setStorage(STORAGE_KEYS.PRODUCTS, products);
    setStorage(STORAGE_KEYS.AD_SPEND, adSpend);
    setStorage(STORAGE_KEYS.ORDERS, orders);
  },

  getAdSpend: () => {
    const adSpend = getStorage(STORAGE_KEYS.AD_SPEND);
    const products = getStorage(STORAGE_KEYS.PRODUCTS);
    return adSpend.map((a: any) => ({
      ...a,
      product_name: products.find((p: any) => p.id === a.product_id)?.name || 'Unknown'
    })).sort((a: any, b: any) => b.date.localeCompare(a.date));
  },

  addAdSpend: (entry: any) => {
    const adSpend = getStorage(STORAGE_KEYS.AD_SPEND);
    const newEntry = { ...entry, id: Date.now() };
    setStorage(STORAGE_KEYS.AD_SPEND, [...adSpend, newEntry]);
    return newEntry;
  },

  deleteAdSpend: (id: number) => {
    const adSpend = getStorage(STORAGE_KEYS.AD_SPEND).filter((a: any) => a.id !== id);
    setStorage(STORAGE_KEYS.AD_SPEND, adSpend);
  },

  getOrders: () => {
    const orders = getStorage(STORAGE_KEYS.ORDERS);
    const products = getStorage(STORAGE_KEYS.PRODUCTS);
    return orders.map((o: any) => {
      const p = products.find((prod: any) => prod.id === o.product_id);
      return {
        ...o,
        product_name: p?.name || 'Unknown',
        selling_price: p?.selling_price || 0
      };
    }).sort((a: any, b: any) => b.date.localeCompare(a.date));
  },

  addOrder: (order: any) => {
    const orders = getStorage(STORAGE_KEYS.ORDERS);
    const newOrder = { ...order, id: Date.now() };
    setStorage(STORAGE_KEYS.ORDERS, [...orders, newOrder]);
    return newOrder;
  },

  deleteOrder: (id: number) => {
    const orders = getStorage(STORAGE_KEYS.ORDERS).filter((o: any) => o.id !== id);
    setStorage(STORAGE_KEYS.ORDERS, orders);
  },

  updateOrderStatus: (id: number, status: string) => {
    const orders = getStorage(STORAGE_KEYS.ORDERS).map((o: any) => 
      o.id === id ? { ...o, status } : o
    );
    setStorage(STORAGE_KEYS.ORDERS, orders);
  },

  getStats: () => {
    const products = getStorage(STORAGE_KEYS.PRODUCTS);
    const adSpend = getStorage(STORAGE_KEYS.AD_SPEND);
    const orders = getStorage(STORAGE_KEYS.ORDERS);

    return products.map((p: any) => {
      const totalAdSpend = adSpend
        .filter((a: any) => a.product_id === p.id)
        .reduce((sum: number, a: any) => sum + a.amount, 0);
      
      const confirmedOrders = orders.filter((o: any) => o.product_id === p.id && o.status === 'confirmed');
      const orderCount = confirmedOrders.length;
      const revenue = orderCount * p.selling_price;
      const cogs = orderCount * p.cost_price;
      const delivery = orderCount * p.delivery_fee;
      const profit = revenue - cogs - delivery - totalAdSpend;
      const roas = totalAdSpend > 0 ? (revenue / totalAdSpend).toFixed(2) : 0;

      return {
        ...p,
        totalAdSpend,
        orderCount,
        revenue,
        profit,
        roas
      };
    });
  },

  getTimeline: () => {
    const adSpend = getStorage(STORAGE_KEYS.AD_SPEND);
    const orders = getStorage(STORAGE_KEYS.ORDERS);
    const products = getStorage(STORAGE_KEYS.PRODUCTS);
    
    const timeline = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dailyAds = adSpend
        .filter((a: any) => a.date === dateStr)
        .reduce((sum: number, a: any) => sum + a.amount, 0);
        
      const dailyRevenue = orders
        .filter((o: any) => o.date === dateStr && o.status === 'confirmed')
        .reduce((sum: number, o: any) => {
          const p = products.find((prod: any) => prod.id === o.product_id);
          return sum + (p?.selling_price || 0);
        }, 0);
        
      timeline.push({
        date: dateStr,
        revenue: dailyRevenue,
        ad_spend: dailyAds
      });
    }
    return timeline;
  }
};
