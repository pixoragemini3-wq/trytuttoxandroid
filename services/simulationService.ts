import { supabase } from './supabaseClient';
import { SavedSimulation } from '../components/gps/types';

export const saveSimulationToSupabase = async (simulation: SavedSimulation) => {
  if (!supabase) {
    console.warn('Supabase client not initialized. Skipping save.');
    return null;
  }

  const { data, error } = await supabase
    .from('gps_simulations')
    .insert([
      { 
        id: simulation.id,
        created_at: simulation.date,
        grade: simulation.state.setup.grade,
        post_type: simulation.state.setup.postType,
        cdc: simulation.state.setup.cdc,
        fascia: simulation.state.setup.fascia,
        access_score: simulation.scores.access,
        cultural_score: simulation.scores.cultural,
        service_score: simulation.scores.service,
        total_score: simulation.scores.total,
        details: simulation.state
      }
    ]);
    
  if (error) throw error;
  return data;
};

export const getSimulationsFromSupabase = async () => {
  if (!supabase) {
    console.warn('Supabase client not initialized. Skipping fetch.');
    return [];
  }

  const { data, error } = await supabase
    .from('gps_simulations')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return data.map((row: any) => ({
    id: row.id,
    date: row.created_at,
    state: row.details,
    scores: {
      access: row.access_score,
      cultural: row.cultural_score,
      service: row.service_score,
      total: row.total_score
    }
  }));
};
