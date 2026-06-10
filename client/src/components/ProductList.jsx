import React, { useState, useEffect, useContext, useRef } from 'react';
import { api } from '../config/api';
import { CartContext } from '../context/CartContext.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSort } from '@fortawesome/free-solid-svg-icons';

const ProductList = () => {
  const { addToCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortOption, setSortOption] = useState('name'); // Default sort by name
  const quantityRefs = useRef({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.products.getAll();
        setProducts(res.data.data);
        setFilteredProducts(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'date-new':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-old':
          return new Date(a.createdAt) - new Date(b.createdAt);
        default:
          return 0;
      }
    });
    
    setFilteredProducts(result);
  }, [searchTerm, products, sortOption]);

  const handleAddToCart = (product) => {
    const quantity = parseInt(quantityRefs.current[product._id]?.value) || 1;
    addToCart(product, quantity);
  };

  return (
    <div className="bg-white border border-sm rounded-lg shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 p-2 bg-green-100">
        <div>
          <h2 className="text-xl font-bold">Products</h2>
          <p className="text-sm text-gray-600">Add products to customer cart</p>
        </div>
        <div className="relative">
          <select 
            className="appearance-none bg-gray-200 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="date-new">Date: Newest First</option>
            <option value="date-old">Date: Oldest First</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <FontAwesomeIcon icon={faSort} />
          </div>
        </div>
      </div>
      <div className="mb-4 p-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        {filteredProducts.map((product, index) => (
          <div key={product._id} className="flex items-center justify-between border-b py-3">
            <div className="flex items-center">
              <span className="mr-4 text-gray-500">{index + 1}</span>
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-500">Price: ₵{product.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-semibold">₵ {product.price.toFixed(2)}</span>
              <input 
                type="number" 
                min="1" 
                defaultValue="1" 
                ref={(el) => (quantityRefs.current[product._id] = el)}
                className="w-16 px-2 py-1 border rounded" 
              />
              <button 
                onClick={() => handleAddToCart(product)}
                className="text-blue-500 font-semibold"
              >
                ADD
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;