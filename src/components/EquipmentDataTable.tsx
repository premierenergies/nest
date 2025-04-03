// root/src/components/EquipmentDataTable.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EquipmentSpareData, LineType } from '../types/equipmentTypes';
import { fetchEquipmentByLineType } from '../services/equipmentService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileImage, FileSymlink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import EquipmentDetailView from './EquipmentDetailView';
import { Badge } from '@/components/ui/badge';

// Helper function to escape special regex characters.
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightText = (text: any, query: string): JSX.Element => {
  const str = text !== undefined && text !== null ? String(text) : '';
  if (!query) return <>{str}</>;
  const escapedQuery = escapeRegExp(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = str.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        new RegExp(escapedQuery, 'i').test(part) ? (
          <span key={i} className="bg-yellow-300">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
};

const EquipmentDataTable: React.FC<{ lineType: LineType; onBack: () => void }> = ({ lineType, onBack }) => {
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentSpareData | null>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [filterPlantCode, setFilterPlantCode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: equipmentData, isLoading, error, refetch } = useQuery<EquipmentSpareData[]>({
    queryKey: ['equipment', lineType],
    queryFn: () => fetchEquipmentByLineType(lineType)
  });

  const handleRowClick = (equipment: EquipmentSpareData) => {
    console.log('Selected equipment:', equipment);
    setSelectedEquipment(equipment);
    setDetailViewOpen(true);
  };

  const closeDetailView = () => {
    setDetailViewOpen(false);
    refetch();
  };

  const displayType = lineType === LineType.MODULE ? 'Module Line' : 'Cell Line';

  const filteredData = useMemo(() => {
    if (!equipmentData) return [];
    return equipmentData.filter((equipment) => {
      if (filterPlantCode !== 'all' && String(equipment.PlantCode) !== filterPlantCode) {
        return false;
      }
      if (debouncedSearchQuery) {
        const lowerQuery = debouncedSearchQuery.toLowerCase();
        let found = false;
        for (const key in equipment) {
          const value = equipment[key];
          if (value !== null && (typeof value === 'string' || typeof value === 'number')) {
            if (String(value).toLowerCase().includes(lowerQuery)) {
              found = true;
              break;
            }
          }
        }
        if (!found) return false;
      }
      return true;
    });
  }, [equipmentData, filterPlantCode, debouncedSearchQuery]);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0">
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
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
          <select
            value={filterPlantCode}
            onChange={(e) => setFilterPlantCode(e.target.value)}
            className="border border-gray-300 rounded p-2"
          >
            <option value="all">All PlantCodes</option>
            <option value="2000">2000</option>
            <option value="5000">5000</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="border border-gray-300 rounded p-2"
          />
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
        <ScrollArea className="rounded-lg border border-border bg-card shadow-sm">
          {/* Ensure horizontal scrolling and sticky header */}
          <div className="overflow-x-auto relative">
            <table
              className="data-table w-full min-w-[1950px] !overflow-visible"
              style={{ overflow: 'visible' }}
            >
              <thead
                className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-sm"
                style={{ position: 'sticky', top: 0, background: 'rgba(229,231,235,0.8)' }}
              >
                <tr>
                  <th>PlantCode</th>
                  <th>EquipmentName</th>
                  <th>MachineSupplier</th>
                  <th>Type</th>
                  <th>SpareName</th>
                  <th>SAPShortText</th>
                  <th>PartNo</th>
                  <th>Make</th>
                  <th>Vendor1</th>
                  <th>SpareLifecycle</th>
                  <th>FrequencyMonths</th>
                  <th>TotalAnnualQtyProjection</th>
                  <th>Attachments</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((equipment) => {
                  const key = equipment.SlNo || (equipment as any).slno;
                  const hasPhotos = equipment.UploadPhotos && equipment.UploadPhotos !== 'null';
                  const hasDrawings = equipment.Drawing && equipment.Drawing !== 'null';
                  return (
                    <tr key={key} onClick={() => handleRowClick(equipment)} className="cursor-pointer">
                      <td>{highlightText(equipment.PlantCode ? String(equipment.PlantCode) : '', debouncedSearchQuery)}</td>
                      <td>{highlightText(equipment.EquipmentName || '', debouncedSearchQuery)}</td>
                      <td>{highlightText(equipment.MachineSupplier || '', debouncedSearchQuery)}</td>
                      <td>{highlightText(equipment.Type || '', debouncedSearchQuery)}</td>
                      <td>{highlightText(equipment.SpareName || '', debouncedSearchQuery)}</td>
                      <td>{highlightText(equipment.SAPShortText || '', debouncedSearchQuery)}</td>
                      <td>{highlightText(equipment.PartNo || '', debouncedSearchQuery)}</td>
                      <td>{highlightText(equipment.Make || '', debouncedSearchQuery)}</td>
                      <td>{highlightText(equipment.Vendor1 || '', debouncedSearchQuery)}</td>
                      <td>{highlightText(equipment.SpareLifecycle || '', debouncedSearchQuery)}</td>
                      <td>{highlightText(equipment.FrequencyMonths?.toString() || '', debouncedSearchQuery)}</td>
                      <td>{highlightText(equipment.TotalAnnualQtyProjection?.toString() || '', debouncedSearchQuery)}</td>
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
          </div>
        </ScrollArea>
      )}

      <EquipmentDetailView equipment={selectedEquipment} isOpen={detailViewOpen} onClose={closeDetailView} />
    </div>
  );
};

export default EquipmentDataTable;