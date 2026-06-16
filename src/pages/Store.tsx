import { useEffect, useState } from 'react';
import { Leaf, ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { useStoreStore } from '@/stores/store';
import { useAuthStore } from '@/stores/auth';

const categoryLabels: Record<string, string> = {
  fertilizer: '有机肥',
  plant: '绿植',
};

const categoryGradients: Record<string, string> = {
  fertilizer: 'from-amber-400 to-amber-600',
  plant: 'from-compost-light to-compost-green',
};

const categoryIcons: Record<string, string> = {
  fertilizer: '🧪',
  plant: '🌿',
};

export default function Store() {
  const { products, fetchProducts, exchange, loading } = useStoreStore();
  const { user } = useAuthStore();
  const [category, setCategory] = useState<'fertilizer' | 'plant' | ''>('');
  const [showExchange, setShowExchange] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    fetchProducts(category ? { category } : undefined);
  }, [category]);

  const selectedProduct = products.find((p) => p.id === showExchange);
  const totalPoints = (selectedProduct?.pointsPrice ?? 0) * quantity;

  const handleExchange = async () => {
    if (!showExchange) return;
    setExchanging(true);
    try {
      await exchange(showExchange, quantity);
      setShowExchange(null);
      setQuantity(1);
    } finally {
      setExchanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-serif font-bold text-[#1B4332]">积分商城</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            category === '' ? 'bg-[#2D6A4F] text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setCategory('fertilizer')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            category === 'fertilizer' ? 'bg-[#2D6A4F] text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          有机肥
        </button>
        <button
          onClick={() => setCategory('plant')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            category === 'plant' ? 'bg-[#2D6A4F] text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          绿植
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className={`h-36 bg-gradient-to-br ${categoryGradients[product.category] ?? 'from-gray-300 to-gray-400'} flex items-center justify-center`}>
              <span className="text-4xl">{categoryIcons[product.category] ?? '📦'}</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-[#1B4332] mb-1">{product.name}</h3>
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-compost-green font-bold text-sm">
                  <Leaf className="w-3.5 h-3.5" />
                  {product.pointsPrice} 积分
                </div>
                <span className="text-xs text-gray-400">库存 {product.stock}</span>
              </div>
              <button
                onClick={() => { setShowExchange(product.id); setQuantity(1); }}
                disabled={product.stock <= 0}
                className="mt-3 w-full py-2 rounded-lg bg-[#2D6A4F] text-white text-sm hover:bg-[#245a42] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {product.stock <= 0 ? '已售罄' : '兑换'}
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && !loading && (
          <div className="col-span-3 text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">暂无商品</p>
          </div>
        )}
      </div>

      {showExchange && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#1B4332]">确认兑换</h2>
              <button onClick={() => setShowExchange(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <span className="text-3xl">{categoryIcons[selectedProduct.category]}</span>
                <p className="font-semibold text-[#1B4332] mt-2">{selectedProduct.name}</p>
                <p className="text-xs text-gray-400">{selectedProduct.description}</p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-compost-green"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-compost-green"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-compost-pale/30">
                <span className="text-sm text-gray-600">所需积分</span>
                <span className="flex items-center gap-1 font-bold text-compost-green">
                  <Leaf className="w-4 h-4" />
                  {totalPoints}
                </span>
              </div>
              {user && user.points !== undefined && totalPoints > user.points && (
                <p className="text-xs text-red-500 text-center">积分不足，当前积分 {user.points}</p>
              )}
              <button
                onClick={handleExchange}
                disabled={exchanging || (user?.points !== undefined && totalPoints > (user.points ?? 0))}
                className="w-full py-2.5 rounded-lg bg-[#2D6A4F] text-white font-medium hover:bg-[#245a42] disabled:opacity-50 transition-colors"
              >
                {exchanging ? '兑换中...' : '确认兑换'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
