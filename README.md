# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

# 🧁 Vietnamese Bakery Management System

A comprehensive full-stack web application for managing Vietnamese bakery operations, built with modern React technologies and Firebase backend.

## 🚀 Technical Overview

### **Tech Stack**

#### **Frontend**
- **React 19.1.1** - Latest React with modern hooks and concurrent features
- **TypeScript 5.8.3** - Type-safe development with strict type checking
- **Vite 7.1.2** - Lightning-fast build tool and development server
- **Ant Design 5.27.3** - Professional UI component library
- **Ant Design Icons** - Comprehensive icon set

#### **Backend & Cloud Services**
- **Firebase 12.2.1** - Backend-as-a-Service platform
  - **Firestore** - NoSQL document database for real-time data
  - **Firebase Auth** - User authentication and authorization
  - **Firebase Storage** - File storage (migrated to Cloudinary)
- **Cloudinary** - Cloud-based image management and CDN

#### **Development Tools**
- **ESLint 9.33.0** - Code linting with modern configuration
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Vite Plugin React** - Optimized React development experience

## 📋 Core Features

### **1. Admin Authentication System**
- Firebase Authentication integration
- Secure admin login/logout
- Session management with persistence
- Role-based access control

### **2. Product Management**
- **Product Categories**: Hierarchical product classification
- **Product CRUD**: Complete Create, Read, Update, Delete operations
- **Auto-generated Product Codes**: Format `[CATEGORY]-[NAME]-[TIMESTAMP]`
- **Image Upload**: Cloudinary integration for optimized image storage
- **Price Management**: Dynamic pricing with Vietnamese currency formatting

### **3. Advanced Supply Chain Management**
- **Ingredient Categories**: Organized ingredient classification system
- **Enhanced Ingredients**: Brand tracking, packaging details, unit price calculations
- **Supplier Management**: Contact details, payment terms, delivery tracking
- **Multi-Ingredient Purchase Orders**: Complex order system with price analytics
- **Price Tracking**: Historical pricing and cost analysis

### **4. Customer Relationship Management**
- **Customer Database**: Comprehensive customer information storage
- **Phone Number Normalization**: Vietnamese phone format standardization
- **Purchase History**: Customer transaction tracking
- **Smart Order System**: Auto-populate customer data from phone lookup

### **5. Order Management System**
- **Multi-Product Orders**: Add multiple products with different quantities
- **Real-time Calculations**: Automatic subtotal, discount, and total calculations
- **Payment Status Tracking**: Paid/Unpaid status management
- **Vietnamese Localization**: Full Vietnamese language interface

### **6. Billing & Invoice System**
- Professional invoice generation
- Vietnamese format compliance
- Export and print capabilities

### **7. Contact Management**
- Supplier and vendor contact database
- Business relationship tracking
- Communication history

## 🏗️ Architecture & Implementation

### **Frontend Architecture**
```
src/
├── components/           # Reusable UI components
├── pages/               # Route-based page components
│   ├── Dashboard.tsx    # Main dashboard with analytics
│   ├── Products.tsx     # Product management
│   ├── Orders.tsx       # Order processing
│   ├── Customers.tsx    # Customer management
│   ├── Ingredients.tsx  # Ingredient management
│   ├── Suppliers.tsx    # Supplier management
│   └── ...
├── utils/               # Utility functions
│   └── cloudinaryUpload.ts  # Image upload service
├── firebase.ts          # Firebase configuration
└── App.tsx             # Main application router
```

### **Key Technical Implementations**

#### **1. Firebase Integration**
```typescript
// Real-time Firestore operations
const fetchData = async () => {
  const snapshot = await getDocs(collection(db, 'products'));
  const data = snapshot.docs.map(doc => ({ 
    key: doc.id, 
    ...doc.data() 
  }));
  setProducts(data);
};
```

#### **2. Image Upload with Cloudinary**
```typescript
export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'bakery');
  
  const response = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });
  
  return response.json().then(data => data.secure_url);
}
```

