// Environment Configuration for Music Karaoke Web App
// This file contains environment variables for JWT and API configuration

module.exports = {
  // JWT Configuration for Premium Status Sync
  JWT_SECRET: 'f626c8e087350bf2c9938a8a9b71c50952749a5e1258c9515d50bd8a07691601',
  
  // Database Configuration
  DATABASE_URL: 'postgresql://username:password@localhost:5432/musickaraoke',
  
  // NextAuth Configuration
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'your-nextauth-secret-key-here-make-it-long-and-random-987654321',
  
  // Stripe Configuration (for premium subscriptions)
  STRIPE_SECRET_KEY: 'sk_test_your_stripe_secret_key_here',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_your_stripe_publishable_key_here',
  STRIPE_WEBHOOK_SECRET: 'whsec_your_stripe_webhook_secret_here',
  
  // YouTube API Configuration (for karaoke functionality)
  NEXT_PUBLIC_YOUTUBE_API_KEY: 'AIzaSyDew5bVhPMz5U9DDgajrk-BTNfT_RpfOI4',
  
  // API Configuration
  API_BASE_URL: 'http://localhost:3000/api',
  
  // Premium Status Sync Configuration
  ENABLE_PREMIUM_SYNC: true,
  PREMIUM_CHECK_ENDPOINT: '/mobile/check-premium',
  SUBSCRIPTION_DETAILS_ENDPOINT: '/subscription/details',
  
  // Development Settings
  NODE_ENV: 'development',
  DEBUG_MODE: true,
}; 
