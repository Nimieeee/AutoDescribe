export const config = {
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  logFile: process.env.LOG_FILE || 'app.log',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/autodescribe'
  },
  ai: {
    mistralApiKey: process.env.MISTRAL_API_KEY,
    model: process.env.MISTRAL_MODEL || 'mistral-large-latest'
  }
};