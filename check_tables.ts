import { supabase } from "./src/integrations/supabase/client";

async function checkTables() {
  const { data, error } = await supabase.from('promos').select('*').limit(1);
  if (error) {
    console.log("Error or table does not exist:", error.message);
  } else {
    console.log("Table exists:", data);
  }
}

checkTables();
