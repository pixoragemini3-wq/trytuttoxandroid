
import React from 'react';

interface ProductPickCardProps {
  title: string;
  productName: string;
  price: string;
  store: string;
  imageUrl: string;
  isEditorsChoice?: boolean;
}

const ProductPickCard: React.FC<ProductPickCardProps> = ({ title, productName, price, store, imageUrl, isEditorsChoice }) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 py-10 border-b border-dashed border-gray-200 group">
      <div className="w-full md:w-1/4 h-48 bg-gray-50 rounded-xl overflow-hidden p-4">
        <img src={imageUrl} alt={productName} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
      </div>
      
      <div className="flex-1">
        {isEditorsChoice && (
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-editorial-red text-white p-1 rounded">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.827a1 1 0 00-1.788 0L7.123 5.39a1 1 0 01-.758.551l-2.83.411a1 1 0 00-.551 1.706l2.047 1.996a1 1 0 01.287.885l-.483 2.819a1 1 0 001.451 1.054L8.83 13.49a1 1 0 01.939 0l2.525 1.327a1 1 0 001.451-1.054l-.483-2.819a1 1 0 01.287-.885l2.047-1.996a1 1 0 00-.551-1.706l-2.83-.411a1 1 0 01-.758-.551l-1.486-2.563z" /></svg>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-gray-900">Editors' Choice</span>
          </div>
        )}
        <h3 className="font-condensed text-2xl font-black uppercase mb-1 leading-tight">{title}</h3>
        <p className="text-sm font-medium text-gray-500 mb-4">{productName}</p>
        <button className="text-xs font-black uppercase tracking-tighter text-gray-900 flex items-center gap-1 group-hover:text-editorial-red">
          Jump to details <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3">
        <button className="w-full md:w-56 bg-[#c0ff8c] text-gray-900 py-3 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-[#a6e076] transition-all shadow-sm">
          {price} at {store}
        </button>
      </div>
    </div>
  );
};

export default ProductPickCard;
