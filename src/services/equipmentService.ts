
import { EquipmentSpareData, FileAttachment, LineType } from "../types/equipmentTypes";

// In-memory storage for file attachments
const attachmentsMap = new Map<number, FileAttachment[]>();

// Create mock data for the equipment spare parts
const generateMockData = (): EquipmentSpareData[] => {
  const mockData: EquipmentSpareData[] = [];
  
  const lineTypes = [LineType.MODULE, LineType.CELL];
  const equipmentNames = ["Conveyor", "Robot", "Press", "Welder", "Dryer", "Mixer", "Pump", "Compressor"];
  const suppliers = ["Siemens", "ABB", "Bosch", "Fanuc", "Mitsubishi", "Schneider", "Omron"];
  const spareNames = ["Motor", "Bearing", "Belt", "Pump", "Valve", "Sensor", "Controller", "Filter"];
  const categories = ["Mechanical", "Electrical", "Electronic", "Hydraulic", "Pneumatic"];
  const vedTypes = ["Vital", "Essential", "Desirable"];
  
  for (let i = 1; i <= 100; i++) {
    const lineType = lineTypes[i % 2];
    mockData.push({
      SlNo: i,
      PlantCode: `P${Math.floor(i / 10) + 1}`,
      Plant: `Plant ${Math.floor(i / 20) + 1}`,
      Line: lineType,
      EquipmentName: equipmentNames[i % equipmentNames.length],
      EquipmentNo: `EQ-${1000 + i}`,
      MachineSupplier: suppliers[i % suppliers.length],
      Type: `Type-${i % 5 + 1}`,
      SpareName: spareNames[i % spareNames.length],
      MaterialCodeSAP: `SAP-${10000 + i}`,
      SAPShortText: `${spareNames[i % spareNames.length]} ${i % 20 + 1}`,
      FullDescription: `${spareNames[i % spareNames.length]} for ${equipmentNames[i % equipmentNames.length]} - ${suppliers[i % suppliers.length]}`,
      PartNo: `PART-${20000 + i}`,
      Make: suppliers[Math.floor(Math.random() * suppliers.length)],
      Category: categories[i % categories.length],
      VED: vedTypes[i % vedTypes.length],
      Vendor1: suppliers[Math.floor(Math.random() * suppliers.length)],
      SpareLifecycle: `${Math.floor(Math.random() * 24) + 6} months`,
      FrequencyMonths: Math.floor(Math.random() * 12) + 1,
      TotalQtyPerFrequency: Math.floor(Math.random() * 10) + 1,
      RequirementPerYear: Math.floor(Math.random() * 50) + 5,
      SafetyStock: Math.floor(Math.random() * 20) + 2,
      TotalAnnualQtyProjection: Math.floor(Math.random() * 100) + 10,
      UploadPhotos: null,
      Drawing: null
    });
  }
  
  return mockData;
};

// Initialize mock data
const equipmentData = generateMockData();

// Get equipment data filtered by line type
export const getEquipmentByLineType = (lineType: LineType): EquipmentSpareData[] => {
  return equipmentData.filter(item => item.Line === lineType);
};

// Get a specific equipment item
export const getEquipmentById = (id: number): EquipmentSpareData | undefined => {
  return equipmentData.find(item => item.SlNo === id);
};

// Get attachments for a specific equipment item
export const getAttachments = (equipmentId: number): FileAttachment[] => {
  return attachmentsMap.get(equipmentId) || [];
};

// Save attachments for a specific equipment item
export const saveAttachments = (
  equipmentId: number, 
  files: File[], 
  type: 'photo' | 'drawing', 
  mode: 'replace' | 'append' = 'append'
): void => {
  const existingAttachments = attachmentsMap.get(equipmentId) || [];
  
  let updatedAttachments: FileAttachment[];
  
  if (mode === 'replace') {
    // Remove all existing attachments of the specified type
    updatedAttachments = existingAttachments.filter(att => att.type !== type);
  } else {
    updatedAttachments = [...existingAttachments];
  }
  
  // Add new attachments
  const newAttachments: FileAttachment[] = files.map(file => ({
    name: file.name,
    url: URL.createObjectURL(file),
    type,
    file
  }));
  
  updatedAttachments = [...updatedAttachments, ...newAttachments];
  attachmentsMap.set(equipmentId, updatedAttachments);
  
  // Update the equipment data object with the new attachment info
  const equipment = equipmentData.find(item => item.SlNo === equipmentId);
  if (equipment) {
    if (type === 'photo') {
      equipment.UploadPhotos = files;
    } else {
      equipment.Drawing = files;
    }
  }
};

// Check if attachments exist for a specific equipment item and type
export const hasAttachments = (
  equipmentId: number, 
  type: 'photo' | 'drawing'
): boolean => {
  const attachments = attachmentsMap.get(equipmentId) || [];
  return attachments.some(att => att.type === type);
};
