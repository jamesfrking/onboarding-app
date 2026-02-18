import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'sumsub-api',
        configureServer(server) {
          const SUMSUB_APP_TOKEN = env.SUMSUB_APP_TOKEN || '';
          const SUMSUB_SECRET_KEY = env.SUMSUB_SECRET_KEY || '';
          const SUMSUB_LEVEL_NAME = env.SUMSUB_LEVEL_NAME || 'basic-kyc-level';
          const SUMSUB_BASE_URL = 'https://api.sumsub.com';

          server.middlewares.use('/api/kyc-sumsub', async (req, res) => {
            // CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              res.end();
              return;
            }

            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            // Parse request body
            let body = '';
            for await (const chunk of req) {
              body += chunk;
            }

            try {
              const { email, executiveName } = JSON.parse(body);

              if (!executiveName || !email) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
                return;
              }

              // Unique userId per verification so Sumsub creates a fresh applicant each time
              // In production, use a stable ID (e.g., database user ID) so returning users resume
              const userId = `${email}-${Date.now()}`;
              const urlPath = '/resources/accessTokens/sdk';
              const requestBody = JSON.stringify({
                applicantIdentifiers: { email },
                ttlInSecs: 600,
                userId,
                levelName: SUMSUB_LEVEL_NAME,
              });

              // HMAC-SHA256 signature: sign(timestamp + METHOD + path + body)
              const ts = Math.floor(Date.now() / 1000).toString();
              const signature = crypto
                .createHmac('sha256', SUMSUB_SECRET_KEY)
                .update(ts + 'POST' + urlPath + requestBody)
                .digest('hex');

              // Call Sumsub API
              const sumsubResponse = await fetch(`${SUMSUB_BASE_URL}${urlPath}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-App-Token': SUMSUB_APP_TOKEN,
                  'X-App-Access-Sig': signature,
                  'X-App-Access-Ts': ts,
                },
                body: requestBody,
              });

              const responseText = await sumsubResponse.text();

              if (!sumsubResponse.ok) {
                console.error('Sumsub API error:', sumsubResponse.status, responseText);
                res.statusCode = sumsubResponse.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: `Sumsub API failed: ${sumsubResponse.status}`,
                  details: responseText,
                }));
                return;
              }

              const data = JSON.parse(responseText);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                token: data.token,
                userId: data.userId,
              }));
            } catch (error: any) {
              console.error('API error:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: 'Internal server error',
                details: error.message,
              }));
            }
          });
        },
      },
    ],
    server: {
      port: 3001,
    },
  };
});
