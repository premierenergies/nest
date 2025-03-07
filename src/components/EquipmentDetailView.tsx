
import React, { useState, useEffect } from 'react';
import { EquipmentSpareData, FileAttachment } from '../types/equipmentTypes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAttachments, saveAttachments } from '@/services/equipmentService';
import AttachmentUploader from './AttachmentUploader';
import { X } from 'lucide-react';

interface EquipmentDetailViewProps {
  equipment: EquipmentSpareData | null;
  isOpen: boolean;
  onClose: () => void;
}

const EquipmentDetailView: React.FC<EquipmentDetailViewProps> = ({
  equipment,
  isOpen,
  onClose
}) => {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  
  useEffect(() => {
    if (equipment) {
      // Fetch attachments when equipment changes
      const fetchedAttachments = getAttachments(equipment.SlNo);
      setAttachments(fetchedAttachments);
    }
  }, [equipment]);

  const handleSaveAttachments = (files: File[], type: 'photo' | 'drawing', mode: 'replace' | 'append') => {
    if (equipment) {
      saveAttachments(equipment.SlNo, files, type, mode);
      
      // Refresh attachments
      const updatedAttachments = getAttachments(equipment.SlNo);
      setAttachments(updatedAttachments);
    }
  };

  if (!equipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-xl border-border bg-card shadow-lg backdrop-blur-sm animate-scale-in">
        <DialogHeader className="p-6 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{equipment.EquipmentName} - {equipment.SpareName}</DialogTitle>
            <button onClick={onClose} className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {equipment.EquipmentNo} | {equipment.Line.replace('_', ' ')}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-0">
          <div className="p-6">
            <Tabs defaultValue="details">
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="drawings">Drawings</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-0 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem label="Plant" value={equipment.Plant} />
                  <DetailItem label="Plant Code" value={equipment.PlantCode} />
                  <DetailItem label="Equipment No" value={equipment.EquipmentNo} />
                  <DetailItem label="Machine Supplier" value={equipment.MachineSupplier} />
                  <DetailItem label="Type" value={equipment.Type} />
                  <DetailItem label="Spare Name" value={equipment.SpareName} />
                  <DetailItem label="Material Code (SAP)" value={equipment.MaterialCodeSAP} />
                  <DetailItem label="SAP Short Text" value={equipment.SAPShortText} />
                  <DetailItem label="Full Description" value={equipment.FullDescription} span={2} />
                  <DetailItem label="Part No" value={equipment.PartNo} />
                  <DetailItem label="Make" value={equipment.Make} />
                  <DetailItem label="Category" value={equipment.Category} />
                  <DetailItem label="VED" value={equipment.VED} />
                  <DetailItem label="Vendor" value={equipment.Vendor1} />
                  <DetailItem label="Spare Lifecycle" value={equipment.SpareLifecycle} />
                  <DetailItem label="Frequency (Months)" value={equipment.FrequencyMonths.toString()} />
                  <DetailItem label="Qty Per Frequency" value={equipment.TotalQtyPerFrequency.toString()} />
                  <DetailItem label="Requirement Per Year" value={equipment.RequirementPerYear.toString()} />
                  <DetailItem label="Safety Stock" value={equipment.SafetyStock.toString()} />
                  <DetailItem label="Annual Projection" value={equipment.TotalAnnualQtyProjection.toString()} />
                </div>
              </TabsContent>

              <TabsContent value="photos" className="mt-0 animate-fade-in">
                <AttachmentUploader 
                  type="photo"
                  equipmentId={equipment.SlNo}
                  onSave={(files, mode) => handleSaveAttachments(files, 'photo', mode)}
                  existingAttachments={attachments}
                />
              </TabsContent>

              <TabsContent value="drawings" className="mt-0 animate-fade-in">
                <AttachmentUploader 
                  type="drawing"
                  equipmentId={equipment.SlNo}
                  onSave={(files, mode) => handleSaveAttachments(files, 'drawing', mode)}
                  existingAttachments={attachments}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Helper component for displaying detail items
const DetailItem: React.FC<{ label: string; value: string; span?: number }> = ({ 
  label, 
  value,
  span = 1 
}) => (
  <div className={`p-3 bg-secondary/30 rounded-lg flex flex-col ${span > 1 ? 'md:col-span-' + span : ''}`}>
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default EquipmentDetailView;
