
import React, { useState } from 'react';
import OptionTile from '../components/OptionTile';
import EquipmentDataTable from '../components/EquipmentDataTable';
import { LineType } from '../types/equipmentTypes';
import { Box, Layers } from 'lucide-react';

const Index = () => {
  const [selectedLineType, setSelectedLineType] = useState<LineType | null>(null);

  const handleTileClick = (lineType: LineType) => {
    setSelectedLineType(lineType);
  };

  const handleBack = () => {
    setSelectedLineType(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
        {!selectedLineType ? (
          <>
            <div className="text-center mb-12 mt-16 animate-slide-down">
              <h1 className="text-4xl font-bold tracking-tight mb-3">Equipment Spare Management</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Select a category below to view and manage equipment spare parts data
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <OptionTile 
                title="Module Line"
                description="View and manage module line equipment spare parts"
                icon={<Layers className="h-8 w-8" />}
                onClick={() => handleTileClick(LineType.MODULE)}
              />
              <OptionTile 
                title="Cell Line"
                description="View and manage cell line equipment spare parts"
                icon={<Box className="h-8 w-8" />}
                onClick={() => handleTileClick(LineType.CELL)}
              />
            </div>
          </>
        ) : (
          <EquipmentDataTable 
            lineType={selectedLineType} 
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
