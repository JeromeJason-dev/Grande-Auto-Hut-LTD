# GRANDE AUTO HUT LTD
A frontend e-commerce site for an auto parts retailer based in Nairobi, Kenya. Customers can browse genuine and aftermarket car parts, create an account, place orders, track deliveries, leave reviews, and report issues — all from the browser, with no backend server.
## Overview
Grande Auto Hut Ltd has supplied genuine auto parts and hard-to-find components to drivers across Kenya for over a decade. This site is the company's online storefront: a catalog of parts, a shopping cart and checkout flow, and a customer account area for managing orders after purchase.

The project is built as a static multi-page site (plain HTML/CSS/JS) and deployed on Vercel. All application state — user accounts, sessions, cart contents, and orders — is stored in the browser via localStorage and sessionStorage, so it runs entirely client-side with no database or API server required.

## Current Features
### Storefront
- **Home page** — brand introduction, value propositions (inventory, quality, expert staff, fast logistics), and customer testimonials.
- **Product catalog** — browsable parts inventory (ignition coils, crankshafts, bumpers, clutch kits, alternators, water pumps, oil filters, shock absorbers, radiators, headlights, coolant, batteries, brakes, spark plugs, windshield wipers, and more), with sort-by-price (low–high / high–low) and category filtering.
- **About & Contact pages** for company info and customer inquiries.
- **Cart & Checkout** — add items to a persistent cart, view running totals, and place orders.
### Customer Accounts
- **Registration & Login** — customers create an account with name, email, phone, and password; a unified login form authenticates both customers and the store admin.
- **Session-based auth** — login state is tracked via `sessionStorage`, with logged-in users automatically redirected away from login/register pages and guests redirected away from protected pages.
- **My Account / Profile page** — post-login landing page showing the signed-in user's name, with three tabs:
  - **Track Orders** — view order history and an interactive shipment tracker (Order Confirmed → In Transit → Delivered).
  - **Reviews & Ratings** — leave a star rating and written review on delivered orders.
  - **Report an Issue** — flag problems with a specific order (damaged item, wrong item, missing item, late delivery, quality concern, or other) and view past reports.
- **Per-account data isolation** — orders, reviews, and issues are scoped to the logged-in user's email, so each customer only ever sees their own order history.
### Admin
- A separate hardcoded admin login routes to an admin dashboard, kept distinct from customer registration/login.

## Tech Stack

| Layer | Technology |
|---|---|
| Markup & styling | HTML5, CSS3 |
| Interactivity | Vanilla JavaScript (no frameworks) |
| Icons | Font Awesome (via Kit CDN) |
| Data persistence | Browser `localStorage` (accounts, orders, cart) & `sessionStorage` (active session) |
| Hosting | [Vercel](https://vercel.com) |

## Project Structure
```
grande-auto-hut-ltd/
│
├── index.html                  # Home page (hero, value props, testimonials)
├── product.html                 # Product catalog (sort + category filters)
├── about.html                    # About Us page
├── contact.html                  # Contact page (location, phone, email, hours)
├── login.html                     # Unified customer/admin login
├── register.html                 # Customer registration (linked from login.html)
├── profile.html                  # Customer account dashboard (built earlier in this thread)
├── editProfile.html             # Edit account details (linked from profile.html sidebar)
├── cart.html                       # Shopping cart (linked from "View Cart" buttons)
├── admin.html                     # Admin dashboard (referenced in auth.js redirect logic)              
│                                      
│
├── CSS/                              # Inferred folder (referenced as "CSS/profile.css" in profile.html)
│   ├── style.css                    # Likely shared/global styles
│   ├── profile.css                 # Confirmed referenced by filename in profile.html
│   ├── product.css                
│   ├── login.css                    
│   ├── register.css                
│   ├── about.css                   
│   ├── contact.css                  
│   └── cart.css                       
│
├── JS/                                 # Inferred folder (referenced as "JS/auth.js" in profile.html)
│   ├── auth.js                      # Confirmed by filename — registration, login, logout, session guards, nav auth-link swap
│   │                                       
│   ├── profile.js                  # Confirmed by filename — order tracking, reviews, issue reporting
│   │                                       
│   ├── checkout.js               # Referenced in profile.js comments as the script that writes the order shape to grande_orders
│   │                                       
│   ├── cart.js                   # Referenced in profile.js comments (cart count calculation logic it mirrors)
│   │                                       
│   └── product.js               # Likely script for catalog rendering/sorting/filtering
│
└── assets/ (or images/)        # Inferred — logo, icons, product images, etc.
```

## Get Started
### Installation
1. Clone the repository:
```bash 
git clone https://github.com/JeromeJason-dev/Grande-Auto-Hut-LTD.git 

cd Grande-Auto-Hut-LTD 
```

2. Open the project: Simply open the index.html file in your preferred browser to view the current build.
## Collaboration & Contribution
We welcome contributions from the community and the team to help make LuxRent the gold standard for real estate platforms.

### How to Contribute
1. Fork the Repository: Create your own copy of the project to work on.

2. Create a Feature Branch: bash git checkout -b feature/AmazingFeature

3. Commit Your Changes: bash git commit -m 'Add some AmazingFeature'

4. Push to the Branch: bash git push origin feature/AmazingFeature

5. Open a Pull Request: Describe your changes and submit for review.

## Future Roadmap

- Replace `localStorage`-based auth with a real backend and database for persistent, cross-device accounts.
- Add password hashing (current implementation stores plaintext passwords client-side, which is not secure for production use).
- Integrate real payment processing for checkout.
- Add server-side order tracking synced with an actual logistics provider.


Implementation of Javascript for more interactive responses

## License
This project is licensed under the MIT license.

## Copyright 
&copy; 2026 Grande Auto Hut LTD. All rights reserved.

