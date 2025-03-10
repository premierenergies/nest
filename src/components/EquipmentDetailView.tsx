import React, { useState, useEffect } from 'react';
import { EquipmentSpareData, FileAttachment } from '../types/equipmentTypes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchAttachments, uploadAttachments } from '@/services/equipmentService';
import AttachmentUploader from './AttachmentUploader';
import { X } from 'lucide-react';

interface EquipmentDetailViewProps {
  equipment: EquipmentSpareData | null;
  isOpen: boolean;
  onClose: () => void;
}

const EquipmentDetailView: React.FC<EquipmentDetailViewProps> = ({ equipment, isOpen, onClose }) => {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  const loadAttachments = async () => {
    if (equipment) {
      try {
        const [photos, drawings] = await Promise.all([
          fetchAttachments(equipment.SlNo, 'photo'),
          fetchAttachments(equipment.SlNo, 'drawing')
        ]);
        setAttachments([...photos, ...drawings]);
      } catch (error) {
        console.error('Error loading attachments:', error);
      }
    }
  };

  useEffect(() => {
    if (equipment) {
      loadAttachments();
    }
  }, [equipment]);

  const handleSaveAttachments = async (files: File[], type: 'photo' | 'drawing', mode: 'replace' | 'append') => {
    if (equipment) {
      try {
        await uploadAttachments(equipment.SlNo, files, type, mode);
        loadAttachments();
      } catch (error) {
        console.error('Error saving attachments:', error);
      }
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

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(90vh-120px)]">
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
                    <DetailItem label="PlantCode" value={equipment.PlantCode} />
                    <DetailItem label="Line" value={equipment.Line} />
                    <DetailItem label="EquipmentName" value={equipment.EquipmentName} />
                    <DetailItem label="EquipmentNo" value={equipment.EquipmentNo} />
                    <DetailItem label="MachineSupplier" value={equipment.MachineSupplier} />
                    <DetailItem label="Type" value={equipment.Type} />
                    <DetailItem label="SpareName" value={equipment.SpareName} />
                    <DetailItem label="MaterialSAPCode" value={equipment.MaterialSAPCode} />
                    <DetailItem label="SAPShortText" value={equipment.SAPShortText} />
                    <DetailItem label="FullDescription" value={equipment.FullDescription} span={2} />
                    <DetailItem label="PartNo" value={equipment.PartNo} />
                    <DetailItem label="Make" value={equipment.Make} />
                    <DetailItem label="Category" value={equipment.Category} />
                    <DetailItem label="VED" value={equipment.VED} />
                    <DetailItem label="Vendor1" value={equipment.Vendor1} />
                    <DetailItem label="SpareLifecycle" value={equipment.SpareLifecycle} />
                    <DetailItem label="FrequencyMonths" value={equipment.FrequencyMonths.toString()} />
                    <DetailItem label="TotalQtyPerFrequency" value={equipment.TotalQtyPerFrequency.toString()} />
                    <DetailItem label="RequirementPerYear" value={equipment.RequirementPerYear.toString()} />
                    <DetailItem label="SafetyStock" value={equipment.SafetyStock.toString()} />
                    <DetailItem label="TotalAnnualQtyProjection" value={equipment.TotalAnnualQtyProjection.toString()} />
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DetailItem: React.FC<{ label: string; value: string; span?: number }> = ({ label, value, span = 1 }) => (
  <div className={`p-3 bg-secondary/30 rounded-lg flex flex-col ${span > 1 ? 'md:col-span-' + span : ''}`}>
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default EquipmentDetailView;