#### **3. Vietnamese Phone Normalization**
```typescript
const normalizePhone = (phone: string): string => {
  let normalized = phone.replace(/[\s\-\(\)]/g, '');
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  }
  return normalized;
};
```

#### **4. Dynamic Product Code Generation**
```typescript
const generateProductCode = (categoryName: string, productName: string) => {
  const catCode = categoryName.substring(0, 3).toUpperCase();
  const prodCode = productName.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${catCode}-${prodCode}-${timestamp}`;
};
```

## 🎯 Key Technical Achievements

### **Performance Optimizations**
- **Vite Build Tool**: Sub-second hot module replacement
- **Code Splitting**: Lazy loading for optimal bundle size
- **Image Optimization**: Cloudinary automatic image compression and resizing
- **Real-time Updates**: Firestore real-time listeners for live data synchronization

### **Type Safety & Code Quality**
- **100% TypeScript**: Complete type coverage across the application
- **Interface Definitions**: Comprehensive type definitions for all data models
- **ESLint Configuration**: Strict linting rules for code consistency
- **Error Handling**: Comprehensive try-catch blocks with user-friendly error messages

### **User Experience Features**
- **Responsive Design**: Mobile-first approach with Ant Design responsive grid
- **Vietnamese Localization**: Complete Vietnamese language interface
- **Loading States**: Proper loading indicators for all async operations
- **Form Validation**: Real-time form validation with helpful error messages
- **Toast Notifications**: User feedback for all operations

### **Data Management**
- **NoSQL Database Design**: Efficient Firestore document structure
- **Real-time Synchronization**: Live updates across multiple users
- **Data Relationships**: Proper foreign key relationships between collections
- **Batch Operations**: Efficient bulk data operations

## 🔧 Development & Deployment

### **Development Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### **Environment Configuration**

1. Copy `.env.example` to `.env`.
2. Fill `VITE_*` values from [Firebase Console → Project settings → Your apps](https://console.firebase.google.com/project/bakery-4c2f2/settings/general) (Web app config: `apiKey`, `appId`, etc.).
3. Set the same variables on **Vercel** (Production) and redeploy so the build embeds them.

See `.env.example` for field-by-field mapping. Cloudinary keys come from the Cloudinary dashboard.

### **Firestore backups**

Automated backups are configured in Firebase/Google Cloud Console (requires Blaze for scheduled exports). Step-by-step: [docs/guides/2026-05-23/firestore-backups.md](docs/guides/2026-05-23/firestore-backups.md).

### **Deploy**

| Target | Command / action |
|--------|------------------|
| Frontend (production) | Vercel — push to connected branch |
| Firestore rules | `npm run deploy:rules` (after `firebase login`) |

## 📊 Technical Metrics

- **Bundle Size**: Optimized with Vite tree-shaking
- **Type Coverage**: 100% TypeScript implementation
- **Component Count**: 12+ specialized business components
- **Firebase Collections**: 8+ normalized data collections
- **API Integrations**: Firebase Firestore, Firebase Auth, Cloudinary
- **Responsive Breakpoints**: Mobile, tablet, desktop optimization

## 🌟 Business Impact

This system demonstrates:
- **Full-stack development** with modern React and Firebase
- **Complex business logic** implementation for supply chain management
- **Real-time data synchronization** for multi-user environments
- **Cloud-first architecture** with scalable Firebase backend
- **Professional UI/UX** with enterprise-grade Ant Design components
- **Type-safe development** practices with comprehensive TypeScript usage

## 🚀 Future Enhancements

- PWA implementation for offline capabilities
- Advanced analytics dashboard with charts
- Multi-tenant architecture for franchise management
- Integration with payment gateways
- Automated inventory alerts and reordering
- Mobile app development with React Native

---

**Technologies**: React, TypeScript, Firebase, Ant Design, Vite, Cloudinary, ESLint  
**Type**: Full-stack Web Application  
**Domain**: Business Management System  
**Scale**: Enterprise-ready with real-time capabilities

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
