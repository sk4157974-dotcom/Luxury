import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { RESTAURANT_CONFIG, buildOrderWhatsAppUrl } from '../config/restaurant';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice
  } = useCart();

  if (!isOpen) return null;

  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;

    const orderPayload = items.map((i) => ({
      name: i.dish.name,
      quantity: i.quantity,
      price: i.dish.price
    }));

    const whatsappUrl = buildOrderWhatsAppUrl(orderPayload, totalPrice);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="cart-drawer-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end transition-opacity duration-300 animate-in fade-in"
      onClick={closeCart}
    >
      <div
        id="cart-drawer-panel"
        className="w-full max-w-md bg-white border-l border-[#E8DEC8] h-full flex flex-col justify-between p-6 sm:p-8 shadow-2xl animate-in slide-in-from-right duration-300 text-[#1F1A17]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-[#FAF7F2] text-[#C48B46] border border-[#E8DEC8]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-2xl font-bold text-[#1F1A17]">
                Your Dining Bag
              </h3>
              <p className="text-xs text-[#685D56] tracking-wider">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>

          <button
            onClick={closeCart}
            id="close-cart-btn"
            type="button"
            aria-label="Close cart"
            className="p-2 text-[#685D56] hover:text-[#1F1A17] transition-colors rounded-full hover:bg-[#FAF7F2] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full border border-dashed border-[#C48B46]/40 flex items-center justify-center text-[#C48B46] mb-4">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h4 className="font-serif-luxury text-xl font-bold text-[#1F1A17] mb-2">
                Your cart is empty
              </h4>
              <p className="text-xs text-[#685D56] font-sans-modern max-w-xs mb-6">
                Discover our artisanal courses, wood-fired pizzas, and chef specialties to craft your order.
              </p>
              <button
                onClick={closeCart}
                className="px-6 py-2.5 rounded-full bg-[#C48B46] text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-[#B6732E] transition-colors cursor-pointer"
              >
                Browse Our Menu
              </button>
            </div>
          ) : (
            items.map(({ dish, quantity }) => (
              <div
                key={dish.id}
                id={`cart-item-${dish.id}`}
                className="bg-[#FAF7F2] rounded-xl p-3 sm:p-4 border border-[#E8DEC8] flex items-center justify-between space-x-3 transition-colors hover:border-[#C48B46]/40 shadow-sm"
              >
                {/* Dish Thumbnail */}
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />

                {/* Dish Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif-luxury text-base font-semibold text-[#1F1A17] truncate">
                    {dish.name}
                  </h4>
                  <div className="text-xs text-[#C48B46] font-semibold mt-0.5">
                    {RESTAURANT_CONFIG.currency.symbol}{dish.price.toFixed(2)} each
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-2.5 mt-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(dish.id, quantity - 1)}
                      aria-label="Decrease quantity"
                      className="w-6 h-6 rounded-full bg-white border border-[#E8DEC8] text-[#1F1A17] hover:border-[#C48B46] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-[#1F1A17] w-4 text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(dish.id, quantity + 1)}
                      aria-label="Increase quantity"
                      className="w-6 h-6 rounded-full bg-white border border-[#E8DEC8] text-[#1F1A17] hover:border-[#C48B46] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Line Total & Remove */}
                <div className="flex flex-col items-end justify-between self-stretch">
                  <button
                    type="button"
                    onClick={() => removeFromCart(dish.id)}
                    aria-label={`Remove ${dish.name} from cart`}
                    className="text-[#8C7D73] hover:text-rose-600 p-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <span className="font-serif-luxury text-base font-bold text-[#1F1A17]">
                    {RESTAURANT_CONFIG.currency.symbol}{(dish.price * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & WhatsApp Ordering */}
        {items.length > 0 && (
          <div className="border-t border-[#E8DEC8] pt-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-[#685D56]">
              <span>Items Total ({totalItems})</span>
              <span className="font-semibold text-[#1F1A17]">{RESTAURANT_CONFIG.currency.symbol}{totalPrice.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-base font-serif-luxury font-bold text-[#1F1A17] border-t border-[#E8DEC8] pt-2">
              <span className="text-lg">Order Total</span>
              <span className="text-2xl text-[#C48B46]">
                {RESTAURANT_CONFIG.currency.symbol}{totalPrice.toFixed(2)}
              </span>
            </div>

            {/* Order via WhatsApp Button */}
            <button
              onClick={handleWhatsAppOrder}
              id="order-via-whatsapp-btn"
              type="button"
              className="w-full py-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-[0.18em] flex items-center justify-center space-x-2.5 shadow-lg shadow-[#25D366]/20 active:scale-98 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Order via WhatsApp</span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-[#8C7D73]">
              <span>Direct to: {RESTAURANT_CONFIG.contact.phoneFormatted}</span>
              <button
                onClick={clearCart}
                className="hover:text-rose-600 transition-colors cursor-pointer font-medium"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
