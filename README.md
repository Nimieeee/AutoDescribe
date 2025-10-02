# AutoDescribe - AI-Powered Product Content Generator 🚀

AutoDescribe is an intelligent content generation system that creates high-quality product descriptions using **Mistral AI** and **RAG (Retrieval-Augmented Generation)** technology with real product data.

## ✨ Features

- **🤖 Mistral AI Integration**: Advanced language model for content generation
- **📊 5-Dimensional Quality Scoring**: Comprehensive content evaluation system
- **🔍 Enhanced Search**: Advanced product search across 10,850+ products
- **🔒 Review Dashboard**: Password-protected interface for content review and editing
- **📝 Real-time Editing**: In-place content editing with quality tracking
- **📈 RAG Technology**: Context-aware generation using product data
- **🎯 System Prompts**: Comprehensive e-commerce copywriting guidelines

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend-clean
npm install
npm run dev-full
```

### 2. Start Frontend
```bash
cd frontend-clean
npm install
npm run dev
```

### 3. Access System
- **Generate Content**: http://localhost:3000
- **Review Dashboard**: http://localhost:3000/review (password: `atdb-465@`)

## 🎯 System Overview

### **Backend (backend-clean/)**
- **Express.js + TypeScript** server
- **Mistral AI** integration with system prompts
- **CSV RAG** system with 10,850 products
- **Quality evaluation** with 5-dimensional scoring
- **Enhanced search** with relevance ranking

### **Frontend (frontend-clean/)**
- **Next.js + React** application
- **Password-protected** review dashboard
- **Real-time editing** capabilities
- **Quality score visualization**
- **Content management** interface

### **Data**
- **structured_products.csv**: 10,850 real products with B0 SKUs
- **Supabase database**: Content storage and management
- **Quality scoring**: Automated content evaluation

## 📊 Quality Scoring System

**5-Dimensional Evaluation (0-10 scale)**:
1. **🔍 Clarity** (0-2): Readability and comprehension
2. **✂️ Conciseness** (0-2): Efficiency and redundancy
3. **⚠️ Technical Accuracy** (0-2): Factual correctness
4. **👔 Professional Tone** (0-2): Writing quality and consistency
5. **🎯 SEO & Engagement** (0-2): Optimization and appeal

## 🧪 Testing

```bash
# Test complete system
node test-complete-system.js

# Test Mistral AI integration
node test-mistral-integration.js

# Test enhanced search
node test-enhanced-search.js
```

## 📚 Documentation

- **[Setup Guide](SETUP.md)** - Detailed setup instructions
- **[Scoring System](SCORING_SYSTEM_EXPLAINED.md)** - Quality evaluation details
- **[Search Enhancement](SEARCH_FUNCTIONALITY_ENHANCED.md)** - Search functionality
- **[Mistral Integration](MISTRAL_AI_INTEGRATION_COMPLETE.md)** - AI integration details
- **[Review Dashboard](REVIEW_PAGE_ENHANCEMENTS_COMPLETE.md)** - Dashboard features

## 🎉 Ready to Use

The system is **production-ready** with:
- ✅ Real Mistral AI generation
- ✅ Comprehensive system prompts
- ✅ Quality scoring and evaluation
- ✅ Enhanced search functionality
- ✅ Password-protected review interface
- ✅ 10,850+ real product dataset

Generate high-quality, conversion-optimized product content with AI! 🎯