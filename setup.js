#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏠 UrbanHaven Chatbot Setup');
console.log('============================\n');

// Check if Node.js is installed
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js ${nodeVersion} detected`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js v16 or higher.');
  process.exit(1);
}

// Function to run commands
function runCommand(command, cwd) {
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if directory exists
function directoryExists(dirPath) {
  return fs.existsSync(dirPath);
}

// Function to create .env file
function createEnvFile() {
  const envPath = path.join(__dirname, 'chatbot-project', 'server', '.env');
  const envExamplePath = path.join(__dirname, 'chatbot-project', 'server', 'env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from template');
    console.log('⚠️  Please edit the .env file with your actual configuration');
  } else if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists');
  } else {
    console.log('⚠️  .env file not found. Please create one manually.');
  }
}

// Setup backend
console.log('📦 Setting up backend...');
const serverPath = path.join(__dirname, 'chatbot-project', 'server');

if (directoryExists(serverPath)) {
  console.log('Installing backend dependencies...');
  if (runCommand('npm install', serverPath)) {
    console.log('✅ Backend dependencies installed');
  } else {
    console.log('❌ Failed to install backend dependencies');
  }
  
  createEnvFile();
} else {
  console.log('❌ Backend directory not found');
}

// Setup frontend
console.log('\n📦 Setting up frontend...');
const clientPath = path.join(__dirname, 'client');

if (directoryExists(clientPath)) {
  console.log('Installing frontend dependencies...');
  if (runCommand('npm install', clientPath)) {
    console.log('✅ Frontend dependencies installed');
  } else {
    console.log('❌ Failed to install frontend dependencies');
  }
} else {
  console.log('❌ Frontend directory not found');
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Edit chatbot-project/server/.env with your configuration');
console.log('2. Start MongoDB (local or cloud)');
console.log('3. Get an OpenAI API key from https://platform.openai.com/');
console.log('4. Run the backend: cd chatbot-project/server && npm run dev');
console.log('5. Run the frontend: cd client && npm start');
console.log('\nFor detailed instructions, see README.md'); 