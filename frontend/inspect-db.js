const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://meipvokmbczfnwvzewok.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1laXB2b2ttYmN6Zm53dnpld29rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDM3MDI5NiwiZXhwIjoyMDk5OTQ2Mjk2fQ.fHuYUnXYA26h1YzBUKRNYRuL4RmOu-WG5Vebrmhj0-g"
);

async function test() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Error fetching products:', error);
  } else {
    console.log('Sample product columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data');
  }
}

test();
