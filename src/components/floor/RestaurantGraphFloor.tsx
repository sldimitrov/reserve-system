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
}

interface DragOffset {
    x: number;
    y: number;
}

const RestaurantTableCreator = () => {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [tables, setTables] = useState<Table[]>([]);
    const [isAddingTable, setIsAddingTable] = useState<boolean>(false);
    const [selectedTable, setSelectedTable] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle image upload
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

    // Add a table where clicked
    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isAddingTable || !backgroundImage) return;

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
        };

        setTables([...tables, newTable]);
        setIsAddingTable(false);
    };

    // Handle table selection
    const handleTableClick = (e: React.MouseEvent, table: Table) => {
        e.stopPropagation();
        setSelectedTable(table.id);
    };

    // Start dragging a table
    const handleDragStart = (e: React.MouseEvent, table: Table) => {
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
            y: y - table.y
        });
    };

    // Drag table
    const handleDrag = (e: MouseEvent) => {
        if (!isDragging || selectedTable === null) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setTables(tables.map(table => {
            if (table.id === selectedTable) {
                return {
                    ...table,
                    x: x - dragOffset.x,
                    y: y - dragOffset.y
                };
            }
            return table;
        }));
    };

    // End dragging
    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Update table properties
    const updateTableProperty = <K extends keyof Table>(
        id: number,
        property: K,
        value: Table[K]
    ) => {
        setTables(tables.map(table => {
            if (table.id === id) {
                return { ...table, [property]: value };
            }
            return table;
        }));
    };

    // Delete selected table
    const deleteSelectedTable = () => {
        if (selectedTable === null) return;
        setTables(tables.filter(table => table.id !== selectedTable));
        setSelectedTable(null);
    };

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
            <div className="bg-blue-600 text-white p-3">
                <h1 className="text-xl font-bold">Restaurant Table Layout Creator</h1>
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
                            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center'
                        }}
                        onClick={handleCanvasClick}
                    >
                        {!backgroundImage && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                Upload a restaurant image to get started
                            </div>
                        )}

                        {tables.map(table => (
                            <div
                                key={table.id}
                                className={`absolute border-2 ${
                                    selectedTable === table.id ? 'border-blue-500' : 'border-gray-700'
                                } bg-white bg-opacity-70 flex items-center justify-center cursor-move`}
                                style={{
                                    left: `${table.x}px`,
                                    top: `${table.y}px`,
                                    width: `${table.width}px`,
                                    height: `${table.height}px`,
                                    borderRadius: table.type === 'round' ? '50%' : '0',
                                }}
                                onClick={(e) => handleTableClick(e, table)}
                                onMouseDown={(e) => handleDragStart(e, table)}
                            >
                                <span className="text-xs font-bold">Table {table.number}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controls Area */}
                <div className="w-64 bg-gray-50 p-4 overflow-y-auto">
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
                            onClick={() => fileInputRef.current.click()}
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
                                isAddingTable ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                            } text-white`}
                        >
                            {isAddingTable ? 'Cancel Adding Table' : 'Add New Table'}
                        </button>

                        <button
                            onClick={deleteSelectedTable}
                            disabled={selectedTable === null}
                            className={`w-full py-2 px-4 rounded ${
                                selectedTable === null ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                            } text-white`}
                        >
                            Delete Selected Table
                        </button>
                    </div>

                    {selectedTable !== null && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-2">Table Properties</h2>
                            {tables.map(table => {
                                if (table.id === selectedTable) {
                                    return (
                                        <div key={table.id} className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Table Number</label>
                                                <input
                                                    type="number"
                                                    value={table.number}
                                                    onChange={(e) => updateTableProperty(table.id, 'number', parseInt(e.target.value) || 0)}
                                                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Seats</label>
                                                <input
                                                    type="number"
                                                    value={table.seats}
                                                    onChange={(e) => updateTableProperty(table.id, 'seats', parseInt(e.target.value) || 0)}
                                                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Shape</label>
                                                <select
                                                    value={table.type}
                                                    onChange={(e) => updateTableProperty(table.id, 'type', e.target.value as 'rectangle' | 'round')}
                                                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                                                >
                                                    <option value="rectangle">Rectangle</option>
                                                    <option value="round">Round</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Width</label>
                                                <input
                                                    type="number"
                                                    value={table.width}
                                                    onChange={(e) => updateTableProperty(table.id, 'width', parseInt(e.target.value) || 20)}
                                                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Height</label>
                                                <input
                                                    type="number"
                                                    value={table.height}
                                                    onChange={(e) => updateTableProperty(table.id, 'height', parseInt(e.target.value) || 20)}
                                                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                                                />
                                            </div>
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
                            Tables: {tables.length}
                        </p>
                        <p className="text-sm text-gray-600">
                            Total Seats: {tables.reduce((sum, table) => sum + table.seats, 0)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantTableCreator;