import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Truck, Home as HomeIcon, Plus, Minus, Trash2, MapPin, Phone, MessageCircle, ArrowLeft, CheckCircle, Package, Settings, LogOut, ChevronRight, XCircle, History, Bell, Clock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartProvider, useCart } from './CartContext';
import { Product, Order, CartItem, Driver, Customer, Voucher } from './types';

// --- Contexts ---
const CustomerContext = React.createContext<{
  customer: Customer | null;
  login: (c: Customer) => void;
  logout: () => void;
  refresh: () => Promise<void>;
} | undefined>(undefined);

const CustomerProvider = ({ children }: { children: React.ReactNode }) => {
  const [customer, setCustomer] = useState<Customer | null>(() => {
    const saved = localStorage.getItem('chahy_customer');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (c: Customer) => {
    setCustomer(c);
    localStorage.setItem('chahy_customer', JSON.stringify(c));
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem('chahy_customer');
  };

  const refresh = async () => {
    if (!customer) return;
    try {
      const res = await fetch(`/api/customers/${customer.phone}`);
      const data = await res.json();
      if (data.customer) {
        setCustomer(data.customer);
        localStorage.setItem('chahy_customer', JSON.stringify(data.customer));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CustomerContext.Provider value={{ customer, login, logout, refresh }}>
      {children}
    </CustomerContext.Provider>
  );
};

const useCustomer = () => {
  const context = React.useContext(CustomerContext);
  if (!context) throw new Error('useCustomer must be used within a CustomerProvider');
  return context;
};
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issue using CDN
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const STORES = {
  ORAN: { name: "Oran (Canastel)", location: [35.748, -0.585] as [number, number] },
  SBA: { name: "Sidi Bel Abbès", location: [35.189, -0.630] as [number, number] }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const LocationPicker = ({ onLocationSelect, currentPosition, storeLocation }: { onLocationSelect: (lat: number, lng: number) => void, currentPosition: [number, number] | null, storeLocation: [number, number] }) => {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (currentPosition) {
      map.flyTo(currentPosition, 15);
    }
  }, [currentPosition, map]);

  useEffect(() => {
    if (!currentPosition) {
      map.setView(storeLocation, 13);
    }
  }, [storeLocation, map, currentPosition]);

  return currentPosition === null ? null : (
    <Marker position={currentPosition}></Marker>
  );
};

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
      <Link to="/loyalty" className={cn("flex flex-col items-center gap-1 transition-colors", isActive('/loyalty') ? "text-green-600" : "text-gray-400 hover:text-green-500")}>
        <User size={24} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Profil</span>
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
          className={cn("w-full h-full object-cover transition-transform duration-500 group-hover:scale-110", product.stock <= 0 && "grayscale opacity-60")}
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
        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transform -rotate-12">
              Rupture de stock
            </div>
          </div>
        )}
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
        <p className="text-gray-500 font-medium italic">Poulet vert sans antibiotique pour une santé meilleure</p>
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
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const getStock = (productId: number) => {
    return products.find(p => p.id === productId)?.stock ?? 999;
  };

  const isStockInsufficient = cart.some(item => item.quantity > getStock(item.id));

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
              {item.quantity > getStock(item.id) && (
                <p className="text-red-500 text-[10px] font-bold mt-1">Stock insuffisant (Max: {getStock(item.id)})</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold w-6 text-center">{item.quantity}</span>
                <button 
                  onClick={() => {
                    if (item.quantity < getStock(item.id)) {
                      updateQuantity(item.id, item.quantity + 1);
                    } else {
                      alert("Stock maximum atteint.");
                    }
                  }}
                  className={cn(
                    "w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50",
                    item.quantity >= getStock(item.id) && "opacity-50 cursor-not-allowed"
                  )}
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
            onClick={() => !isStockInsufficient && navigate('/checkout')}
            disabled={isStockInsufficient}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg",
              isStockInsufficient 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-green-200"
            )}
          >
            {isStockInsufficient ? "Stock insuffisant" : "Passer la commande"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  const { cart, total, clearCart, deliveryFee, deliveryIncrement } = useCart();
  const { customer } = useCustomer();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: '',
    remark: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ id: string, amount: number } | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  const checkVoucher = async () => {
    if (!voucherCode || !formData.phone) {
      alert("Veuillez entrer votre numéro de téléphone et le code du bon d'achat.");
      return;
    }
    setIsCheckingVoucher(true);
    try {
      const res = await fetch(`/api/vouchers/${voucherCode}?phone=${formData.phone}`);
      if (res.ok) {
        const data = await res.json();
        setAppliedVoucher(data);
        alert(`Bon d'achat de ${data.amount} DA appliqué !`);
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingVoucher(false);
    }
  };
  const [distance, setDistance] = useState(0);
  const [customerLocation, setCustomerLocation] = useState<[number, number] | null>(null);
  const [selectedStore, setSelectedStore] = useState<keyof typeof STORES>('ORAN');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  const calculateDeliveryFee = (dist: number) => {
    if (selectedStore === 'SBA') return 200;
    if (dist === 0) return 0;
    if (dist <= 10) return deliveryFee;
    return deliveryFee + Math.ceil((dist - 10) / 5) * deliveryIncrement;
  };

  const selectedFee = calculateDeliveryFee(distance);

  const handleLocationSelect = React.useCallback(async (lat: number, lng: number) => {
    setCustomerLocation([lat, lng]);
    const d = calculateDistance(STORES[selectedStore].location[0], STORES[selectedStore].location[1], lat, lng);
    setDistance(Math.round(d * 10) / 10);

    // Reverse geocoding to fill address
    setIsFetchingAddress(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data.display_name) {
        setFormData(prev => ({ ...prev, address: data.display_name }));
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    } finally {
      setIsFetchingAddress(false);
    }
  }, [selectedStore]);

  const useCurrentLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationSelect(latitude, longitude);
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
        alert("Impossible de récupérer votre position. Veuillez l'indiquer manuellement sur la carte.");
      }
    );
  }, [handleLocationSelect]);

  useEffect(() => {
    useCurrentLocation();
  }, [useCurrentLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (distance === 0) {
      alert("Veuillez sélectionner votre position sur la carte.");
      return;
    }
    setIsSubmitting(true);

    const finalTotal = Math.max(0, total + selectedFee - (appliedVoucher?.amount || 0));

    const orderData = {
      customer_name: formData.name,
      customer_phone: formData.phone,
      customer_address: formData.address,
      remark: formData.remark,
      total_price: finalTotal,
      delivery_fee: selectedFee,
      discount: appliedVoucher?.amount || 0,
      voucher_id: appliedVoucher?.id,
      store_name: STORES[selectedStore].name,
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
        const { id } = await res.json();
        // WhatsApp Message
        const itemsList = cart.map(item => `- ${item.name} x${item.quantity} (${item.price * item.quantity} DA)`).join('\n');
        const message = `*Nouvelle Commande - Chahy Vert*\n\n*Client:* ${formData.name}\n*Tél:* ${formData.phone}\n*Adresse:* ${formData.address}\n\n*Produits:*\n${itemsList}\n\n*Sous-total:* ${total} DA\n*Distance:* ${distance} km\n*Livraison:* ${selectedFee} DA\n${appliedVoucher ? `*Remise:* -${appliedVoucher.amount} DA\n` : ''}*Total:* ${finalTotal} DA\n${formData.remark ? `\n*Remarque:* ${formData.remark}` : ''}`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/213557758296?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        clearCart();
        navigate(`/success?orderId=${id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Une erreur est survenue lors de la commande.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion au serveur.");
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
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Adresse de livraison {isFetchingAddress && <span className="text-green-500 animate-pulse ml-2">(Recherche...)</span>}
            </label>
            <textarea 
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className={cn(
                "w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all min-h-[100px]",
                isFetchingAddress && "opacity-50"
              )}
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

        <div className="bg-white p-6 rounded-3xl border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Localisation sur la carte</label>
            <div className="flex gap-2 items-center">
              {distance > 0 && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black">{distance} km</span>
              )}
              <button 
                type="button"
                onClick={useCurrentLocation}
                className="bg-green-600 text-white p-2 rounded-full shadow-sm hover:bg-green-700 transition-all"
                title="Utiliser ma position actuelle"
              >
                <MapPin size={16} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {(Object.keys(STORES) as Array<keyof typeof STORES>).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedStore(key);
                  setCustomerLocation(null);
                  setDistance(0);
                }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  selectedStore === key ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"
                )}
              >
                {STORES[key].name}
              </button>
            ))}
          </div>
          
          <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-100 mb-4 z-0">
            <MapContainer center={STORES[selectedStore].location} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={STORES[selectedStore].location}>
                <div className="bg-green-600 text-white p-1 rounded-full shadow-lg">Magasin</div>
              </Marker>
              <LocationPicker onLocationSelect={handleLocationSelect} currentPosition={customerLocation} storeLocation={STORES[selectedStore].location} />
            </MapContainer>
          </div>
          
          <p className="text-[10px] text-gray-400 italic">Cliquez sur la carte pour indiquer votre position exacte. Le prix sera calculé depuis notre magasin sélectionné.</p>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">
            {selectedStore === 'SBA' 
              ? "Tarif fixe: 200 DA pour Sidi Bel Abbès." 
              : `Tarif: ${deliveryFee} DA jusqu'à 10km, puis +${deliveryIncrement} DA tous les 5km.`}
          </p>
        </div>

        <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-600">Sous-total</span>
            <span className="font-bold text-green-700">{total} DA</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-600">Livraison</span>
            <span className="font-bold text-green-700">{selectedFee} DA</span>
          </div>
          {appliedVoucher && (
            <div className="flex justify-between items-center mb-2 text-red-600">
              <span>Remise (Bon d'achat)</span>
              <span className="font-bold">-{appliedVoucher.amount} DA</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-green-200">
            <div className="flex items-center gap-3 text-green-700">
              <Package size={20} />
              <span className="font-black text-lg">Total à payer</span>
            </div>
            <span className="text-2xl font-black text-green-700">{Math.max(0, total + selectedFee - (appliedVoucher?.amount || 0))} DA</span>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Bon d'achat (Code)</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={voucherCode}
                onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white border border-green-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 transition-all"
                placeholder="V-XXXXXX"
              />
              <button 
                type="button"
                onClick={checkVoucher}
                disabled={isCheckingVoucher || !voucherCode}
                className="bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:bg-gray-300"
              >
                Appliquer
              </button>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4 opacity-80 text-center">Paiement à la livraison. Vous paierez le livreur une fois votre commande reçue.</p>
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

const Loyalty = () => {
  const { customer, login, logout, refresh } = useCustomer();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const fetchData = async () => {
    if (!customer) return;
    setFetchingData(true);
    try {
      const res = await fetch(`/api/customers/${customer.phone}`);
      const data = await res.json();
      setVouchers(data.vouchers);
      setOrders(data.orders);
      // Removed login(data.customer) to prevent infinite loop
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (customer) {
      fetchData();
    }
  }, [customer.phone]); // Only trigger when phone changes, not every data update

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegistering ? '/api/customers/register' : '/api/customers/login';
      const body = isRegistering ? { name, phone } : { phone };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        login(data);
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const redeemPoints = async () => {
    if (!customer || customer.points < 100) return;
    const pointsToRedeem = Math.floor(customer.points / 100) * 100;
    const expectedAmount = (pointsToRedeem / 100) * 2000;
    
    setRedeeming(true);
    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customer.phone })
      });
      if (res.ok) {
        const newVoucher = await res.json();
        setNotification({
          message: `Félicitations ! Vous avez gagné un bon d'achat de ${newVoucher.amount} DA. Code: ${newVoucher.id}`,
          type: 'success'
        });
        refresh();
        fetchData();
      } else {
        const err = await res.json();
        setNotification({ message: err.error, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erreur de connexion", type: 'error' });
    } finally {
      setRedeeming(false);
      // Clear notification after 10 seconds
      setTimeout(() => setNotification(null), 10000);
    }
  };

  if (!customer) {
    return (
      <div className="pb-32 pt-6 px-4 max-w-md mx-auto">
        <header className="mb-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-2">Espace Client</h1>
          <p className="text-gray-500 text-sm">Connectez-vous pour suivre vos points et profiter de vos récompenses.</p>
        </header>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nom complet</label>
                <input 
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="Votre nom"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
              <input 
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all"
                placeholder="05XX XX XX XX"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-black hover:bg-green-700 transition-all disabled:bg-gray-200"
            >
              {loading ? "Chargement..." : isRegistering ? "S'inscrire" : "Se connecter"}
            </button>
          </form>
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full mt-6 text-sm text-green-600 font-bold hover:underline"
          >
            {isRegistering ? "Déjà un compte ? Se connecter" : "Nouveau ici ? Créer un compte"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-6 px-4 max-w-2xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Bonjour, {customer.name}</h1>
          <p className="text-gray-500 text-sm">{customer.phone}</p>
        </div>
        <button 
          onClick={logout}
          className="p-3 text-gray-400 hover:text-red-500 transition-colors"
          title="Déconnexion"
        >
          <LogOut size={24} />
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-green-700 text-white p-8 rounded-[40px] shadow-xl shadow-green-100 relative overflow-hidden">
          <div className="relative z-10">
            {notification && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mb-4 p-4 rounded-2xl text-xs font-bold",
                  notification.type === 'success' ? "bg-white text-green-700" : "bg-red-500 text-white"
                )}
              >
                {notification.message}
              </motion.div>
            )}
            <p className="text-green-200 text-xs font-black uppercase tracking-widest mb-2">Vos points cumulés</p>
            <h2 className="text-6xl font-black mb-4">{customer.points} <span className="text-2xl opacity-60">pts</span></h2>
            <div className="w-full bg-green-800/50 h-3 rounded-full mb-4 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, customer.points)}%` }}
                className="bg-white h-full rounded-full"
              />
            </div>
            <p className="text-sm text-green-100 italic">
              {customer.points < 100 
                ? `Encore ${100 - customer.points} points pour un bon d'achat de 2000 DA !`
                : "Vous avez assez de points pour un bon d'achat !"}
            </p>
            <p className="text-[10px] text-green-200 mt-2">
              * Les points sont ajoutés une fois la commande marquée comme "Livrée".
            </p>
            {customer.points >= 100 && (
              <button 
                onClick={redeemPoints}
                disabled={redeeming}
                className="mt-6 w-full bg-white text-green-700 py-4 rounded-2xl font-black hover:bg-green-50 transition-all active:scale-95 disabled:bg-green-200"
              >
                {redeeming ? "Conversion..." : `Échanger ${Math.floor(customer.points / 100) * 100} pts contre ${(Math.floor(customer.points / 100) * 100 / 100) * 2000} DA`}
              </button>
            )}
          </div>
          <Star size={120} className="absolute -bottom-10 -right-10 text-white opacity-10 rotate-12" />
        </div>

        <div className="grid grid-cols-1 gap-4">
            <h3 className="font-black text-gray-800 px-2">Règles du programme</h3>
            <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <Package size={20} className="text-green-600" />
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">Chaque <span className="font-black text-green-700">5000 DA</span> dépensés vous rapportent <span className="font-black text-green-700">10 points</span>.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <Star size={20} className="text-green-600" />
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">Atteignez <span className="font-black text-green-700">100 points</span> pour débloquer un bon d'achat de <span className="font-black text-green-700">2000 DA</span>.</p>
            </div>
          </div>

          {vouchers.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-black text-gray-800 px-2">Vos bons d'achat disponibles</h3>
              {vouchers.map(v => (
                <div key={v.id} className="bg-white p-6 rounded-3xl border-2 border-dashed border-green-200 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Bon d'achat</p>
                    <p className="text-2xl font-black text-gray-800">{v.amount} DA</p>
                    <p className="text-xs font-mono text-gray-400 mt-1">{v.id}</p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(v.id);
                      alert("Code copié !");
                    }}
                    className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-green-100 transition-all"
                  >
                    COPIER
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-black text-gray-800 px-2">Historique des commandes</h3>
            {fetchingData ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-[40px] text-center border border-gray-100">
                <Package size={32} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">Aucune commande passée.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Commande #{order.id.toString().slice(-6)}</p>
                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        order.status === 'pending' ? "bg-orange-100 text-orange-600" : 
                        order.status === 'accepted' ? "bg-blue-100 text-blue-600" :
                        order.status === 'delivered' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {order.status === 'pending' ? 'En attente' : 
                         order.status === 'accepted' ? 'Acceptée' :
                         order.status === 'delivered' ? 'Livrée' : 'Refusée'}
                      </span>
                    </div>
                    <div className="space-y-1 mb-4">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-600">{item.name} x{item.quantity}</span>
                          <span className="font-bold">{item.price * item.quantity} DA</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                      <p className="text-xs font-black text-gray-800">Total payé</p>
                      <p className="text-lg font-black text-green-700">{order.total_price} DA</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
    </div>
  );
};

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = new URLSearchParams(location.search).get('orderId');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async () => {
    if (rating === 0) return;
    await fetch(`/api/orders/${orderId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment })
    });
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center pb-24">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircle size={48} className="text-green-600" />
      </motion.div>
      <h2 className="text-2xl font-black text-gray-800 mb-2">Commande Envoyée !</h2>
      <p className="text-gray-500 mb-8 max-w-xs text-sm">Votre commande a été transmise avec succès. Nous vous contacterons bientôt.</p>

      {orderId && !submitted && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 w-full max-w-sm mb-8">
          <h3 className="font-bold text-gray-800 mb-4">Notez notre service</h3>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)}>
                <Star size={32} className={cn(rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-200")} />
              </button>
            ))}
          </div>
          <textarea
            placeholder="Un commentaire ? (optionnel)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm mb-4 min-h-[80px]"
          />
          <button 
            onClick={handleRate}
            disabled={rating === 0}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:bg-gray-200"
          >
            Envoyer ma note
          </button>
        </div>
      )}

      {submitted && (
        <p className="text-green-600 font-bold mb-8">Merci pour votre retour !</p>
      )}

      <button 
        onClick={() => navigate('/')}
        className="bg-gray-100 text-gray-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
      >
        Retour à l'accueil
      </button>
    </div>
  );
};

const Admin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [settings, setSettings] = useState({ delivery_fee: 200, delivery_increment: 50 });
  const [view, setView] = useState<'products' | 'orders' | 'settings' | 'drivers'>('orders');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    stock: 0,
    category: 'Pièces',
    image: 'https://images.unsplash.com/photo-1606728035253-49e8a23146de?auto=format&fit=crop&w=800&q=80'
  });

  const fetchData = () => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
    fetch('/api/orders').then(res => res.json()).then(setOrders);
    fetch('/api/settings').then(res => res.json()).then(setSettings);
    fetch('/api/drivers').then(res => res.json()).then(setDrivers);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleUpdateSettings = async (newSettings: any) => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    setSettings(newSettings);
  };

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

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts(products.filter(p => p.id !== id));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    const addedProduct = await res.json();
    setProducts([...products, addedProduct]);
    setShowAddForm(false);
    setNewProduct({
      name: '',
      price: 0,
      stock: 0,
      category: 'Pièces',
      image: 'https://images.unsplash.com/photo-1606728035253-49e8a23146de?auto=format&fit=crop&w=800&q=80'
    });
  };

  return (
    <div className="pb-32 pt-6 px-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Administration</h1>
          <button 
            onClick={fetchData}
            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
            title="Actualiser"
          >
            <Package size={20} />
          </button>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
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
          <button 
            onClick={() => setView('drivers')}
            className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", view === 'drivers' ? "bg-white text-green-700 shadow-sm" : "text-gray-500")}
          >
            Livreurs
          </button>
          <button 
            onClick={() => setView('settings')}
            className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", view === 'settings' ? "bg-white text-green-700 shadow-sm" : "text-gray-500")}
          >
            Paramètres
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                    {order.store_name && (
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">
                        {order.store_name}
                      </span>
                    )}
                    {order.driver_name && (
                      <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                        <Truck size={10} /> {order.driver_name}
                      </span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase",
                  order.status === 'pending' ? "bg-orange-100 text-orange-600" : 
                  order.status === 'accepted' ? "bg-blue-100 text-blue-600" :
                  order.status === 'delivered' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                  {order.status === 'pending' ? 'En attente' : 
                   order.status === 'accepted' ? 'Acceptée' :
                   order.status === 'delivered' ? 'Livrée' : 'Refusée'}
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
              <div className="flex justify-between items-center mb-4">
                <div className="text-xs text-gray-400">
                  <p className="font-bold text-gray-600">{order.customer_phone}</p>
                  <p>{order.customer_address}</p>
                  {order.remark && (
                    <p className="mt-2 text-orange-600 font-bold bg-orange-50 p-2 rounded-lg border border-orange-100">
                      Note: {order.remark}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-xl font-black text-green-700">{order.total_price} DA</p>
                  {order.rating && (
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-black text-gray-800">{order.rating}/5</span>
                    </div>
                  )}
                </div>
              </div>
              
              {order.status !== 'delivered' && order.status !== 'refused' && (
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      const res = await fetch(`/api/orders/${order.id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'delivered' })
                      });
                      if (res.ok) fetchData();
                    }}
                    className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-green-700 transition-all"
                  >
                    Marquer comme Livrée
                  </button>
                  <button 
                    onClick={async () => {
                      const res = await fetch(`/api/orders/${order.id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'refused' })
                      });
                      if (res.ok) fetchData();
                    }}
                    className="px-4 bg-red-50 text-red-600 py-3 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all"
                  >
                    Refuser
                  </button>
                </div>
              )}
              {order.rating_comment && (
                <div className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 italic text-xs text-gray-500">
                  "{order.rating_comment}"
                </div>
              )}
            </div>
          ))}
        </div>
      ) : view === 'products' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Gestion des produits</h2>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-green-700 transition-all"
            >
              {showAddForm ? <Minus size={18} /> : <Plus size={18} />}
              {showAddForm ? "Annuler" : "Nouveau produit"}
            </button>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddProduct}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nom du produit</label>
                    <input 
                      required
                      type="text"
                      value={newProduct.name}
                      onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm"
                      placeholder="Ex: Poulet entier"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Catégorie</label>
                    <select 
                      value={newProduct.category}
                      onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm"
                    >
                      <option value="Volailles">Volailles</option>
                      <option value="Pièces">Pièces</option>
                      <option value="Mariné">Mariné</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Prix (DA)</label>
                    <input 
                      required
                      type="number"
                      value={newProduct.price}
                      onChange={e => setNewProduct({ ...newProduct, price: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Stock initial</label>
                    <input 
                      required
                      type="number"
                      value={newProduct.stock}
                      onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">URL de l'image</label>
                  <input 
                    required
                    type="text"
                    value={newProduct.image}
                    onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm"
                  />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all">
                  Ajouter le produit
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex gap-4 items-center group">
                <div className="relative">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className={cn("w-16 h-16 rounded-2xl object-cover", product.stock <= 0 && "grayscale opacity-50")} 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80") {
                        target.src = "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80";
                      }
                    }}
                  />
                  {product.stock <= 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
                      Rupture
                    </span>
                  )}
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="absolute -top-2 -left-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
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
                  <div className="mt-2 flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">URL Image</span>
                    <input 
                      type="text"
                      value={product.image}
                      onChange={(e) => handleUpdateProduct(product.id, { image: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-[10px] text-gray-500 truncate"
                      placeholder="Lien de l'image"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : view === 'drivers' ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Liste des livreurs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {drivers.map(d => (
              <div key={d.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-black text-gray-800">{d.name}</p>
                  <p className="text-sm text-green-600 font-bold">{d.phone}</p>
                </div>
                <div className="text-right">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    {d.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Inscrit le {new Date(d.id).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          {drivers.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-bold">Aucun livreur inscrit pour le moment.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-md mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Settings size={20} className="text-green-600" />
            Paramètres de livraison
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Frais de base (jusqu'à 10km)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={settings.delivery_fee}
                  onChange={e => handleUpdateSettings({ ...settings, delivery_fee: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all font-bold text-green-700"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">DA</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Incrément (tous les 5km supplémentaires)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={settings.delivery_increment || 50}
                  onChange={e => handleUpdateSettings({ ...settings, delivery_increment: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all font-bold text-green-700"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">DA</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 italic">Exemple: {settings.delivery_fee} DA pour 10km, puis +{settings.delivery_increment || 50} DA tous les 5km.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Delivery = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'current' | 'history'>('new');
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [driver, setDriver] = useState<Driver | null>(() => {
    const saved = localStorage.getItem('chahy_driver');
    return saved ? JSON.parse(saved) : null;
  });
  const [showLogin, setShowLogin] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [isReg, setIsReg] = useState(false);

  const fetchOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
        
        // Notification logic
        const pendingCount = data.filter((o: Order) => o.status === 'pending').length;
        if (pendingCount > lastOrderCount) {
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
          } catch (e) {}
        }
        setLastOrderCount(pendingCount);
      });
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [lastOrderCount]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/drivers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone })
      });
      if (res.ok) {
        const data = await res.json();
        setDriver(data);
        localStorage.setItem('chahy_driver', JSON.stringify(data));
      } else {
        alert('Livreur non trouvé. Veuillez vous inscrire.');
        setIsReg(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, phone: regPhone })
      });
      if (res.ok) {
        const data = await res.json();
        setDriver(data);
        localStorage.setItem('chahy_driver', JSON.stringify(data));
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: number, status: Order['status']) => {
    if (!driver) return;
    
    try {
      // Assign driver if accepting
      if (status === 'accepted') {
        const assignRes = await fetch(`/api/orders/${id}/assign`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driver_id: driver.id })
        });
        if (!assignRes.ok) throw new Error("Erreur d'assignation");
      }

      const statusRes = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!statusRes.ok) throw new Error("Erreur de mise à jour du statut");
      
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la mise à jour.");
    }
  };

  const openMaps = (address: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'new') return o.status === 'pending';
    if (activeTab === 'current') return o.status === 'accepted' && o.driver_id === driver?.id;
    return (o.status === 'delivered' || o.status === 'refused') && o.driver_id === driver?.id;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8">
          <Truck size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{isReg ? 'Inscription Livreur' : 'Connexion Livreur'}</h2>
        
        {isReg ? (
          <form onSubmit={handleRegister} className="w-full max-w-xs space-y-4">
            <input 
              required
              type="text"
              value={regName}
              onChange={e => setRegName(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="Nom complet"
            />
            <input 
              required
              type="tel"
              value={regPhone}
              onChange={e => setRegPhone(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="Numéro de téléphone"
            />
            <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all">
              S'inscrire
            </button>
            <button type="button" onClick={() => setIsReg(false)} className="w-full text-gray-500 text-sm font-bold">
              Déjà inscrit ? Se connecter
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
            <input 
              required
              type="tel"
              value={loginPhone}
              onChange={e => setLoginPhone(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="Numéro de téléphone"
            />
            <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all">
              Se connecter
            </button>
            <button type="button" onClick={() => setIsReg(true)} className="w-full text-gray-500 text-sm font-bold">
              Pas encore inscrit ? Créer un compte
            </button>
          </form>
        )}
      </div>
    );
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium">Chargement des livraisons...</p>
    </div>
  );

  return (
    <div className="pb-32 pt-6 px-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Espace Livreur</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Bonjour, {driver.name}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              localStorage.removeItem('chahy_driver');
              setDriver(null);
            }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Déconnexion"
          >
            <LogOut size={24} />
          </button>
          <button 
            onClick={fetchOrders}
            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all relative"
          >
            <Bell size={24} />
            {lastOrderCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {lastOrderCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
        <button 
          onClick={() => setActiveTab('new')}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            activeTab === 'new' ? "bg-white text-green-600 shadow-sm" : "text-gray-500"
          )}
        >
          <Clock size={16} /> Nouveaux
        </button>
        <button 
          onClick={() => setActiveTab('current')}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            activeTab === 'current' ? "bg-white text-green-600 shadow-sm" : "text-gray-500"
          )}
        >
          <Truck size={16} /> En cours
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            activeTab === 'history' ? "bg-white text-green-600 shadow-sm" : "text-gray-500"
          )}
        >
          <History size={16} /> Historique
        </button>
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Package size={32} className="text-gray-200" />
          </div>
          <p className="text-gray-400 font-bold">Aucune commande ici.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map(order => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={order.id} 
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500">
                {order.status === 'pending' && "En attente"}
                {order.status === 'accepted' && "Acceptée"}
                {order.status === 'delivered' && "Livrée"}
                {order.status === 'refused' && "Refusée"}
              </div>

              <div className="flex justify-between items-start mb-6 pt-2">
                <div>
                  <h3 className="font-black text-xl text-gray-800">{order.customer_name}</h3>
                  <div className="flex items-center gap-2 text-green-600 font-bold mt-1">
                    <Phone size={16} />
                    <a href={`tel:${order.customer_phone}`} className="hover:underline">{order.customer_phone}</a>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total</p>
                  <p className="text-2xl font-black text-green-700">{order.total_price} DA</p>
                  <p className="text-[10px] text-green-600 font-bold mt-1">Livraison: {order.delivery_fee} DA</p>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-3xl mb-6 flex gap-4 items-start border border-gray-100">
                <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin className="text-red-500" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700 leading-relaxed">{order.customer_address}</p>
                  <button 
                    onClick={() => openMaps(order.customer_address)}
                    className="text-blue-600 text-xs font-black mt-3 flex items-center gap-1 uppercase tracking-wider hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all w-fit"
                  >
                    Itinéraire <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {order.remark && (
                <div className="mb-6 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-xs text-amber-700 italic">
                    <span className="font-bold not-italic uppercase text-[10px] mr-2">Note:</span>
                    {order.remark}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {order.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateStatus(order.id, 'accepted')}
                      className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-100"
                    >
                      <CheckCircle size={20} /> Accepter
                    </button>
                    <button 
                      onClick={() => updateStatus(order.id, 'refused')}
                      className="bg-red-50 text-red-600 px-6 rounded-2xl font-black flex items-center justify-center hover:bg-red-100 transition-all"
                    >
                      <XCircle size={20} />
                    </button>
                  </>
                )}
                {order.status === 'accepted' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'delivered')}
                    className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-100"
                  >
                    <CheckCircle size={20} /> Terminer la livraison
                  </button>
                )}
                {(order.status === 'delivered' || order.status === 'refused') && (
                  <div className="flex-1 py-3 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                    Commande traitée le {new Date(order.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <CustomerProvider>
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
              <Route path="/loyalty" element={<Loyalty />} />
            </Routes>
            <Navbar />
          </div>
        </Router>
      </CartProvider>
    </CustomerProvider>
  );
}
