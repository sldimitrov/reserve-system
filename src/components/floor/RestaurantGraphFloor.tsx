import React, { useState, useRef, useEffect } from 'react';
import { DragOffset, Table } from '../../types/table.ts';
import { SVG_HEIGHT, SVG_WIDTH } from '../../const/coordinate-system.ts';
import {
  EVENTS_MOUSE_MOVE,
  EVENTS_MOUSE_UP,
  EVENTS_RESIZE,
} from '../../const/events.ts';
import { useTranslation } from 'react-i18next';

const RestaurantTableSystem = () => {
  const { t } = useTranslation();
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [isAddingTable, setIsAddingTable] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });
  const [reservationDetails, setReservationDetails] = useState({
    name: '',
    time: '',
    phone: '',
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update SVG container dimensions when window resizes
  useEffect(() => {
    const updateSvgSize = () => {
      const svg = svgRef.current;
      if (svg) {
        const rect = svg.getBoundingClientRect();
        setSvgSize({ width: rect.width, height: rect.height });
      }
    };

    // Initial update
    updateSvgSize();

    // Update on resize
    window.addEventListener(EVENTS_RESIZE, updateSvgSize);

    // Also update when the background image loads
    if (backgroundImage) {
      const img = new Image();
      img.onload = updateSvgSize;
      img.src = backgroundImage;
    }

    return () => window.removeEventListener(EVENTS_RESIZE, updateSvgSize);
  }, [backgroundImage]);

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

  // Convert screen coordinates to SVG coordinates
  const screenToSvgCoordinates = (
    screenX: number,
    screenY: number
  ): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();

    // Calculate scaling factor between screen and SVG coordinates
    const scaleX = SVG_WIDTH / rect.width;
    const scaleY = SVG_HEIGHT / rect.height;

    // Convert screen coordinates to SVG coordinates
    const svgX = (screenX - rect.left) * scaleX;
    const svgY = (screenY - rect.top) * scaleY;

    return { x: svgX, y: svgY };
  };

  // Handle SVG background click
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only respond to direct clicks on the SVG background
    if (e.target === e.currentTarget) {
      if (!isAdmin || !isAddingTable || !backgroundImage) return;

      // Convert screen coordinates to SVG coordinates
      const { x, y } = screenToSvgCoordinates(e.clientX, e.clientY);

      // Default table size in SVG coordinate system
      const tableWidth = 60;
      const tableHeight = 40;

      const newTable: Table = {
        id: Date.now(),
        x,
        y,
        width: tableWidth,
        height: tableHeight,
        number: tables.length + 1,
        type: 'rectangle', // Default shape
        seats: 4,
        reserved: false,
      };

      setTables([...tables, newTable]);
      setIsAddingTable(false);
    }
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

    // Convert screen coordinates to SVG coordinates
    const { x, y } = screenToSvgCoordinates(e.clientX, e.clientY);

    // Calculate offset between mouse position and table position
    setDragOffset({
      x: x - table.x,
      y: y - table.y,
    });
  };

  // Handle drag events
  const handleDrag = (e: React.MouseEvent<SVGSVGElement> | MouseEvent) => {
    if (!isAdmin || !isDragging || selectedTable === null) return;

    // Prevent event propagation to avoid triggering click handlers
    e.stopPropagation();

    // Convert screen coordinates to SVG coordinates
    const clientX = 'clientX' in e ? e.clientX : (e as MouseEvent).clientX;
    const clientY = 'clientY' in e ? e.clientY : (e as MouseEvent).clientY;
    const { x, y } = screenToSvgCoordinates(clientX, clientY);

    // Update table position
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
  useEffect(() => {
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
  }, []);

  // Effect for drag events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && svgRef.current) {
        // Prevent default behavior to avoid text selection during drag
        e.preventDefault();
        handleDrag(e as unknown as React.MouseEvent<SVGSVGElement>);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        handleDragEnd();
      }
    };

    document.addEventListener(EVENTS_MOUSE_MOVE, handleMouseMove);
    document.addEventListener(EVENTS_MOUSE_UP, handleMouseUp);

    return () => {
      document.removeEventListener(EVENTS_MOUSE_MOVE, handleMouseMove);
      document.removeEventListener(EVENTS_MOUSE_UP, handleMouseUp);
    };
  }, [isDragging, selectedTable, tables]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div
        className={`${isAdmin ? 'bg-blue-600' : 'bg-green-600'} text-white p-4 flex flex-wrap justify-between items-center`}
      >
        <h1 className="text-xl font-bold mr-4">{t('restaurantSystem')}</h1>
        <div className="flex flex-wrap space-x-2 mt-2 sm:mt-0">
          <button
            onClick={toggleMode}
            className={`py-1 px-3 rounded ${isAdmin ? 'bg-green-500' : 'bg-blue-500'}`}
          >
            {t('switchTo')} {isAdmin ? t('admin') : t('user')}
          </button>
          {isAdmin && (
            <button
              onClick={saveLayout}
              className="py-1 px-3 rounded bg-yellow-500"
            >
              {t('saveLayout')}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* SVG Canvas Area */}
        <div className="flex-1 relative overflow-auto border-b md:border-b-0 md:border-r border-gray-300 min-h-[300px]">
          <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background Image with separate element for click handling */}
            {backgroundImage ? (
              <>
                <image
                  href={backgroundImage}
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid meet"
                  pointerEvents="none"
                />
                <rect
                  x="0"
                  y="0"
                  width={SVG_WIDTH}
                  height={SVG_HEIGHT}
                  fill="transparent"
                  onClick={handleSvgClick}
                  style={{ display: isDragging ? 'none' : 'block' }}
                />
              </>
            ) : (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#999"
                fontSize="20"
              >
                {isAdmin
                  ? 'Upload a restaurant image to get started'
                  : 'No restaurant layout available'}
              </text>
            )}

            {/* Tables */}
            {tables.map(table => (
              <g
                key={table.id}
                onClick={e => handleTableClick(e, table)}
                onMouseDown={e => handleDragStart(e, table)}
                style={{ cursor: isAdmin ? 'move' : 'pointer' }}
                pointerEvents="all"
              >
                {table.type === 'rectangle' ? (
                  <rect
                    x={table.x}
                    y={table.y}
                    width={table.width}
                    height={table.height}
                    fill={
                      table.reserved
                        ? 'rgba(254, 202, 202, 0.7)'
                        : 'rgba(255, 255, 255, 0.7)'
                    }
                    stroke={selectedTable === table.id ? '#3b82f6' : '#374151'}
                    strokeWidth="2"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <ellipse
                    cx={table.x + table.width / 2}
                    cy={table.y + table.height / 2}
                    rx={table.width / 2}
                    ry={table.height / 2}
                    fill={
                      table.reserved
                        ? 'rgba(254, 202, 202, 0.7)'
                        : 'rgba(255, 255, 255, 0.7)'
                    }
                    stroke={selectedTable === table.id ? '#3b82f6' : '#374151'}
                    strokeWidth="2"
                    onClick={e => e.stopPropagation()}
                  />
                )}
                <text
                  x={table.x + table.width / 2}
                  y={table.y + table.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="16"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {table.number}
                </text>
                {table.reserved && (
                  <text
                    x={table.x + table.width / 2}
                    y={table.y + table.height / 2 + 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    pointerEvents="none"
                  >
                    Reserved
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Controls Area */}
        <div className="md:w-64 w-full bg-gray-50 p-4 overflow-y-auto">
          <div className="md:hidden flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Control Panel</h2>
            <button className="text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {isAdmin ? (
            // Admin Controls
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  {t('restaurantImage')}
                </h2>
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
                  {t('uploadImage')}
                </button>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  {t('tableControls')}
                </h2>
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <button
                    onClick={() => setIsAddingTable(!isAddingTable)}
                    className={`flex-1 py-2 px-4 rounded ${
                      isAddingTable
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  >
                    {isAddingTable ? t('cancel') : t('addTable')}
                  </button>

                  <button
                    onClick={deleteSelectedTable}
                    disabled={selectedTable === null}
                    className={`flex-1 py-2 px-4 rounded ${
                      selectedTable === null
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600'
                    } text-white`}
                  >
                    {t('delete')}
                  </button>
                </div>
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
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Number
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

                          <div className="grid grid-cols-2 gap-2">
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
                                min="20"
                                max="200"
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
                                min="20"
                                max="200"
                                className="mt-1 block w-full border border-gray-300 rounded p-2"
                              />
                            </div>
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
                <h2 className="text-lg font-semibold mb-2">
                  {t('layoutDetails')}
                </h2>
                <p className="text-sm text-gray-600">
                  {t('totalTables')}: {tables.length}
                </p>
                <p className="text-sm text-gray-600">
                  {t('totalSeats')}:{' '}
                  {tables.reduce((sum, table) => sum + table.seats, 0)}
                </p>
                <p className="text-sm text-gray-600">
                  {t('reservedTables')}:{' '}
                  {tables.filter(table => table.reserved).length}
                </p>
                <p className="text-sm text-gray-600">
                  {t('availableTables')}:{' '}
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
