import Papa from 'papaparse';

interface Port {
  portid: string;
  portname: string;
  ISO3: string;
  continent: string;
  lat: number;
  lon: number;
  vessel_count_total: number;
  vessel_count_container: number;
  vessel_count_dry_bulk: number;
  vessel_count_general_cargo: number;
  vessel_count_RoRo: number;
  import_tanker: number;
  import_cargo: number;
  import: number;
  export_container: number;
  export_dry_bulk: number;
  export_general_cargo: number;
  export_roro: number;
  export_tanker: number;
  export_cargo: number;
  export: number;
  resilience_cluster?: number;
}

export const loadPortData = async (): Promise<Port[]> => {
  try {
    const response = await fetch('/result.csv');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const reader = response.body?.getReader();
    const result = await reader?.read();
    const decoder = new TextDecoder('utf-8');
    const csv = decoder.decode(result?.value);
    
    const { data } = Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      transform: (value, field) => {
        if (field === 'resilience_cluster' && typeof value === 'string') {
          return parseFloat(value);
        }
        return value;
      }
    });

    console.log('Parsed data:', data); // Log the parsed data

    // Check the structure of the first few items
    data.slice(0, 5).forEach((item: any, index: number) => {
      console.log(`Item ${index}:`, item);
      console.log(`resilience_index type:`, typeof item.resilience_cluster);
    });

    return data as Port[];
  } catch (error) {
    console.error('Error loading port data:', error);
    throw error;
  }
};