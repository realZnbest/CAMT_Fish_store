# ABYSS / FISH HOUSE

A PHP + MySQL storefront demo built for MAMP. The app includes a storefront, product detail pages, login/register flows, cart management, and checkout processing for a fish-themed online shop.

## Features

- Product catalog with pricing and descriptions
- Product detail page
- Cart and quantity management
- User registration and login
- Secure password hashing with PHP password APIs
- Checkout flow that saves orders to MySQL
- Success page after order placement
- Responsive frontend built with plain JavaScript and CSS

## Tech Stack

- PHP
- MySQL / MariaDB
- MAMP
- Vanilla JavaScript
- HTML / CSS

## Project Structure

```text
.
├── index.php
├── README.md
├── Fish_store/
│   ├── db.php
│   ├── login.php
│   ├── register.php
│   ├── products.php
│   ├── place_order.php
│   ├── backend/
│   │   └── checkout.php
│   └── frontend/
│       ├── app.js
│       ├── cart.js
│       ├── home.html
│       ├── index.html
│       ├── login.html
│       ├── product.html
│       ├── products.html
│       ├── register.html
│       ├── checkout.html
│       ├── success.html
│       └── styles.css
└── .git/
```

## Requirements

- MAMP or another local PHP + MySQL environment
- MySQL database access via localhost
- Modern browser

## Setup

1. Start Apache and MySQL in MAMP.
2. Create a database named `Fish_store`.
3. Update the database credentials in `Fish_store/db.php` if needed.
4. Create the matching tables in MySQL.
5. Open the project in your browser using the local MAMP URL.

## Database Schema

Example schema for the app:

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT
);

CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

You can seed the `products` table with product entries for the storefront.

## Local Run

Use your MAMP localhost address, for example:

```text
http://localhost:8888/
```

Then browse the frontend pages under `Fish_store/frontend/`.

## Notes

- The app expects the database configuration in `Fish_store/db.php`.
- The backend API endpoints are called by JavaScript in the frontend pages.
- The project is intended as a lightweight local practice/storefront demo rather than a production-ready deployment.

## License

This project is for educational/demo use.
