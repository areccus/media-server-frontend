#!/bin/bash

echo "Creating optimized production build..."

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Create dist directory
mkdir -p dist

# Copy static assets
cp styles.css dist/styles.css
cp player.html dist/player.html
cp tvnav.js   dist/tvnav.js
[ -f favicon.ico ] && cp favicon.ico dist/favicon.ico

# Build index.html: production React + all JSX concatenated into one <script>
# Single network request for all app code; production React removes dev warnings.
cat > dist/index.html << 'HTMLEOF'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>HALO</title>
<link rel="stylesheet" href="styles.css"/>
<script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"></script>
</head>
<body>
<div id="root"></div>
<script type="text/babel" data-presets="react">
HTMLEOF

# Combine all JSX files into one inline block (1 network round-trip instead of 7)
# Single React destructure at top; strip per-file duplicates to avoid redeclaration errors.
echo "const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, memo } = React;" >> dist/index.html

for f in tweaks-panel.jsx data.jsx router.jsx detail-page.jsx pages.jsx components.jsx app.jsx; do
  sed '/^const {[^}]*} = React;/d' "$f" >> dist/index.html
done

cat >> dist/index.html << 'HTMLEOF'
</script>
<script src="tvnav.js"></script>
</body>
</html>
HTMLEOF

echo "Build complete → dist/"
echo "Deploy: vercel --prod"
