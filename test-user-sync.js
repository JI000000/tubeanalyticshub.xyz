/**
 * Test script for user sync functionality
 * This script tests the core user sync functions
 */

const { createSupabaseServiceClient } = require('./src/lib/supabase');

// Mock session data for testing
const mockSession = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    provider: 'github'
  }
};

async function testUserSync() {
  console.log('🧪 Testing User Sync Functionality...\n');

  try {
    // Import user sync functions
    const {
      initializeNewUser,
      updateUserPreferences,
      migrateAnonymousTrialData,
      getUserFullData,
      syncUserProfile,
      performFullUserSync
    } = require('./src/lib/user-sync');

    // Test 1: Initialize new user
    console.log('1️⃣ Testing user initialization...');
    const initResult = await initializeNewUser(mockSession);
    console.log('✅ User initialization:', initResult.success ? 'SUCCESS' : 'FAILED');
    if (!initResult.success) {
      console.log('❌ Error:', initResult.error);
    }

    // Test 2: Get user data
    console.log('\n2️⃣ Testing get user data...');
    const userData = await getUserFullData(mockSession.user.id);
    console.log('✅ Get user data:', userData.success ? 'SUCCESS' : 'FAILED');
    if (userData.success) {
      console.log('📊 User plan:', userData.userData?.plan);
      console.log('📊 User quota:', `${userData.userData?.quota_used}/${userData.userData?.quota_limit}`);
    }

    // Test 3: Update preferences
    console.log('\n3️⃣ Testing preference update...');
    const prefResult = await updateUserPreferences(mockSession.user.id, {
      theme: 'dark',
      language: 'en'
    });
    console.log('✅ Update preferences:', prefResult.success ? 'SUCCESS' : 'FAILED');

    // Test 4: Sync profile
    console.log('\n4️⃣ Testing profile sync...');
    const profileResult = await syncUserProfile(mockSession.user.id, {
      name: 'Updated Test User',
      image: 'https://example.com/new-avatar.jpg'
    });
    console.log('✅ Profile sync:', profileResult.success ? 'SUCCESS' : 'FAILED');

    // Test 5: Full sync
    console.log('\n5️⃣ Testing full sync...');
    const fullSyncResult = await performFullUserSync(mockSession, 'test-fingerprint-123');
    console.log('✅ Full sync:', fullSyncResult.success ? 'SUCCESS' : 'FAILED');
    if (fullSyncResult.migration) {
      console.log('📊 Migration result:', fullSyncResult.migration.success ? 'SUCCESS' : 'FAILED');
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run tests
testUserSync().then(() => {
  console.log('\n✨ Test script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});