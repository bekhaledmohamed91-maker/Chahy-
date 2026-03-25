import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Truck, Home as HomeIcon, Plus, Minus, Trash2, MapPin, Phone, MessageCircle, ArrowLeft, CheckCircle, Package, Settings, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartProvider, useCart } from './CartContext';
import { Product, Order, CartItem } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = () => {
  const { cart } = useCart();
  const location = useLocation();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-50 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <Link to="/" className={cn("flex flex-col items-center gap-1 transition-colors", isActive('/') ? "text-green-600" : "text-gray-400 hover:text-green-500")}>
        <HomeIcon size={24} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Accueil</span>
      </Link>
      <Link to="/cart" className={cn("flex flex-col items-center gap-1 relative transition-colors", isActive('/cart') ? "text-green-600" : "text-gray-400 hover:text-green-500")}>
        <ShoppingCart size={24} />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {itemCount}
          </span>
        )}
        <span className="text-[10px] font-medium uppercase tracking-wider">Panier</span>
      </Link>
      <Link to="/delivery" className={cn("flex flex-col items-center gap-1 transition-colors", isActive('/delivery') ? "text-green-600" : "text-gray-400 hover:text-green-500")}>
        <Truck size={24} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Livreur</span>
      </Link>
      <Link to="/admin" className={cn("flex flex-col items-center gap-1 transition-colors", isActive('/admin') ? "text-green-600" : "text-gray-400 hover:text-green-500")}>
        <Settings size={24} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Admin</span>
      </Link>
    </nav>
  );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80") {
              target.src = "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80";
            }
          }}
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-green-700 shadow-sm">
          {product.price} DA
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h3>
        <p className="text-xs text-gray-400 mb-4 uppercase tracking-widest">{product.category}</p>
        <button 
          onClick={handleAdd}
          disabled={product.stock <= 0}
          className={cn(
            "w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2",
            isAdded ? "bg-green-100 text-green-700" : "bg-green-600 text-white active:scale-95 hover:bg-green-700",
            product.stock <= 0 && "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          {isAdded ? (
            <><CheckCircle size={18} /> Ajouté</>
          ) : product.stock <= 0 ? (
            "Rupture de stock"
          ) : (
            <><Plus size={18} /> Ajouter</>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// --- Pages ---

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <header className="mb-8 text-center">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl font-black text-green-700 mb-2 tracking-tight"
        >
          CHAHY VERT
        </motion.h1>
        <p className="text-gray-500 font-medium italic">Le meilleur poulet de Sidi Bel Abbès</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, total } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <ShoppingCart size={48} className="text-gray-200" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Votre panier est vide</h2>
      <p className="text-gray-500 mb-8">Découvrez nos produits frais et commencez vos achats.</p>
      <Link to="/" className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-700 transition-colors">
        Voir les produits
      </Link>
    </div>
  );

  return (
    <div className="pb-32 pt-6 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Mon Panier</h1>
      </div>

      <div className="space-y-4 mb-8">
        {cart.map(item => (
          <motion.div 
            layout
            key={item.id} 
            className="bg-white p-4 rounded-3xl border border-gray-100 flex gap-4 items-center"
          >
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-20 h-20 rounded-2xl object-cover" 
              referrerPolicy="no-referrer" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80") {
                  target.src = "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80";
                }
              }}
            />
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">{item.name}</h3>
              <p className="text-green-600 font-bold text-sm">{item.price} DA</p>
              <div className="flex items-center gap-3 mt-2">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold w-6 text-center">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <button 
              onClick={() => removeFromCart(item.id)}
              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4 max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium">Total de la commande</span>
            <span className="text-2xl font-black text-green-700">{total} DA</span>
          </div>
          <button 
            onClick={() => navigate('/checkout')}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
          >
            Passer la commande
          </button>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    remark: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderData = {
      customer_name: formData.name,
      customer_phone: formData.phone,
      customer_address: formData.address,
      remark: formData.remark,
      total_price: total,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        // WhatsApp Message
        const itemsList = cart.map(item => `- ${item.name} x${item.quantity} (${item.price * item.quantity} DA)`).join('\n');
        const message = `*Nouvelle Commande - Chahy Vert*\n\n*Client:* ${formData.name}\n*Tél:* ${formData.phone}\n*Adresse:* ${formData.address}\n\n*Produits:*\n${itemsList}\n\n*Total:* ${total} DA\n${formData.remark ? `\n*Remarque:* ${formData.remark}` : ''}`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/213557758296?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        clearCart();
        navigate('/success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Finaliser la commande</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nom complet</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
            <input 
              required
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="05XX XX XX XX"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Adresse de livraison</label>
            <textarea 
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all min-h-[100px]"
              placeholder="Quartier, Rue, N° de maison..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Remarque (optionnel)</label>
            <input 
              type="text"
              value={formData.remark}
              onChange={e => setFormData({ ...formData, remark: e.target.value })}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="Ex: Sonner à la porte bleue"
            />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
          <div className="flex items-center gap-3 text-green-700">
            <Package size={20} />
            <span className="font-bold">Paiement à la livraison</span>
          </div>
          <p className="text-sm text-green-600 mt-1 opacity-80">Vous paierez le livreur une fois votre commande reçue.</p>
        </div>

        <button 
          disabled={isSubmitting}
          type="submit"
          className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:bg-gray-300"
        >
          {isSubmitting ? "Envoi en cours..." : <><MessageCircle size={20} /> Envoyer via WhatsApp</>}
        </button>
      </form>
    </div>
  );
};

const Success = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-8"
      >
        <CheckCircle size={64} className="text-green-600" />
      </motion.div>
      <h2 className="text-3xl font-black text-gray-800 mb-4">Commande Envoyée !</h2>
      <p className="text-gray-500 mb-12 max-w-xs">Votre commande a été transmise avec succès. Nous vous contacterons bientôt pour confirmer.</p>
      <button 
        onClick={() => navigate('/')}
        className="bg-green-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
      >
        Retour à l'accueil
      </button>
    </div>
  );
};

