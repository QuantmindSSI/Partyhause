// Test production database and email functionality
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testProductionDatabase() {
  console.log('🧪 Testing Production Database Connection...')
  
  try {
    // Test 1: Check database connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('events')
      .select('count')
      .limit(1)
      
    if (healthError) {
      console.error('❌ Database connection failed:', healthError.message)
      return false
    }
    
    console.log('✅ Database connection successful')
    
    // Test 2: Check events table schema
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, start_date, end_date, event_type, is_public, invite_image_url')
      .limit(1)
      
    if (eventsError) {
      console.error('❌ Events table schema error:', eventsError.message)
      return false
    }
    
    console.log('✅ Events table schema is correct')
    
    // Test 3: Check email_logs table (if exists)
    const { data: emailLogs, error: emailError } = await supabase
      .from('email_logs')
      .select('id, event_id, status')
      .limit(1)
      
    if (emailError) {
      console.log('⚠️ Email logs table not available yet:', emailError.message)
    } else {
      console.log('✅ Email tracking system is available')
    }
    
    // Test 4: Check storage
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
    
    if (storageError) {
      console.error('❌ Storage access failed:', storageError.message)
    } else {
      console.log('✅ Storage buckets available:', buckets.map(b => b.name))
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Test email system
async function testEmailSystem() {
  console.log('📧 Testing Email System...')
  
  try {
  const response = await fetch('https://partyhause.vercel.app/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Production Test Email',
        type: 'test',
        data: {
          eventName: 'Production Test',
          hostName: 'Test Host',
          eventDate: new Date().toISOString(),
          location: 'Test Location'
        }
      })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Email API is working:', result)
      return true
    } else {
      console.error('❌ Email API failed:', result)
      return false
    }
  } catch (error) {
    console.error('❌ Email test failed:', error.message)
    return false
  }
}

// Run all tests
async function runProductionTests() {
  console.log('🚀 Starting Production Functionality Tests...\n')
  
  const dbTest = await testProductionDatabase()
  console.log('\n')
  const emailTest = await testEmailSystem()
  
  console.log('\n📊 Test Results:')
  console.log(`Database: ${dbTest ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Email System: ${emailTest ? '✅ PASS' : '❌ FAIL'}`)
  
  if (dbTest && emailTest) {
    console.log('\n🎉 Production system is fully functional!')
  } else {
    console.log('\n⚠️ Some systems need attention.')
  }
}

runProductionTests().catch(console.error)