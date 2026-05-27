#!/bin/bash

echo "🚀 Creating optimized production build..."

# Create dist directory
mkdir -p dist

# Copy and minify CSS
echo "📦 Optimizing CSS..."
cp styles.css dist/styles.css

# Create optimized HTML with production React
cat > dist/index.html << 'HTMLEOF'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>Plex — Watch</title>
<link rel="stylesheet" href="styles.css"/>
<script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"></script>
</head>
<body>
<div id="root"></div>
<script type="text/babel" data-type="module" data-presets="react">
HTMLEOF

# Combine all JSX files into one
echo "const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, memo } = React;" >> dist/index.html

cat tweaks-panel.jsx data.jsx router.jsx detail-page.jsx pages.jsx components.jsx app.jsx | \
  grep -v "^// " | \
  grep -v "^const { useState" | \
  grep -v "Object.assign(window" >> dist/index.html

cat >> dist/index.html << 'HTMLEOF'
</script>
</body>
</html>
HTMLEOF

echo "✅ Optimized build created in dist/"
echo "🌐 Serve with: python3 -m http.server 8080 --directory dist"
