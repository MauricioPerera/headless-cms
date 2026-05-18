const fs = require('fs');
let content = fs.readFileSync('src/app.js', 'utf8');

content = content.replace(
  "const taxonomyRoutes = require('./api/routes/taxonomies');",
  "const taxonomyRoutes = require('./api/routes/taxonomies');\nconst webhookRoutes = require('./api/routes/webhooks');"
);

content = content.replace(
  "app.use('/api/taxonomies', taxonomyRoutes);",
  "app.use('/api/taxonomies', taxonomyRoutes);\napp.use('/api/webhooks', webhookRoutes);"
);

fs.writeFileSync('src/app.js', content);
console.log('updated');
