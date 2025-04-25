import React, { useState, MouseEvent } from 'react';
import { Move } from 'lucide-react';

// Table type definitions
type TableShape = 'round' | 'rect';

interface TableType {
  type: string;
  seats: number;
  shape: TableShape;
  width: number;
  height: number;
}

interface Table extends TableType {
  id: string;
  x: number;
  y: number;
}

interface Reservation {
  name: string;
  time: string;
}

interface ReservationsMap {
  [tableId: string]: Reservation;
}

interface DragOffset {
  x: number;
  y: number;
}

// Define table shapes/types
const TABLE_TYPES: Record<string, TableType> = {
  ROUND_2: { type: 'ROUND_2', seats: 2, shape: 'round', width: 60, height: 60 },
  ROUND_4: { type: 'ROUND_4', seats: 4, shape: 'round', width: 80, height: 80 },
  RECT_4: { type: 'RECT_4', seats: 4, shape: 'rect', width: 80, height: 60 },
  RECT_6: { type: 'RECT_6', seats: 6, shape: 'rect', width: 120, height: 60 },
};

// Main component
const RestaurantFloorPlan: React.FC = () => {
  // State
  const [isAdminMode, setIsAdminMode] = useState<boolean>(true);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableType, setSelectedTableType] = useState<string>('ROUND_4');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [reservations, setReservations] = useState<ReservationsMap>({});
  const [customerName, setCustomerName] = useState<string>('');
  const [reservationTime, setReservationTime] = useState<string>('19:00');

  // Handle adding a new table
  const handleAddTable = (e: MouseEvent<HTMLDivElement>): void => {
    if (!isAdminMode || !selectedTableType) return;

    const floorRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - floorRect.left;
    const y = e.clientY - floorRect.top;

    const newTable: Table = {
      id: `table-${Date.now()}`,
      ...TABLE_TYPES[selectedTableType],
      x: x - TABLE_TYPES[selectedTableType].width / 2,
      y: y - TABLE_TYPES[selectedTableType].height / 2,
    };

    setTables([...tables, newTable]);
  };

  // Start dragging a table
  const handleDragStart = (
    e: MouseEvent<HTMLDivElement>,
    table: Table
  ): void => {
    if (!isAdminMode) return;
    e.stopPropagation();

    const tableEl = e.currentTarget;
    const tableRect = tableEl.getBoundingClientRect();

    setDraggedTable(table.id);
    setDragOffset({
      x: e.clientX - tableRect.left,
      y: e.clientY - tableRect.top,
    });
  };

  // Handle mouse movement when dragging
  const handleDragMove = (e: MouseEvent<HTMLDivElement>): void => {
    if (!isAdminMode || !draggedTable) return;

    const floorRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - floorRect.left - dragOffset.x;
    const y = e.clientY - floorRect.top - dragOffset.y;

    setTables(
      tables.map(table => {
        if (table.id === draggedTable) {
          return { ...table, x, y };
        }
        return table;
      })
    );
  };

  // End dragging
  const handleDragEnd = (): void => {
    setDraggedTable(null);
  };

  // Handle table selection/reservation
  const handleTableClick = (
    e: MouseEvent<HTMLDivElement>,
    table: Table
  ): void => {
    e.stopPropagation();

    if (isAdminMode) {
      setSelectedTable(table.id === selectedTable ? null : table.id);
    } else {
      // In customer mode, select table for reservation
      setSelectedTable(table.id === selectedTable ? null : table.id);
    }
  };

  // Delete selected table
  const handleDeleteTable = (): void => {
    if (!selectedTable || !isAdminMode) return;
    setTables(tables.filter(table => table.id !== selectedTable));
    setSelectedTable(null);
  };

  // Make a reservation
  const handleReservation = (): void => {
    if (!selectedTable || !customerName) return;

    setReservations({
      ...reservations,
      [selectedTable]: {
        name: customerName,
        time: reservationTime,
      },
    });

    setSelectedTable(null);
    setCustomerName('');
    alert(`Table reserved for ${customerName} at ${reservationTime}`);
  };

  // Render a table
  const renderTable = (table: Table) => {
    const isSelected = selectedTable === table.id;
    const isReserved = Boolean(reservations[table.id]);

    let tableStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${table.x}px`,
      top: `${table.y}px`,
      width: `${table.width}px`,
      height: `${table.height}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isAdminMode ? 'move' : 'pointer',
      border: '2px solid #333',
      backgroundColor: isReserved ? '#ffcccc' : isSelected ? '#ccf' : '#f5f5f5',
      borderRadius: table.shape === 'round' ? '50%' : '4px',
      boxShadow: isSelected ? '0 0 0 2px #33f' : 'none',
      userSelect: 'none',
      overflow: 'hidden', // Prevent content from overflowing
      padding: '4px', // Add padding inside the table
    };

    const tableTextStyle: React.CSSProperties = {
      color: 'blue',
      fontSize: table.width < 70 ? '10px' : '12px',
      textAlign: 'center',
      maxWidth: '100%', // Constrain text width
      wordWrap: 'break-word', // Allow text wrapping
    };

    return (
      <div
        key={table.id}
        style={tableStyle}
        onClick={e => handleTableClick(e, table)}
        onMouseDown={e => handleDragStart(e, table)}
      >
        <div>
          <div style={tableTextStyle}>#{table.id.split('-')[1]}</div>
          <div>{table.seats} seats</div>
          {isReserved && (
            <div className="text-xs">
              {reservations[table.id].name}
              <br />
              {reservations[table.id].time}
            </div>
          )}
        </div>
        {isAdminMode && isSelected && (
          <Move className="absolute top-0 right-0 w-4 h-4 text-blue-500" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {isAdminMode ? 'Restaurant Layout Editor' : 'Table Reservation'}
        </h2>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => setIsAdminMode(!isAdminMode)}
        >
          Switch to {isAdminMode ? 'Customer' : 'Admin'} Mode
        </button>
      </div>

      {isAdminMode && (
        <div className="mb-4 flex gap-4">
          <div>
            <label className="block mb-1">Table Type:</label>
            <select
              value={selectedTableType}
              onChange={e => setSelectedTableType(e.target.value)}
              className="bg-blue-500 p-2 rounded"
            >
              <option value="ROUND_2">Round (2 seats)</option>
              <option value="ROUND_4">Round (4 seats)</option>
              <option value="RECT_4">Rectangle (4 seats)</option>
              <option value="RECT_6">Rectangle (6 seats)</option>
            </select>
          </div>

          {selectedTable && (
            <button
              onClick={handleDeleteTable}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Delete Selected Table
            </button>
          )}
        </div>
      )}

      {!isAdminMode && selectedTable && (
        <div className="mb-4 p-4 border rounded bg-gray">
          <h3 className="font-bold mb-2">Make Reservation</h3>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block mb-1">Name:</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="border p-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Time:</label>
              <input
                type="time"
                value={reservationTime}
                onChange={e => setReservationTime(e.target.value)}
                className="border p-2 rounded"
              />
            </div>
            <button
              onClick={handleReservation}
              className="px-4 py-2 bg-green-500 text-white rounded"
              disabled={!customerName}
            >
              Confirm Reservation
            </button>
          </div>
        </div>
      )}

      <div
        className="border border-gray-300 bg-gray relative"
        style={{ height: '500px' }}
        onClick={isAdminMode ? handleAddTable : () => setSelectedTable(null)}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div className="absolute top-2 left-2 text-gray-400">
          {isAdminMode
            ? 'Click to add a table, drag to move'
            : 'Click on a table to make a reservation'}
        </div>
        {tables.map(renderTable)}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {isAdminMode ? (
          <div>
            Admin mode: Create and position tables by clicking and dragging
          </div>
        ) : (
          <div>Customer mode: Select a table to make a reservation</div>
        )}
      </div>
    </div>
  );
};

export default RestaurantFloorPlan;
