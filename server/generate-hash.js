import bcrypt from 'bcryptjs';

async function generateHashes() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);
  
  console.log('Хеши паролей:');
  console.log('admin123:', adminHash);
  console.log('user123:', userHash);
}

generateHashes();