// server.js - Complete Express server with all tasks implemented

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Task 4: Custom Error Classes
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = 401;
  }
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Task 3: Middleware Implementation

// 1. Custom logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 2. JSON body parser middleware
app.use(bodyParser.json());

// 3. Authentication middleware 

const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== 'secret-api-key') {
    throw new AuthError('Invalid or missing API key');
  }
  next();
};

// 4. Validation middleware
const validateProduct = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const { name, price } = req.body;
    if (!name || !price) {
      throw new ValidationError('Name and price are required');
    }
    if (typeof price !== 'number' || price <= 0) {
      throw new ValidationError('Price must be a positive number');
    }
  }
  next();
};

// Task 4: Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      name: err.name,
      message: err.message,
      status: statusCode
    }
  });
});

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// Task 5: Advanced Features

// GET /api/products - Get all products with filtering, search, and pagination
app.get('/api/products', (req, res, next) => {
  try {
    // Filtering by category
    let filteredProducts = [...products];
    if (req.query.category) {
      filteredProducts = filteredProducts.filter(
        p => p.category.toLowerCase() === req.query.category.toLowerCase()
      );
    }

    // Search by name
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        p => p.name.toLowerCase().includes(searchTerm)
      );
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    res.json({
      total: filteredProducts.length,
      page,
      pages: Math.ceil(filteredProducts.length / limit),
      products: paginatedProducts
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/stats - Product statistics
app.get('/api/products/stats', (req, res, next) => {
  try {
    const stats = {
      totalProducts: products.length,
      inStock: products.filter(p => p.inStock).length,
      categories: {}
    };

    products.forEach(product => {
      if (!stats.categories[product.category]) {
        stats.categories[product.category] = 0;
      }
      stats.categories[product.category]++;
    });

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id - Get a specific product
app.get('/api/products/:id', (req, res, next) => {
  try {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// POST /api/products - Create a new product
app.post('/api/products', validateProduct, (req, res, next) => {
  try {
    const newProduct = {
      id: uuidv4(),
      name: req.body.name,
      description: req.body.description || '',
      price: req.body.price,
      category: req.body.category || 'uncategorized',
      inStock: req.body.inStock !== undefined ? req.body.inStock : true
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id - Update a product
app.put('/api/products/:id', validateProduct, (req, res, next) => {
  try {
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    Object.assign(product, {
      name: req.body.name || product.name,
      description: req.body.description || product.description,
      price: req.body.price || product.price,
      category: req.body.category || product.category,
      inStock: req.body.inStock !== undefined ? req.body.inStock : product.inStock
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', (req, res, next) => {
  try {
    const productExists = products.some(p => p.id === req.params.id);
    
    if (!productExists) {
      throw new NotFoundError('Product not found');
    }

    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app;