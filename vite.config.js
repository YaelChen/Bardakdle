import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'word-api',
      configureServer(server) {
        server.middlewares.use('/api/add-word', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method not allowed');
            return;
          }

          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { word, addToAnswers } = JSON.parse(body);

              // הוסף ל-valid_guesses.json
              const guessesPath = path.resolve('src/data/valid_guesses.json');
              const guesses = JSON.parse(fs.readFileSync(guessesPath, 'utf8'));
              if (!guesses.includes(word)) {
                guesses.push(word);
                fs.writeFileSync(guessesPath, JSON.stringify(guesses, null, 2));
              }

              // הוסף ל-answers.json אם נדרש
              if (addToAnswers) {
                const answersPath = path.resolve('src/data/answers.json');
                const answers = JSON.parse(fs.readFileSync(answersPath, 'utf8'));
                if (!answers.includes(word)) {
                  answers.push(word);
                  fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2));
                }
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: e.message }));
            }
          });
        });
      },
    },
  ],
  server: {
    historyApiFallback: true,
  },
})
