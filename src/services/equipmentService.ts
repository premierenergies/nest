import { EquipmentSpareData, FileAttachment, LineType } from "../types/equipmentTypes";

// Use Vite environment variable syntax to access the API base URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL;  // Access the environment variable

// Fetch equipment data filtered by line type
export const fetchEquipmentByLineType = async (lineType: LineType): Promise<EquipmentSpareData[]> => {
  const response = await fetch(`${BASE_URL}/equipment?line=${encodeURIComponent(lineType)}`);
  if (!response.ok) throw new Error('Error fetching equipment data');
  return response.json();
};

// Fetch a specific equipment item by its id
export const fetchEquipmentById = async (id: number): Promise<EquipmentSpareData> => {
  const response = await fetch(`${BASE_URL}/equipment/${id}`);
  if (!response.ok) throw new Error('Error fetching equipment item');
  return response.json();
};

// Fetch attachments for a given equipment item and attachment type
export const fetchAttachments = async (equipmentId: number, type: 'photo' | 'drawing'): Promise<FileAttachment[]> => {
  const response = await fetch(`${BASE_URL}/equipment/${equipmentId}/attachments?type=${type}`);
  if (!response.ok) throw new Error('Error fetching attachments');
  return response.json();
};

// Upload attachments for an equipment item
export const uploadAttachments = async (
  equipmentId: number,
  files: File[],
  type: 'photo' | 'drawing',
  mode: 'append' | 'replace'
): Promise<FileAttachment[]> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  const response = await fetch(`${BASE_URL}/equipment/${equipmentId}/upload?type=${type}&mode=${mode}`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Error uploading attachments');
  const result = await response.json();
  return result.attachments;
};
