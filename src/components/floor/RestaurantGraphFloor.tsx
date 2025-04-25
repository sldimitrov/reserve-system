import React, { useState, useRef, useEffect, MouseEvent } from 'react';

interface Table {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  number: number;
  type: 'rectangle' | 'round';
  seats: number;
  reserved: boolean;
  reservationName?: string;
  reservationTime?: string;
  reservationPhone?: string;
}

interface DragOffset {
  x: number;
  y: number;
}

const RestaurantTableSystem = () => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [isAddingTable, setIsAddingTable] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [reservationDetails, setReservationDetails] = useState({
    name: '',
    time: '',
    phone: '',
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload (Admin only)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add a table where clicked (Admin only)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdmin || !isAddingTable || !backgroundImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newTable: Table = {
      id: Date.now(),
      x,
      y,
      width: 60,
      height: 40,
      number: tables.length + 1,
      type: 'rectangle', // Default shape
      seats: 4,
      reserved: false,
    };

    setTables([...tables, newTable]);
    setIsAddingTable(false);
  };

  // Handle table selection
  const handleTableClick = (e: React.MouseEvent, table: Table) => {
    e.stopPropagation();
    setSelectedTable(table.id);
    if (!isAdmin) {
      // In user mode, clicking prepopulates reservation form if not already reserved
      if (!table.reserved) {
        setReservationDetails({
          name: '',
          time: '',
          phone: '',
        });
      } else {
        // Show existing reservation details
        setReservationDetails({
          name: table.reservationName || '',
          time: table.reservationTime || '',
          phone: table.reservationPhone || '',
        });
      }
    }
  };

  // Start dragging a table (Admin only)
  const handleDragStart = (e: React.MouseEvent, table: Table) => {
    if (!isAdmin) return;

    e.stopPropagation();
    setIsDragging(true);
    setSelectedTable(table.id);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragOffset({
      x: x - table.x,
      y: y - table.y,
    });
  };

  // Drag table (Admin only)
  const handleDrag = (e: MouseEvent) => {
    if (!isAdmin || !isDragging || selectedTable === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTables(
      tables.map(table => {
        if (table.id === selectedTable) {
          return {
            ...table,
            x: x - dragOffset.x,
            y: y - dragOffset.y,
          };
        }
        return table;
      })
    );
  };

  // End dragging
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Update table properties (Admin only)
  const updateTableProperty = <K extends keyof Table>(
    id: number,
    property: K,
    value: Table[K]
  ) => {
    setTables(
      tables.map(table => {
        if (table.id === id) {
          return { ...table, [property]: value };
        }
        return table;
      })
    );
  };

  // Delete selected table (Admin only)
  const deleteSelectedTable = () => {
    if (!isAdmin || selectedTable === null) return;
    setTables(tables.filter(table => table.id !== selectedTable));
    setSelectedTable(null);
  };

  // Make reservation (User only)
  const makeReservation = () => {
    if (isAdmin || selectedTable === null) return;

    setTables(
      tables.map(table => {
        if (table.id === selectedTable) {
          return {
            ...table,
            reserved: true,
            reservationName: reservationDetails.name,
            reservationTime: reservationDetails.time,
            reservationPhone: reservationDetails.phone,
          };
        }
        return table;
      })
    );

    setSelectedTable(null);
    setReservationDetails({
      name: '',
      time: '',
      phone: '',
    });
  };

  // Cancel reservation (User with confirmation, Admin directly)
  const cancelReservation = () => {
    if (selectedTable === null) return;

    if (!isAdmin) {
      // User needs to have proper credentials (simplified for demo)
      const selectedTableObj = tables.find(table => table.id === selectedTable);
      if (!selectedTableObj || !selectedTableObj.reserved) return;

      if (
        !window.confirm('Are you sure you want to cancel this reservation?')
      ) {
        return;
      }
    }

    setTables(
      tables.map(table => {
        if (table.id === selectedTable) {
          return {
            ...table,
            reserved: false,
            reservationName: undefined,
            reservationTime: undefined,
            reservationPhone: undefined,
          };
        }
        return table;
      })
    );

    if (!isAdmin) {
      setSelectedTable(null);
      setReservationDetails({
        name: '',
        time: '',
        phone: '',
      });
    }
  };

  // Toggle between admin and user modes
  const toggleMode = () => {
    setIsAdmin(!isAdmin);
    setSelectedTable(null);
    setIsAddingTable(false);
  };

  // Save layout to localStorage (Admin only)
  const saveLayout = () => {
    if (!isAdmin) return;
    try {
      localStorage.setItem(
        'restaurantLayout',
        JSON.stringify({
          tables,
          backgroundImage,
        })
      );
      alert('Layout saved successfully!');
    } catch (error) {
      alert('Failed to save layout!');
    }
  };

  // Load layout from localStorage
  const loadLayout = () => {
    try {
      const savedLayout = localStorage.getItem('restaurantLayout');
      if (savedLayout) {
        const { tables: savedTables, backgroundImage: savedImage } =
          JSON.parse(savedLayout);
        setTables(savedTables);
        setBackgroundImage(savedImage);
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
  };

  // Load layout on component mount
  useEffect(() => {
    loadLayout();
  }, []);

  // Effect for drag events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDrag(e);
      }
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedTable, tables, dragOffset]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div
        className={`${isAdmin ? 'bg-blue-600' : 'bg-green-600'} text-white p-4 flex justify-between items-center`}
      >
        <h1 className="text-xl font-bold">
          Restaurant Table {isAdmin ? 'Management' : 'Reservation'} System
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={toggleMode}
            className={`py-1 px-3 rounded ${isAdmin ? 'bg-green-500' : 'bg-blue-500'}`}
          >
            Switch to {isAdmin ? 'User' : 'Admin'} Mode
          </button>
          {isAdmin && (
            <button
              onClick={saveLayout}
              className="py-1 px-3 rounded bg-yellow-500"
            >
              Save Layout
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 relative overflow-auto border-r border-gray-300">
          <div
            ref={canvasRef}
            className="relative bg-white"
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: backgroundImage
                ? `url(${backgroundImage})`
                : 'none',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
            onClick={handleCanvasClick}
          >
            {!backgroundImage && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                {isAdmin
                  ? 'Upload a restaurant image to get started'
                  : 'No restaurant layout available'}
              </div>
            )}

            {tables.map(table => (
              <div
                key={table.id}
                className={`absolute border-2 ${
                  selectedTable === table.id
                    ? 'border-blue-500'
                    : 'border-gray-700'
                } ${
                  table.reserved ? 'bg-red-200' : 'bg-white'
                } bg-opacity-70 flex items-center justify-center ${isAdmin ? 'cursor-move' : 'cursor-pointer'}`}
                style={{
                  left: `${table.x}px`,
                  top: `${table.y}px`,
                  width: `${table.width}px`,
                  height: `${table.height}px`,
                  borderRadius: table.type === 'round' ? '50%' : '0',
                }}
                onClick={e => handleTableClick(e, table)}
                onMouseDown={e => handleDragStart(e, table)}
              >
                <div className="text-center">
                  <span className="text-xs font-bold">
                    Table {table.number}
                  </span>
                  {table.reserved && (
                    <div className="text-xxs mt-1">Reserved</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls Area */}
        <div className="w-64 bg-gray-50 p-4 overflow-y-auto">
          {isAdmin ? (
            // Admin Controls
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Restaurant Image</h2>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Upload Image
                </button>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Table Controls</h2>
                <button
                  onClick={() => setIsAddingTable(!isAddingTable)}
                  className={`w-full mb-2 py-2 px-4 rounded ${
                    isAddingTable
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white`}
                >
                  {isAddingTable ? 'Cancel Adding Table' : 'Add New Table'}
                </button>

                <button
                  onClick={deleteSelectedTable}
                  disabled={selectedTable === null}
                  className={`w-full py-2 px-4 rounded ${
                    selectedTable === null
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white`}
                >
                  Delete Selected Table
                </button>
              </div>

              {selectedTable !== null && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">
                    Table Properties
                  </h2>
                  {tables.map(table => {
                    if (table.id === selectedTable) {
                      return (
                        <div key={table.id} className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Table Number
                            </label>
                            <input
                              type="number"
                              value={table.number}
                              onChange={e =>
                                updateTableProperty(
                                  table.id,
                                  'number',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="mt-1 block w-full border border-gray-300 rounded p-2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Seats
                            </label>
                            <input
                              type="number"
                              value={table.seats}
                              onChange={e =>
                                updateTableProperty(
                                  table.id,
                                  'seats',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="mt-1 block w-full border border-gray-300 rounded p-2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Shape
                            </label>
                            <select
                              value={table.type}
                              onChange={e =>
                                updateTableProperty(
                                  table.id,
                                  'type',
                                  e.target.value as 'rectangle' | 'round'
                                )
                              }
                              className="mt-1 block w-full border border-gray-300 rounded p-2"
                            >
                              <option value="rectangle">Rectangle</option>
                              <option value="round">Round</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Width
                            </label>
                            <input
                              type="number"
                              value={table.width}
                              onChange={e =>
                                updateTableProperty(
                                  table.id,
                                  'width',
                                  parseInt(e.target.value) || 20
                                )
                              }
                              className="mt-1 block w-full border border-gray-300 rounded p-2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Height
                            </label>
                            <input
                              type="number"
                              value={table.height}
                              onChange={e =>
                                updateTableProperty(
                                  table.id,
                                  'height',
                                  parseInt(e.target.value) || 20
                                )
                              }
                              className="mt-1 block w-full border border-gray-300 rounded p-2"
                            />
                          </div>

                          {table.reserved && (
                            <>
                              <div className="pt-2 border-t border-gray-200">
                                <h3 className="font-medium text-gray-700">
                                  Reservation Details
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Name: {table.reservationName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Time: {table.reservationTime}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Phone: {table.reservationPhone}
                                </p>
                                <button
                                  onClick={cancelReservation}
                                  className="mt-2 w-full bg-red-500 text-white py-1 px-4 rounded hover:bg-red-600 text-sm"
                                >
                                  Cancel Reservation
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Layout Details</h2>
                <p className="text-sm text-gray-600">
                  Total Tables: {tables.length}
                </p>
                <p className="text-sm text-gray-600">
                  Total Seats:{' '}
                  {tables.reduce((sum, table) => sum + table.seats, 0)}
                </p>
                <p className="text-sm text-gray-600">
                  Reserved Tables:{' '}
                  {tables.filter(table => table.reserved).length}
                </p>
                <p className="text-sm text-gray-600">
                  Available Tables:{' '}
                  {tables.filter(table => !table.reserved).length}
                </p>
              </div>
            </>
          ) : (
            // User Reservation Controls
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  Table Reservation
                </h2>
                {selectedTable === null ? (
                  <p className="text-sm text-gray-600">
                    Click on a table to make a reservation
                  </p>
                ) : (
                  <>
                    {tables.map(table => {
                      if (table.id === selectedTable) {
                        return (
                          <div key={table.id}>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Table {table.number} - {table.seats} seats
                            </p>

                            {table.reserved ? (
                              <div className="p-3 bg-red-100 rounded mb-4">
                                <h3 className="font-medium text-red-800">
                                  Already Reserved
                                </h3>
                                <p className="text-sm text-red-700">
                                  Name: {table.reservationName}
                                </p>
                                <p className="text-sm text-red-700">
                                  Time: {table.reservationTime}
                                </p>
                                <p className="text-sm text-red-700">
                                  Phone: {table.reservationPhone}
                                </p>
                                <button
                                  onClick={cancelReservation}
                                  className="mt-2 w-full bg-red-500 text-white py-1 px-4 rounded hover:bg-red-600 text-sm"
                                >
                                  Cancel Reservation
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Your Name
                                  </label>
                                  <input
                                    type="text"
                                    value={reservationDetails.name}
                                    onChange={e =>
                                      setReservationDetails({
                                        ...reservationDetails,
                                        name: e.target.value,
                                      })
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                                    placeholder="Enter your name"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Reservation Time
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={reservationDetails.time}
                                    onChange={e =>
                                      setReservationDetails({
                                        ...reservationDetails,
                                        time: e.target.value,
                                      })
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Phone Number
                                  </label>
                                  <input
                                    type="tel"
                                    value={reservationDetails.phone}
                                    onChange={e =>
                                      setReservationDetails({
                                        ...reservationDetails,
                                        phone: e.target.value,
                                      })
                                    }
                                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                                    placeholder="Enter phone number"
                                  />
                                </div>

                                <button
                                  onClick={makeReservation}
                                  disabled={
                                    !reservationDetails.name ||
                                    !reservationDetails.time ||
                                    !reservationDetails.phone
                                  }
                                  className={`w-full py-2 px-4 rounded ${
                                    !reservationDetails.name ||
                                    !reservationDetails.time ||
                                    !reservationDetails.phone
                                      ? 'bg-gray-300 cursor-not-allowed'
                                      : 'bg-green-500 hover:bg-green-600'
                                  } text-white`}
                                >
                                  Make Reservation
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </>
                )}
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Available Tables</h2>
                <p className="text-sm text-gray-600">
                  Total Available:{' '}
                  {tables.filter(table => !table.reserved).length} /{' '}
                  {tables.length}
                </p>
                <div className="mt-2 space-y-1">
                  {tables
                    .filter(table => !table.reserved)
                    .map(table => (
                      <div
                        key={table.id}
                        className="p-2 bg-white rounded border border-gray-200 text-sm cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedTable(table.id)}
                      >
                        Table {table.number} - {table.seats} seats
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantTableSystem;
