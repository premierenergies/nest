export interface EquipmentSpareData {
  SlNo: number;
  PlantCode: string;
  Plant: string;
  Line: string;
  EquipmentName: string;
  EquipmentNo: string;
  MachineSupplier: string;
  Type: string;
  SpareName: string;
  MaterialSAPCode: string;
  SAPShortText: string;
  FullDescription: string;
  PartNo: string;
  Make: string;
  Category: string;
  VED: string;
  Vendor1: string;
  SpareLifecycle: string;
  FrequencyMonths: number;
  TotalQtyPerFrequency: number;
  RequirementPerYear: number;
  SafetyStock: number;
  TotalAnnualQtyProjection: number;
  UploadPhotos: string | null; // Stored as JSON string
  Drawing: string | null;      // Stored as JSON string
}

export interface FileAttachment {
  name: string;
  url: string;
  type: 'photo' | 'drawing';
}

export enum LineType {
  MODULE = 'MODULE_LINE',
  CELL = 'CELL_LINE'
}
