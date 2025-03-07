
import React, { useState, useEffect } from 'react';
import { EquipmentSpareData, LineType } from '../types/equipmentTypes';
import { getEquipmentByLineType, hasAttachments } from '../services/equipmentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileImage, FileSymlink, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import EquipmentDetailView from './EquipmentDetailView';
import { Badge } from '@/components/ui/badge';

interface EquipmentDataTableProps {
  lineType: LineType;
  onBack: () => void;
}

const EquipmentDataTable: React.FC<EquipmentDataTableProps> = ({ lineType, onBack }) => {
  const [equipmentData, setEquipmentData] = useState<EquipmentSpareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentSpareData | null>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);

  useEffect(() => {
    // Simulating loading delay for demonstration purposes
    const timer = setTimeout(() => {
      const data = getEquipmentByLineType(lineType);
      setEquipmentData(data);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [lineType]);

  const handleRowClick = (equipment: EquipmentSpareData) => {
    setSelectedEquipment(equipment);
    setDetailViewOpen(true);
  };

  const closeDetailView = () => {
    setDetailViewOpen(false);
  };

  const displayType = lineType === LineType.MODULE ? 'Module Line' : 'Cell Line';

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{displayType} Equipment</h1>
          <p className="text-muted-foreground">Showing all spare parts for {displayType.toLowerCase()} equipment</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-muted-foreground">Loading equipment data...</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 rounded-lg border border-border bg-card shadow-sm">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-14">Sl. No</th>
                <th>Equipment</th>
                <th>Spare Part</th>
                <th>SAP Code</th>
                <th>Part No</th>
                <th>Supplier</th>
                <th className="w-32">Attachments</th>
              </tr>
            </thead>
            <tbody>
              {equipmentData.map(equipment => {
                const hasPhotos = hasAttachments(equipment.SlNo, 'photo');
                const hasDrawings = hasAttachments(equipment.SlNo, 'drawing');
                
                return (
                  <tr 
                    key={equipment.SlNo} 
                    onClick={() => handleRowClick(equipment)}
                    className="cursor-pointer"
                  >
                    <td>{equipment.SlNo}</td>
                    <td>{equipment.EquipmentName}</td>
                    <td>{equipment.SpareName}</td>
                    <td>{equipment.MaterialCodeSAP}</td>
                    <td>{equipment.PartNo}</td>
                    <td>{equipment.MachineSupplier}</td>
                    <td>
                      <div className="flex space-x-1 items-center">
                        {hasPhotos && (
                          <Badge variant="outline" className="bg-primary/10 border-primary/20">
                            <FileImage className="h-3 w-3 mr-1" />
                            Photos
                          </Badge>
                        )}
                        {hasDrawings && (
                          <Badge variant="outline" className="bg-secondary border-primary/20">
                            <FileSymlink className="h-3 w-3 mr-1" />
                            Drawings
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      )}

      <EquipmentDetailView 
        equipment={selectedEquipment} 
        isOpen={detailViewOpen}
        onClose={closeDetailView}
      />
    </div>
  );
};

export default EquipmentDataTable;
