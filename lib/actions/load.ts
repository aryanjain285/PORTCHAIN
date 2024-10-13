import Papa from 'papaparse';

interface Port {
  portid: string;
  ISO3: string;
  continent: string;
  lat: number;
  lon: number;
  vessel_count_total: number;
  // Add other fields as needed
}

export const loadPortData = async (): Promise<Port[]> => {
  const response = await fetch('/filtered_ports.csv');
  const reader = response.body?.getReader();
  const result = await reader?.read();
  const decoder = new TextDecoder('utf-8');
  const csv = decoder.decode(result?.value);
  const { data } = Papa.parse(csv, { header: true, dynamicTyping: true });
  return data as Port[];
};