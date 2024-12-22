# Finnish Legal Research Platform

An advanced AI-powered Finnish legal research platform that transforms legal information retrieval through sophisticated natural language processing and intelligent document analysis.

## Technologies Used

### Frontend
- **React** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **Shadcn UI** - UI component library
- **TailwindCSS** - Utility-first CSS framework
- **Wouter** - Lightweight routing
- **React Query** (@tanstack/react-query) - Data fetching and caching
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **PDF.js** (react-pdf) - PDF document viewing
- **Lucide React** - Icon library
- **React Resizable Panels** - Resizable layout components

### Backend
- **Express.js** - Node.js web application framework
- **TypeScript** - Type-safe JavaScript
- **Multer** - File upload handling
- **OpenAI API** - AI-powered text and document analysis
- **Axios** - HTTP client
- **Express Session** - Session management

### Database
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database toolkit
- **Drizzle Kit** - Database migration tool

### Development Tools
- **Vite** - Frontend build tool
- **ESBuild** - JavaScript bundler
- **TypeScript** - Development language
- **TSX** - TypeScript execution
- **PostCSS** - CSS transformation
- **Autoprefixer** - CSS vendor prefixing

### AI/ML Features
- Document analysis and summarization using OpenAI GPT-4
- Image analysis capabilities
- Legal context understanding
- Multi-language support (Finnish/English)
- Legal document template generation

### Legal Data Integration
- Finlex API integration for Finnish legal documents
- KKV (Finnish Competition and Consumer Authority) guidelines integration
- Legal document parsing and analysis
- Case law reference system

## Features
- Advanced legal document search and analysis
- Real-time document preview (PDF, images)
- Chat interface for legal queries
- Document template management
- Multi-language support (Finnish legal terminology)
- File upload and analysis
- Contextual help system

## Development

To run the development server:

```bash
npm run dev
```

The application will be available at port 5000.

## Environment Variables

The following environment variables are required:

- `DATABASE_URL`: PostgreSQL database connection string
- `OPENAI_API_KEY`: OpenAI API key for AI features
