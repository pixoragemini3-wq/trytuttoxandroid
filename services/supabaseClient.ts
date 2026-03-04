import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const saveSimulation = async (simulationData: any) => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found. Simulation not saved.');
    return null;
  }

  const { data, error } = await supabase
    .from('gps_simulations')
    .insert([simulationData])
    .select();

  if (error) {
    console.error('Error saving simulation:', error);
    return null;
  }

  return data;
};
