import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for navigation
import OptionTile from '../components/OptionTile';
import EquipmentDataTable from '../components/EquipmentDataTable';
import { LineType } from '../types/equipmentTypes';
import { Box, Layers, LogOut } from 'lucide-react'; // Added LogOut icon

const Index = () => {
  const [selectedLineType, setSelectedLineType] = useState<LineType | null>(null);
  const navigate = useNavigate(); // Added navigate for redirection

  const handleTileClick = (lineType: LineType) => {
    setSelectedLineType(lineType);
  };

  const handleBack = () => {
    setSelectedLineType(null);
  };

  // Handle logout
  const handleLogout = () => {
    // Here you can add code to clear session or localStorage if needed
    localStorage.removeItem("user");  // Example for clearing the session
    navigate('/');  // Redirect to login page after logout
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      {/* Header with logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold tracking-tight">Equipment Spare Management</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-2"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* When a tile is not selected, use max-w-7xl; when selected, use full width */}
      <div className={`${selectedLineType ? 'w-full' : 'max-w-7xl'} w-full mx-auto flex-1 flex flex-col`}>
        {!selectedLineType ? (
          <>
            <div className="text-center mb-12 mt-16 animate-slide-down">
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
          // Wrap the data table in an overflow-x-auto container so that a horizontal scrollbar appears when needed.
          <div className="overflow-x-auto">
            <EquipmentDataTable lineType={selectedLineType} onBack={handleBack} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
