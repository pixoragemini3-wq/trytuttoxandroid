import { SavedSimulation } from '../components/gps/types';

export const saveSimulationLocally = async (simulation: SavedSimulation) => {
  try {
    const existing = localStorage.getItem('gps_simulations');
    let simulations: SavedSimulation[] = [];
    if (existing) {
      simulations = JSON.parse(existing);
    }
    
    // Add new simulation at the beginning
    simulations.unshift(simulation);
    
    // Keep only the last 10 simulations to avoid filling up localStorage
    if (simulations.length > 10) {
      simulations = simulations.slice(0, 10);
    }
    
    localStorage.setItem('gps_simulations', JSON.stringify(simulations));
    
    // Simulate a tiny delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    return simulation;
  } catch (e) {
    console.error('Failed to save simulation locally', e);
    throw e;
  }
};

export const getSimulationsLocally = async (): Promise<SavedSimulation[]> => {
  try {
    const existing = localStorage.getItem('gps_simulations');
    if (existing) {
      return JSON.parse(existing);
    }
    return [];
  } catch (e) {
    console.error('Failed to get local simulations', e);
    return [];
  }
};
