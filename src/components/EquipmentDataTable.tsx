import React, { useState } from 'react';
import { EquipmentSpareData, LineType } from '../types/equipmentTypes';
import { useQuery } from '@tanstack/react-query';
import { fetchEquipmentByLineType } from '../services/equipmentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileImage, FileSymlink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import EquipmentDetailView from './EquipmentDetailView';
import { Badge } from '@/components/ui/badge';

interface EquipmentDataTableProps {
  lineType: LineType;
  onBack: () => void;
}

const EquipmentDataTable: React.FC<EquipmentDataTableProps> = ({ lineType, onBack }) => {
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentSpareData | null>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);

  const { data: equipmentData, isLoading, error, refetch } = useQuery<EquipmentSpareData[]>({
    queryKey: ['equipment', lineType],
    queryFn: () => fetchEquipmentByLineType(lineType)
  });

  const handleRowClick = (equipment: EquipmentSpareData) => {
    // Use the fixed SlNo from the DB
    console.log('Selected equipment:', equipment);
    setSelectedEquipment(equipment);
    setDetailViewOpen(true);
  };

  const closeDetailView = () => {
    setDetailViewOpen(false);
    refetch();
  };

  const displayType = lineType === LineType.MODULE ? 'Module Line' : 'Cell Line';

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{displayType} Equipment</h1>
          <p className="text-muted-foreground">
            Showing all spare parts for {displayType.toLowerCase()} equipment
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-muted-foreground">Loading equipment data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-danger">Error loading data</p>
        </div>
      ) : (
        <ScrollArea className="flex-1 rounded-lg border border-border bg-card shadow-sm overflow-auto">
          <table className="data-table min-w-full">
            <thead>
              <tr>
                <th>SlNo</th>
                <th>PlantCode</th>
                <th>Plant</th>
                <th>Line</th>
                <th>EquipmentName</th>
                <th>EquipmentNo</th>
                <th>MachineSupplier</th>
                <th>Type</th>
                <th>SpareName</th>
                <th>MaterialSAPCode</th>
                <th>SAPShortText</th>
                <th>FullDescription</th>
                <th>PartNo</th>
                <th>Make</th>
                <th>Category</th>
                <th>VED</th>
                <th>Vendor1</th>
                <th>SpareLifecycle</th>
                <th>FrequencyMonths</th>
                <th>TotalQtyPerFrequency</th>
                <th>RequirementPerYear</th>
                <th>SafetyStock</th>
                <th>TotalAnnualQtyProjection</th>
                <th>Attachments</th>
              </tr>
            </thead>
            <tbody>
              {equipmentData.map((equipment) => {
                const slNo = equipment.SlNo || (equipment as any).slno;
                const key = slNo; // Using SlNo as unique key
                const hasPhotos = equipment.UploadPhotos && equipment.UploadPhotos !== 'null';
                const hasDrawings = equipment.Drawing && equipment.Drawing !== 'null';
                return (
                  <tr key={key} onClick={() => handleRowClick(equipment)} className="cursor-pointer">
                    <td>{slNo}</td>
                    <td>{equipment.PlantCode}</td>
                    <td>{equipment.Plant}</td>
                    <td>{equipment.Line}</td>
                    <td>{equipment.EquipmentName}</td>
                    <td>{equipment.EquipmentNo}</td>
                    <td>{equipment.MachineSupplier}</td>
                    <td>{equipment.Type}</td>
                    <td>{equipment.SpareName}</td>
                    <td>{equipment.MaterialSAPCode}</td>
                    <td>{equipment.SAPShortText}</td>
                    <td>{equipment.FullDescription}</td>
                    <td>{equipment.PartNo}</td>
                    <td>{equipment.Make}</td>
                    <td>{equipment.Category}</td>
                    <td>{equipment.VED}</td>
                    <td>{equipment.Vendor1}</td>
                    <td>{equipment.SpareLifecycle}</td>
                    <td>{equipment.FrequencyMonths}</td>
                    <td>{equipment.TotalQtyPerFrequency}</td>
                    <td>{equipment.RequirementPerYear}</td>
                    <td>{equipment.SafetyStock}</td>
                    <td>{equipment.TotalAnnualQtyProjection}</td>
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

      <EquipmentDetailView equipment={selectedEquipment} isOpen={detailViewOpen} onClose={closeDetailView} />
    </div>
  );
};

export default EquipmentDataTable;
