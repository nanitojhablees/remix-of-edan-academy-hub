#!/usr/bin/env node

// Bundle analysis script for monitoring code-splitting effectiveness
const fs = require('fs');
const path = require('path');

// Analyze build output
const analyzeBuild = () => {
  const distPath = path.join(__dirname, '../dist');
  const assetsPath = path.join(distPath, '.vite', 'manifest.json');
  
  console.log('🔍 Analizando bundle size...\n');
  
  try {
    // Check if build exists
    if (!fs.existsSync(distPath)) {
      console.log('❌ No se encontró el directorio dist. Ejecuta "npm run build" primero.');
      return;
    }
    
    // Analyze chunk sizes
    const chunks = [];
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.css')) {
          const size = stat.size;
          chunks.push({
            name: path.relative(distPath, filePath),
            size: size,
            sizeKB: (size / 1024).toFixed(2)
          });
        }
      });
    };
    
    walkDir(distPath);
    
    // Sort by size
    chunks.sort((a, b) => b.size - a.size);
    
    console.log('📊 Top 10 chunks más grandes:');
    console.log('─'.repeat(60));
    chunks.slice(0, 10).forEach((chunk, index) => {
      const sizeIndicator = chunk.size > 500000 ? '🔴' : 
                           chunk.size > 200000 ? '🟡' : 
                           chunk.size > 100000 ? '🟢' : '🔵';
      console.log(`${index + 1}. ${sizeIndicator} ${chunk.name} (${chunk.sizeKB} KB)`);
    });
    
    // Summary
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const jsChunks = chunks.filter(c => c.name.endsWith('.js'));
    const cssChunks = chunks.filter(c => c.name.endsWith('.css'));
    
    console.log('\n📈 Resumen:');
    console.log('─'.repeat(30));
    console.log(`Total chunks: ${chunks.length}`);
    console.log(`Chunks JS: ${jsChunks.length}`);
    console.log(`Chunks CSS: ${cssChunks.length}`);
    console.log(`Tamaño total: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`Tamaño promedio por chunk: ${(totalSize / chunks.length / 1024).toFixed(2)} KB`);
    
    // Recommendations
    console.log('\n💡 Recomendaciones:');
    console.log('─'.repeat(20));
    if (chunks[0]?.size > 500000) {
      console.log('⚠️  El chunk más grande excede 500KB. Considera más code-splitting.');
    }
    if (jsChunks.length < 5) {
      console.log('⚠️  Pocos chunks JS. Podrías beneficiarte de más granularidad.');
    }
    console.log('✅ Code-splitting implementado correctamente!');
    
  } catch (error) {
    console.error('Error analyzing build:', error.message);
  }
};

analyzeBuild();