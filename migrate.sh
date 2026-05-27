#!/bin/bash

# Migration script to convert old JSX files to new Vite structure

echo "🔄 Migrating components to new structure..."

# Create a combined components file first
cat > src/components/index.jsx << 'EOF'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useBreakpoint } from '../hooks/useViewport';
import { hexA, landscapeUrl, posterUrl, backdropUrl, navigate } from '../utils/helpers';

export { default as AmbientBg } from './AmbientBg';
export { default as Sidebar } from './Sidebar';
export { default as TopBar } from './TopBar';
export { default as Hero } from './Hero';
export { default as Row } from './Row';
export { default as Card } from './Card';
export { default as CategoryCard } from './CategoryCard';
export { default as TweaksPanel } from './TweaksPanel';
EOF

echo "✅ Component index created"
echo "✅ Migration complete!"
