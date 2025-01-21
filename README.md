# Finnish Legal Research Assistant

An advanced AI-powered Finnish legal research platform that transforms legal information retrieval through sophisticated natural language processing and intelligent document analysis. The platform helps users understand, analyze, and work with Finnish legal documents efficiently.

## 🌟 Key Features

- **Natural Language Interaction**: Ask questions about Finnish law in plain language
- **Document Analysis**: Upload and analyze legal documents in Finnish and English
- **Legal Research**: Access and search through Finnish legal resources
- **Multi-language Support**: Seamless handling of both Finnish and English content
- **Real-time Document Preview**: View PDFs and other documents directly in the interface
- **Chat History**: Track and revisit previous legal research conversations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (we use Railway for hosting)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mattfrans/finnish-legal-assistant.git
cd finnish-legal-assistant
```

2. Install dependencies for both client and server:
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in required environment variables:
     ```
     DATABASE_URL=your_railway_postgresql_url
     OPENAI_API_KEY=your_openai_api_key
     SESSION_SECRET=your_session_secret
     NODE_ENV=development
     VITE_API_URL=http://localhost:5000
     VITE_WS_URL=ws://localhost:5000
     CLIENT_URL=http://localhost:5173
     ```

4. Start the development servers:
```bash
# Start backend (from root directory)
npm run dev

# Start frontend (from client directory)
cd client
npm run dev
```

## 🏗️ Technology Stack

### Frontend
- **React** with **TypeScript** for type-safe development
- **Shadcn UI** & **TailwindCSS** for modern, responsive design
- **React Query** for efficient data fetching and caching
- **PDF.js** for document preview
- **Wouter** for lightweight routing

### Backend
- **Express.js** with **TypeScript**
- **OpenAI API** integration for AI capabilities
- **PostgreSQL** with **Drizzle ORM** for database management
- **Express Session** for user session handling

## 📝 API Documentation

### Main Endpoints

- `POST /api/chat/sessions` - Create a new chat session
- `POST /api/chat/sessions/:sessionId/chat` - Send a message in a chat session
- `GET /api/chat/sessions` - Get user's chat history
- `POST /api/documents/analyze` - Upload and analyze legal documents

## 🚀 Deployment

The application is deployed using:
- Frontend: Vercel
- Backend: Railway
- Database: Railway PostgreSQL

### Environment Setup for Production

1. **Vercel**:
   - Connect your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy from the main branch

2. **Railway**:
   - Set up PostgreSQL database
   - Deploy backend service
   - Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the AI capabilities
- Shadcn UI for the beautiful component library
- The Finnish legal community for guidance and feedback

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers directly.

## 🔄 Project Status

The project is actively maintained and under continuous development. Check the [Issues](https://github.com/mattfrans/finnish-legal-assistant/issues) page for current tasks and planned features.