const Admin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<'products' | 'orders'>('orders');
  const [isEditing, setIsEditing] = useState<Product | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/products').then(res => res.json()).then(setProducts);
      fetch('/api/orders').then(res => res.json()).then(setOrders);
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Mot de passe incorrect');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8">
          <Settings size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Accès Admin</h2>
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <input 
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all"
            placeholder="Mot de passe"
          />
          <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all">
            Se connecter
          </button>
        </form>
      </div>
    );
  }

  const handleUpdateProduct = async (id: number, updates: Partial<Product>) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, ...updates })
    });
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  return (
    <div className="pb-32 pt-6 px-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Administration</h1>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setView('orders')}
            className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", view === 'orders' ? "bg-white text-green-700 shadow-sm" : "text-gray-500")}
          >
            Commandes
          </button>
          <button 
            onClick={() => setView('products')}
            className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", view === 'products' ? "bg-white text-green-700 shadow-sm" : "text-gray-500")}
          >
            Produits
          </button>
        </div>
      </header>

      {view === 'orders' ? (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{order.customer_name}</h3>
                  <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase",
                  order.status === 'pending' ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                )}>
                  {order.status === 'pending' ? 'En attente' : 'Livré'}
                </span>
              </div>
              <div className="space-y-2 mb-4 border-y border-gray-50 py-4">
                {order.items?.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} x{item.quantity}</span>
                    <span className="font-bold">{item.price * item.quantity} DA</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  <p>{order.customer_phone}</p>
                  <p>{order.customer_address}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-xl font-black text-green-700">{order.total_price} DA</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex gap-4 items-center">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-16 h-16 rounded-2xl object-cover" 
                referrerPolicy="no-referrer" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80") {
                    target.src = "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80";
                  }
                }}
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{product.name}</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Prix (DA)</span>
                    <input 
                      type="number"
                      value={product.price}
                      onChange={(e) => handleUpdateProduct(product.id, { price: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold text-green-700"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Stock</span>
                    <input 
                      type="number"
                      value={product.stock}
                      onChange={(e) => handleUpdateProduct(product.id, { stock: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Delivery = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/orders')
        .then(res => res.json())
        .then(data => {
          setOrders(data.filter((o: Order) => o.status === 'pending'));
          setLoading(false);
        });
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'delivery123') {
      setIsAuthenticated(true);
    } else {
      alert('Mot de passe incorrect');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8">
          <Truck size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Accès Livreur</h2>
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <input 
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all"
            placeholder="Mot de passe"
          />
          <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all">
            Se connecter
          </button>
        </form>
      </div>
    );
  }

  const handleComplete = async (id: number) => {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'delivered' })
    });
    setOrders(orders.filter(o => o.id !== id));
  };

  const openMaps = (address: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address + ", Sidi Bel Abbès")}`, '_blank');
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="pb-32 pt-6 px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Livraisons à faire</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Aucune livraison en attente.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-xl text-gray-800">{order.customer_name}</h3>
                  <div className="flex items-center gap-2 text-green-600 font-bold mt-1">
                    <Phone size={16} />
                    <a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">À encaisser</p>
                  <p className="text-xl font-black text-green-700">{order.total_price} DA</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl mb-6 flex gap-3 items-start">
                <MapPin className="text-red-500 shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-700">{order.customer_address}</p>
                  <button 
                    onClick={() => openMaps(order.customer_address)}
                    className="text-blue-600 text-xs font-bold mt-2 flex items-center gap-1"
                  >
                    Ouvrir dans Google Maps <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <button 
                onClick={() => handleComplete(order.id)}
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
              >
                <CheckCircle size={20} /> Marquer comme livré
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<Success />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/delivery" element={<Delivery />} />
          </Routes>
          <Navbar />
        </div>
      </Router>
    </CartProvider>
  );
}
