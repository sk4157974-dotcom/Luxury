import React, { useState, useRef } from 'react';
import { Search, Star, Plus, Check, Leaf, Flame, Sparkles, X, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { RESTAURANT_CONFIG } from '../config/restaurant';
import { MenuItem, MenuCategoryType } from '../types';
import { useCart } from '../context/CartContext';

interface DigitalMenuProps {
  selectedCategory: MenuCategoryType | 'All';
  onCategoryChange: (cat: MenuCategoryType | 'All') => void;
}

export const DigitalMenu: React.FC<DigitalMenuProps> = ({
  selectedCategory,
  onCategoryChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [spicyOnly, setSpicyOnly] = useState(false);
  const [selectedDishDetail, setSelectedDishDetail] = useState<MenuItem | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const categoryRowRef = useRef<HTMLDivElement>(null);

  const { addToCart } = useCart();

  const handleCategorySelect = (cat: MenuCategoryType | 'All', e: React.MouseEvent<HTMLButtonElement>) => {
    onCategoryChange(cat);
    const btn = e.currentTarget;
    const container = categoryRowRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const currentScroll = container.scrollLeft;
      const diff = (btnRect.left + btnRect.width / 2) - (containerRect.left + containerRect.width / 2);
      container.scrollTo({
        left: currentScroll + diff,
        behavior: 'smooth'
      });
    }
  };

  const categories: (MenuCategoryType | 'All')[] = [
    'All',
    'Starters',
    'Main Course',
    'Chef Specials',
    'Pizza',
    'Desserts',
    'Beverages'
  ];

  // Filtering
  const filteredMenu = RESTAURANT_CONFIG.menu.filter((dish) => {
    // Category check
    if (selectedCategory !== 'All' && dish.category !== selectedCategory) {
      return false;
    }
    // Veg toggle
    if (vegOnly && !dish.isVegetarian) {
      return false;
    }
    // Spicy toggle
    if (spicyOnly && !dish.isSpicy) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = dish.name.toLowerCase().includes(q);
      const matchDesc = dish.description.toLowerCase().includes(q);
      const matchIng = dish.ingredients?.some((ing) => ing.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchIng) {
        return false;
      }
    }
    return true;
  });

  const handleAdd = (dish: MenuItem) => {
    addToCart(dish, 1);
    setRecentlyAddedId(dish.id);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1500);
  };

  return (
    <motion.section
      id="menu"
      className="py-16 sm:py-24 bg-[#F7F3EC] relative border-t border-[#E8DEC8]"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] uppercase font-sans-modern tracking-[0.25em] text-[#C48B46] font-semibold block mb-2">
            COMPLETE MENU
          </span>

          <h2
            id="digital-menu-title"
            className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-normal text-[#1F1A17] tracking-tight uppercase"
          >
            Digital Restaurant Menu
          </h2>
          <p className="text-sm sm:text-base text-[#685D56] font-sans-modern mt-2">
            Indulge in our complete repertoire of fine artisanal cuisine, hand-rolled pasta, wood-fired pizzas, and handcrafted elixirs.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-[#E8DEC8] rounded-2xl p-4 sm:p-6 mb-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#C48B46] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dishes or ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="menu-search-input"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#FAF7F2] border border-[#E8DEC8] text-sm text-[#1F1A17] placeholder-[#8C7D73] focus:outline-none focus:border-[#C48B46] transition-colors glow-on-hover"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C7D73] hover:text-[#1F1A17]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dietary Toggle Pills */}
            <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-start md:justify-end flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setVegOnly(!vegOnly)}
                id="toggle-veg-filter"
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer glow-on-hover pop-forward-sm whitespace-nowrap ${
                  vegOnly
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#FAF7F2] text-[#685D56] border border-[#E8DEC8] hover:border-emerald-500 hover:text-emerald-700'
                }`}
              >
                <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                <span>Vegetarian Only</span>
              </button>

              <button
                type="button"
                onClick={() => setSpicyOnly(!spicyOnly)}
                id="toggle-spicy-filter"
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer glow-on-hover pop-forward-sm whitespace-nowrap ${
                  spicyOnly
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-[#FAF7F2] text-[#685D56] border border-[#E8DEC8] hover:border-rose-500 hover:text-rose-700'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Spicy Only</span>
              </button>
            </div>
          </div>

          {/* Categories Tab Row */}
          <div
            ref={categoryRowRef}
            className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none snap-x scroll-smooth"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={(e) => handleCategorySelect(cat, e)}
                id={`menu-cat-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.16em] whitespace-nowrap transition-all duration-200 cursor-pointer snap-center glow-on-hover pop-forward-sm ${
                  selectedCategory === cat
                    ? 'bg-[#C48B46] text-white font-semibold shadow-sm'
                    : 'bg-[#FAF7F2] text-[#685D56] hover:text-[#1F1A17] border border-[#E8DEC8] hover:border-[#C48B46]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6 px-1 text-xs text-[#8C7D73] tracking-wider">
          <span>Showing {filteredMenu.length} dishes</span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => onCategoryChange('All')}
              className="text-[#C48B46] hover:underline font-medium cursor-pointer"
            >
              Reset category filter
            </button>
          )}
        </div>

        {/* Menu Items Grid */}
        {filteredMenu.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#E8DEC8] shadow-sm max-w-xl mx-auto my-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#B6732E] mb-3">
              <Search className="w-6 h-6 text-[#B6732E]" />
            </div>

            <h3 className="font-serif-luxury text-2xl sm:text-3xl text-[#1F1A17] font-bold mb-2">
              Sorry, this item is not available for now
            </h3>

            <p className="text-xs sm:text-sm text-[#685D56] font-sans-modern mb-5 max-w-md mx-auto">
              We couldn&apos;t find any dishes matching &ldquo;{searchQuery}&rdquo;. Try exploring our guests&apos; most popular selections:
            </p>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {['Pasta', 'Chicken Shawarma', 'Fish Curry', 'French Fries', 'Wood-Fired Pizza', 'Grilled Salmon'].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSearchQuery(item);
                      onCategoryChange('All');
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#FAF5EE] hover:bg-[#F0E4D2] border border-[#E5A645]/40 text-[#8C5D19] text-xs font-semibold transition-all cursor-pointer glow-on-hover"
                  >
                    ✦ {item}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setVegOnly(false);
                setSpicyOnly(false);
                onCategoryChange('All');
              }}
              className="px-6 py-2.5 rounded-full bg-[#C48B46] hover:bg-[#B6732E] text-white text-xs font-bold uppercase tracking-wider glow-on-hover cursor-pointer pop-forward-sm shadow-sm"
            >
              Reset Search & Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredMenu.map((dish, idx) => {
              const isAdded = recentlyAddedId === dish.id;

              return (
                <motion.div
                  key={dish.id}
                  id={`menu-dish-${dish.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.45, delay: (idx % 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="pop-card-wrapper relative group flex flex-col justify-between cursor-pointer"
                >
                  {/* Solid 100% Opaque White Card Face with direct 3D 4-corner theme warm gold light on its own square */}
                  <div className="card-solid-face relative z-10 w-full h-full bg-white rounded-3xl border border-[#E8DEC8] flex flex-col justify-between transition-all duration-300 overflow-hidden shadow-xs hover:shadow-xl">
                    <div>
                      {/* Dish Image */}
                      <div className="relative aspect-[16/10] overflow-hidden rounded-t-3xl bg-[#F5EFEB]">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          loading="lazy"
                          className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-106"
                        />

                        {/* Dietary Badges */}
                        <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                          {dish.isVegetarian && (
                            <span className="w-6 h-6 rounded-full bg-white/90 border border-emerald-500/50 flex items-center justify-center text-emerald-600 shadow-sm" title="Vegetarian">
                              <Leaf className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {dish.isSpicy && (
                            <span className="w-6 h-6 rounded-full bg-white/90 border border-rose-500/50 flex items-center justify-center text-rose-600 shadow-sm" title="Spicy">
                              <Flame className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        {/* Detail modal trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDishDetail(dish);
                          }}
                          type="button"
                          aria-label={`View ingredients and details for ${dish.name}`}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 border border-[#E8DEC8] text-[#685D56] hover:text-[#C48B46] hover:border-[#C48B46] transition-colors shadow-sm cursor-pointer glow-on-hover"
                          title="View details and ingredients"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-5 sm:p-6 bg-white">
                        {/* 5-Star Reviews (Exact match with top Popular Dishes section) */}
                        <div className="flex items-center space-x-1 text-[#F5A623] mb-2">
                          {Array.from({ length: 5 }).map((_, starIndex) => (
                            <Star
                              key={starIndex}
                              className={`w-3.5 h-3.5 ${
                                starIndex < Math.round(dish.rating)
                                  ? 'fill-[#F5A623] text-[#F5A623]'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-[#1F1A17] ml-1">{dish.rating.toFixed(1)}</span>
                          <span className="text-[11px] text-[#8C7D73]">({dish.reviewsCount})</span>
                          <span className="text-[10px] text-[#C48B46] ml-auto font-bold uppercase tracking-widest">{dish.category}</span>
                        </div>

                        <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1F1A17] group-hover:text-[#C48B46] transition-colors duration-200 mb-1.5 line-clamp-1">
                          {dish.name}
                        </h3>

                        <p className="text-xs text-[#685D56] leading-relaxed line-clamp-2 mb-2 font-sans-modern">
                          {dish.description}
                        </p>
                      </div>
                    </div>

                    {/* Card Bottom: Price & Add */}
                    <div className="px-5 pb-5 pt-3 border-t border-[#F0EAE1] flex items-center justify-between bg-white">
                      <span className="font-serif-luxury text-2xl font-bold text-[#1F1A17]">
                        {RESTAURANT_CONFIG.currency.symbol}{dish.price.toFixed(2)}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdd(dish);
                        }}
                        id={`menu-add-btn-${dish.id}`}
                        type="button"
                        className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 transition-all duration-200 cursor-pointer glow-on-hover lighting-beam-sweep ${
                          isAdded
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-[#C48B46] hover:bg-[#B6732E] text-white shadow-[#C48B46]/20'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Order Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Dish Detail Lightbox / Modal */}
        {selectedDishDetail && (
          <div
            id="dish-detail-modal"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedDishDetail(null)}
          >
            <div
              className="relative max-w-lg w-full bg-white border border-[#E8DEC8] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedDishDetail(null)}
                aria-label="Close dish detail modal"
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 text-[#1F1A17] hover:text-[#C48B46] transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="aspect-[16/10] overflow-hidden bg-[#F5EFEB] relative">
                <img
                  src={selectedDishDetail.image}
                  alt={selectedDishDetail.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest text-[#C48B46] font-semibold">
                    {selectedDishDetail.category}
                  </span>
                  <div className="flex items-center space-x-1 text-[#C48B46]">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold text-[#1F1A17]">{selectedDishDetail.rating}</span>
                  </div>
                </div>

                <h3 className="font-serif-luxury text-2xl font-bold text-[#1F1A17] mb-2">
                  {selectedDishDetail.name}
                </h3>

                <p className="text-sm text-[#685D56] leading-relaxed mb-4">
                  {selectedDishDetail.description}
                </p>

                {selectedDishDetail.ingredients && selectedDishDetail.ingredients.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-[#1F1A17] uppercase tracking-wider mb-2">
                      Ingredients & Sourcing
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDishDetail.ingredients.map((ing) => (
                        <span
                          key={ing}
                          className="px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DEC8] text-xs text-[#685D56]"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#E8DEC8]">
                  <span className="font-serif-luxury text-3xl font-bold text-[#1F1A17]">
                    {RESTAURANT_CONFIG.currency.symbol}{selectedDishDetail.price.toFixed(2)}
                  </span>

                  <button
                    onClick={() => {
                      handleAdd(selectedDishDetail);
                      setSelectedDishDetail(null);
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#C48B46] hover:bg-[#B6732E] text-white text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 shadow-md shadow-[#C48B46]/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Order</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </motion.section>
  );
};
