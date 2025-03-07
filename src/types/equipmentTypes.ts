
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
  MaterialCodeSAP: string;
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
  UploadPhotos: File[] | null;
  Drawing: File[] | null;
}

export interface FileAttachment {
  name: string;
  url: string;
  type: 'photo' | 'drawing';
  file: File;
}

export enum LineType {
  MODULE = 'Module_Line',
  CELL = 'Cell_Line'
}
