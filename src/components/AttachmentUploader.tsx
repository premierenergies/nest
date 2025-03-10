import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileAttachment } from '@/types/equipmentTypes';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { File, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AttachmentUploaderProps {
  type: 'photo' | 'drawing';
  equipmentId: number;
  onSave: (files: File[], mode: 'replace' | 'append') => void;
  existingAttachments: FileAttachment[];
}

const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  type,
  equipmentId,
  onSave,
  existingAttachments
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const filteredAttachments = existingAttachments.filter(att => att.type === type);
  const hasExisting = filteredAttachments.length > 0;
  
  const typeLabel = type === 'photo' ? 'Photo' : 'Drawing';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      if (hasExisting) {
        setSelectedFiles(files);
        setIsDialogOpen(true);
      } else {
        // Use the local files variable directly instead of relying on selectedFiles state.
        onSave(files, 'append');
        toast(`${typeLabel}${files.length > 1 ? 's' : ''} added successfully`, {
          description: `${files.length} file${files.length > 1 ? 's' : ''} added`,
          action: {
            label: "Dismiss",
            onClick: () => {}
          }
        });
      }
    }
  };  

  const handleSave = (mode: 'replace' | 'append') => {
    onSave(selectedFiles, mode);
    setSelectedFiles([]);
    setIsDialogOpen(false);
    toast(`${typeLabel}${selectedFiles.length > 1 ? 's' : ''} ${mode === 'replace' ? 'replaced' : 'added'} successfully`, {
      description: `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} ${mode === 'replace' ? 'replaced' : 'added'}`,
      action: {
        label: "Dismiss",
        onClick: () => {}
      }
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeAttachment = (attachmentIndex: number) => {
    toast(`${typeLabel} removed`, {
      description: `${filteredAttachments[attachmentIndex].name} was removed`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{typeLabel}s</h3>
        <div className="min-h-[100px] p-4 border border-dashed rounded-lg bg-secondary/30 transition-colors hover:bg-secondary/50">
          {filteredAttachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredAttachments.map((attachment, index) => (
                <div key={`${attachment.name}-${index}`} className="file-item group">
                  <File className="w-4 h-4 text-primary" />
                  <span className="flex-1 truncate">{attachment.name}</span>
                  <button 
                    onClick={() => removeAttachment(index)}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
              <Upload className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No {typeLabel.toLowerCase()}s uploaded</p>
              <p className="text-xs">Click the button below to upload</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept={type === 'photo' ? "image/*" : ".pdf,.dwg,.dxf"}
        />
        <Button variant="outline" onClick={handleButtonClick} className="w-full">
          <Upload className="w-4 h-4 mr-2" /> Upload {typeLabel}s
        </Button>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-md animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>Existing {typeLabel}s Found</AlertDialogTitle>
            <AlertDialogDescription>
              There are already {filteredAttachments.length} {typeLabel.toLowerCase()}s attached to this item. 
              Would you like to keep the existing {typeLabel.toLowerCase()}s and add new ones, or replace them all?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSave('append')} className="bg-primary">
              Keep & Add New
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleSave('replace')} className="bg-destructive">
              Replace All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttachmentUploader;
