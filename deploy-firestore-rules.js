const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if Firebase CLI is installed
function checkFirebaseCLI() {
  return new Promise((resolve, reject) => {
    exec('firebase --version', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Firebase CLI not found. Please install it first:');
        console.error('npm install -g firebase-tools');
        reject(error);
      } else {
        console.log('✅ Firebase CLI found:', stdout.trim());
        resolve();
      }
    });
  });
}

// Deploy Firestore rules
function deployRules() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Deploying Firestore security rules...');
    
    exec('firebase deploy --only firestore:rules', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to deploy Firestore rules:', error.message);
        console.error('Make sure you are logged in: firebase login');
        console.error('And your project is initialized: firebase init');
        reject(error);
      } else {
        console.log('✅ Firestore rules deployed successfully!');
        console.log(stdout);
        resolve();
      }
    });
  });
}

// Main function
async function main() {
  try {
    // Check if firestore.rules exists
    if (!fs.existsSync('firestore.rules')) {
      console.error('❌ firestore.rules file not found!');
      process.exit(1);
    }

    await checkFirebaseCLI();
    await deployRules();
    
    console.log('\n🎉 Deployment completed successfully!');
    console.log('Your Firestore security rules are now active.');
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

main();
