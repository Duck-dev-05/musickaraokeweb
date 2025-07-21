# YouTube API Setup for Karaoke Functionality

This guide will help you set up the YouTube API to enable karaoke search functionality in the Music Karaoke Web app.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console
3. Basic understanding of API keys and quotas

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" or create a new project
3. Give your project a name (e.g., "Music Karaoke Web")
4. Click "Create"

## Step 2: Enable YouTube Data API v3

1. In your Google Cloud project, go to the [API Library](https://console.cloud.google.com/apis/library)
2. Search for "YouTube Data API v3"
3. Click on "YouTube Data API v3"
4. Click "Enable"

## Step 3: Create API Credentials

1. Go to the [Credentials page](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. (Optional) Click "Restrict Key" to limit usage to YouTube Data API v3

## Step 4: Configure Environment Variables

1. Open your `.env.local` file (create it if it doesn't exist)
2. Add the following line:
   ```
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with the API key you copied in Step 3

## Step 5: Update Environment Configuration

1. Open `env.config.js`
2. Replace the placeholder value:
   ```javascript
   NEXT_PUBLIC_YOUTUBE_API_KEY: 'your_actual_api_key_here',
   ```

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the Karaoke page
3. Search for a song (e.g., "Sao anh ra di")
4. You should see karaoke search results

## API Quota and Limits

### Free Tier Limits
- **Daily quota**: 10,000 units per day
- **Search requests**: 100 units per request
- **Video details requests**: 1 unit per request

### Quota Usage
- Each karaoke search uses approximately 200-300 quota units
- With 10,000 daily units, you can perform ~30-50 searches per day

### Monitoring Usage
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Dashboard"
3. Click on "YouTube Data API v3"
4. View "Quotas" tab to monitor usage

## Troubleshooting

### Common Issues

1. **"YouTube API key is not configured"**
   - Make sure you've added the API key to your `.env.local` file
   - Restart your development server after adding the key

2. **"YouTube API quota exceeded"**
   - Check your daily quota usage in Google Cloud Console
   - Consider upgrading to a paid plan for higher limits

3. **"Invalid YouTube API request"**
   - Verify that YouTube Data API v3 is enabled
   - Check that your API key is correct

4. **No search results**
   - Try different search terms
   - Check the browser console for error messages
   - Verify your API key has the correct permissions

### Error Messages

- **403 Forbidden**: API key is invalid or quota exceeded
- **400 Bad Request**: Invalid search parameters
- **429 Too Many Requests**: Rate limit exceeded

## Security Best Practices

1. **Restrict API Key**: Limit your API key to only YouTube Data API v3
2. **Environment Variables**: Never commit API keys to version control
3. **Quota Monitoring**: Set up alerts for quota usage
4. **Rate Limiting**: Implement client-side rate limiting if needed

## Production Deployment

For production deployment:

1. Set the environment variable in your hosting platform
2. Consider implementing server-side caching to reduce API calls
3. Monitor API usage and costs
4. Implement proper error handling for API failures

## Example Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSyC_your_actual_api_key_here
```

## Support

If you encounter issues:

1. Check the [YouTube Data API documentation](https://developers.google.com/youtube/v3)
2. Review the [API quotas and pricing](https://developers.google.com/youtube/v3/getting-started#quota)
3. Check the browser console for detailed error messages
4. Verify your API key configuration in Google Cloud Console

## Additional Features

The karaoke functionality includes:

- **Multi-query search**: Searches for "karaoke", "instrumental", "minus one", etc.
- **Smart filtering**: Excludes non-karaoke content
- **Title cleaning**: Removes common karaoke prefixes/suffixes
- **Error handling**: Graceful handling of API errors
- **Rate limiting**: Built-in protection against quota exhaustion

This setup will enable full karaoke functionality in your Music Karaoke Web application! 