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

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

const EquipmentDetailView: React.FC<EquipmentDetailViewProps> = ({ equipment, isOpen, onClose }) => {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [editField, setEditField] = useState<string | null>(null);
  const [newValue, setNewValue] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load attachments (photos and drawings)
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

  // When a user clicks "Edit" on a field:
  const handleEditButtonClick = (field: string, value: string) => {
    if (editField === field) {
      // If already editing this field, show the confirmation dialog
      setShowConfirmDialog(true);
    } else {
      setEditField(field);
      setNewValue(value);
    }
  };

  // When user confirms the update
  const handleConfirmUpdate = async () => {
    if (editField && newValue !== null && equipment) {
      try {
        const response = await fetch(`${apiBaseUrl}/equipment/${equipment.SlNo}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ [editField]: newValue })
        });
        if (response.ok) {
          console.log(`Field "${editField}" updated from "${equipment[editField as keyof EquipmentSpareData]}" to "${newValue}" for entry ${equipment.SlNo}`);
          setShowConfirmDialog(false);
          setEditField(null);
          setNewValue(null);
          // Optionally refresh or update the equipment object in parent state
        } else {
          alert('Failed to update the field');
        }
      } catch (error) {
        console.error('Error updating field:', error);
      }
    }
  };

  // Delete a single attachment
  const handleDeleteAttachment = async (attachment: FileAttachment, type: 'photo' | 'drawing') => {
    const confirmed = window.confirm(`Are you sure you want to delete ${attachment.name}?`);
    if (!confirmed) return;
    try {
      const response = await fetch(`${apiBaseUrl}/equipment/${equipment?.SlNo}/attachments?type=${type}&url=${encodeURIComponent(attachment.url)}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setAttachments(prev => prev.filter(att => att.url !== attachment.url));
      } else {
        alert('Failed to delete the attachment');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  if (!equipment) return null;

  const photoAttachments = attachments.filter(a => a.type === 'photo');
  const drawingAttachments = attachments.filter(a => a.type === 'drawing');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-xl border border-gray-300 bg-card shadow-lg backdrop-blur-sm animate-scale-in">
        <DialogHeader className="p-6 pb-2 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {equipment.EquipmentName} - {equipment.SpareName}
            </DialogTitle>
            <button onClick={onClose} className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="text-sm text-gray-500 mt-1">
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
                    {Object.entries(equipment).map(([key, value]) => (
                      <div key={key} className="p-3 bg-secondary/30 rounded-lg flex flex-col">
                        <span className="text-xs text-gray-600">{key}</span>
                        <span className="font-medium">
                          {editField === key ? (
                            <input
                              type="text"
                              value={newValue || value}
                              onChange={(e) => setNewValue(e.target.value)}
                              className="w-full p-2 rounded bg-white border-2 border-blue-500"
                            />
                          ) : (
                            value
                          )}
                        </span>
                        <button
                          className={`mt-2 text-sm ${editField === key ? 'text-green-600' : 'text-primary'}`}
                          onClick={() => handleEditButtonClick(key, String(value))}
                        >
                          {editField === key ? 'Save' : 'Edit'}
                        </button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="photos" className="mt-0 animate-fade-in">
                  <AttachmentUploader 
                    type="photo"
                    equipmentId={equipment.SlNo}
                    onSave={(files, mode) => handleSaveAttachments(files, 'photo', mode)}
                    existingAttachments={photoAttachments}
                  />
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {photoAttachments.map((att, index) => (
                      <div key={index} className="relative">
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-full h-auto object-cover rounded shadow"
                        />
                        <button
                          onClick={() => handleDeleteAttachment(att, 'photo')}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="drawings" className="mt-0 animate-fade-in">
                  <AttachmentUploader 
                    type="drawing"
                    equipmentId={equipment.SlNo}
                    onSave={(files, mode) => handleSaveAttachments(files, 'drawing', mode)}
                    existingAttachments={drawingAttachments}
                  />
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {drawingAttachments.map((att, index) => (
                      <div key={index} className="relative">
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-full h-auto object-cover rounded shadow"
                        />
                        <button
                          onClick={() => handleDeleteAttachment(att, 'drawing')}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <Dialog open={showConfirmDialog} onOpenChange={(open) => !open && setShowConfirmDialog(false)}>
          <DialogContent className="sm:max-w-sm p-6">
            <DialogHeader>
              <DialogTitle>Confirm Update</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <p>
                Are you sure you want to update the field "{editField}" from "
                {equipment && equipment[editField as keyof EquipmentSpareData]}" to "
                {newValue}"?
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-md mr-2"
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setEditField(null);
                    setNewValue(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md"
                  onClick={handleConfirmUpdate}
                >
                  Confirm
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default EquipmentDetailView;
