/**
 * Script per testare le API routes localmente
 * 
 * Uso: node scripts/test-api.js
 * 
 * Assicurati di avere:
 * 1. .env.local con le variabili d'ambiente
 * 2. Il server Next.js in esecuzione (npm run dev)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`\n${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    return { status: response.status, data };
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing TaskFlow API Routes\n');
  console.log('⚠️  Note: These tests require authentication');
  console.log('⚠️  Make sure you are logged in at', BASE_URL);
  console.log('⚠️  Or set up a test session cookie\n');

  // Test init database
  console.log('1️⃣  Testing database initialization...');
  await testAPI('/api/init-db', 'POST');

  // Test get tasks (requires auth)
  console.log('\n2️⃣  Testing GET /api/tasks...');
  await testAPI('/api/tasks');

  // Test get projects
  console.log('\n3️⃣  Testing GET /api/projects...');
  await testAPI('/api/projects');

  // Test get tags
  console.log('\n4️⃣  Testing GET /api/tags...');
  await testAPI('/api/tags');

  console.log('\n✅ Tests completed!');
  console.log('\nNote: Some tests may fail if you are not authenticated.');
  console.log('To test authenticated endpoints, use a browser with a valid session.');
}

runTests();
