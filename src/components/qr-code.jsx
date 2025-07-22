"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Download, Plus, DownloadCloud, Upload, FileSpreadsheet } from 'lucide-react';

const QRGenerator = () => {
    const [vaData, setVaData] = useState([{ name: '', vaNumber: '' }]);
    const [qrCodes, setQrCodes] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const fileInputRef = useRef(null);

    // Add beforeunload event listener for refresh warning
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (vaData.some(item => item.name.trim() || item.vaNumber.trim()) || qrCodes.length > 0) {
                e.preventDefault();
                e.returnValue = 'Ada data yang belum tersimpan. Yakin ingin keluar dari halaman ini?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [vaData, qrCodes]);

    // Load JSZip dynamically
    const loadJSZip = () => {
        return new Promise((resolve, reject) => {
            if (window.JSZip) {
                resolve(window.JSZip);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error('Failed to load JSZip'));
            document.head.appendChild(script);
        });
    };

    // Load SheetJS for Excel processing
    const loadSheetJS = () => {
        return new Promise((resolve, reject) => {
            if (window.XLSX) {
                resolve(window.XLSX);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => resolve(window.XLSX);
            script.onerror = () => reject(new Error('Failed to load SheetJS'));
            document.head.appendChild(script);
        });
    };

    // Generate QR Code using external QR code library
    const generateQRCode = (text, size = 200, padding = 20) => {
        return new Promise((resolve, reject) => {
            // Create a container div for the QR code
            const qrContainer = document.createElement('div');
            qrContainer.style.display = 'none';
            document.body.appendChild(qrContainer);

            // Load QR code library dynamically
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
            script.onload = () => {
                try {
                    // Create QR code instance
                    const qr = window.qrcode(0, 'M'); // Error correction level M
                    qr.addData(text);
                    qr.make();

                    // Create canvas and draw QR code with padding
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const moduleCount = qr.getModuleCount();

                    // Calculate sizes with padding
                    const availableSize = size - (padding * 2);
                    const cellSize = Math.floor(availableSize / moduleCount);
                    const qrSize = cellSize * moduleCount;

                    // Center the QR code in the canvas
                    const offsetX = (size - qrSize) / 2;
                    const offsetY = (size - qrSize) / 2;

                    canvas.width = size;
                    canvas.height = size;

                    // Fill background with white
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, size, size);

                    // Draw QR modules
                    ctx.fillStyle = '#000000';
                    for (let row = 0; row < moduleCount; row++) {
                        for (let col = 0; col < moduleCount; col++) {
                            if (qr.isDark(row, col)) {
                                ctx.fillRect(
                                    offsetX + (col * cellSize),
                                    offsetY + (row * cellSize),
                                    cellSize,
                                    cellSize
                                );
                            }
                        }
                    }

                    // Cleanup
                    document.body.removeChild(qrContainer);
                    resolve(canvas.toDataURL('image/png'));
                } catch (error) {
                    document.body.removeChild(qrContainer);
                    reject(error);
                }
            };
            script.onerror = () => {
                document.body.removeChild(qrContainer);
                reject(new Error('Failed to load QR code library'));
            };
            document.head.appendChild(script);
        });
    };

    // Handle Excel file import
    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const XLSX = await loadSheetJS();
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // Skip header row and process data
            const processedData = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row[0] && row[1]) { // Check if both name and VA number exist
                    processedData.push({
                        name: String(row[0]).trim(),
                        vaNumber: String(row[1]).trim()
                    });
                }
            }

            if (processedData.length === 0) {
                alert('File Excel kosong atau format tidak sesuai. Pastikan kolom A berisi nama dan kolom B berisi nomor VA.');
                return;
            }

            // Confirm import
            const confirmImport = window.confirm(
                `Ditemukan ${processedData.length} data di file Excel. Import data ini? Data yang sudah ada akan diganti.`
            );

            if (confirmImport) {
                setVaData(processedData);
                setQrCodes([]); // Clear existing QR codes
                alert(`Berhasil import ${processedData.length} data dari Excel.`);
            }

        } catch (error) {
            console.error('Error importing Excel:', error);
            alert('Gagal membaca file Excel. Pastikan file dalam format .xlsx atau .xls yang valid.');
        }

        // Clear file input
        event.target.value = '';
    };

    const addVAInput = () => {
        setVaData([...vaData, { name: '', vaNumber: '' }]);
    };

    const removeVAInput = (index) => {
        const newData = vaData.filter((_, i) => i !== index);
        setVaData(newData.length > 0 ? newData : [{ name: '', vaNumber: '' }]);
    };

    const updateVAData = (index, field, value) => {
        const newData = [...vaData];
        newData[index][field] = value;
        setVaData(newData);
    };

    const generateQRCodes = async () => {
        setIsGenerating(true);
        const validData = vaData.filter(item => item.name.trim() && item.vaNumber.trim());

        if (validData.length === 0) {
            alert('Mohon isi minimal satu data dengan lengkap');
            setIsGenerating(false);
            return;
        }

        try {
            const codes = [];
            for (const item of validData) {
                const qrData = item.vaNumber; // Only VA number in QR code
                try {
                    const qrImage = await generateQRCode(qrData, 240, 30); // Size 240px with 30px padding
                    codes.push({
                        name: item.name,
                        vaNumber: item.vaNumber,
                        qrImage,
                        fileName: `QR_${item.name.replace(/\s+/g, '_')}_${item.vaNumber}.png`
                    });
                } catch (error) {
                    console.error(`Failed to generate QR for ${item.name}:`, error);
                    // Show error notification
                    alert(`Gagal generate QR untuk ${item.name}. Silakan coba lagi.`);
                }
            }

            setQrCodes(codes);
        } catch (error) {
            console.error('Error generating QR codes:', error);
            alert('Terjadi kesalahan saat generate QR codes. Silakan refresh page dan coba lagi.');
        }

        setIsGenerating(false);
    };

    const downloadSingle = (qrCode) => {
        const link = document.createElement('a');
        link.download = qrCode.fileName;
        link.href = qrCode.qrImage;
        link.click();
    };

    const downloadAll = async () => {
        if (qrCodes.length === 0) return;

        setIsDownloading(true);

        try {
            if (qrCodes.length === 1) {
                // Single file - download directly
                downloadSingle(qrCodes[0]);
            } else {
                // Multiple files - create ZIP
                const JSZip = await loadJSZip();
                const zip = new JSZip();

                // Add each QR code image to zip
                for (const qrCode of qrCodes) {
                    // Convert data URL to blob
                    const response = await fetch(qrCode.qrImage);
                    const blob = await response.blob();
                    zip.file(qrCode.fileName, blob);
                }

                // Generate ZIP and download
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = `QR_Codes_${new Date().toISOString().slice(0, 10)}.zip`;
                link.click();

                // Cleanup
                URL.revokeObjectURL(link.href);
            }
        } catch (error) {
            console.error('Error creating ZIP:', error);
            alert('Gagal membuat file ZIP. Silakan coba download satu per satu.');
        }

        setIsDownloading(false);
    };

    const resetAll = () => {
        const hasData = vaData.some(item => item.name.trim() || item.vaNumber.trim()) || qrCodes.length > 0;

        if (hasData) {
            const confirmReset = window.confirm(
                'Yakin ingin mereset semua data? Semua input dan QR code yang sudah di-generate akan hilang.'
            );

            if (!confirmReset) {
                return;
            }
        }

        setVaData([{ name: '', vaNumber: '' }]);
        setQrCodes([]);
    };

    const downloadTemplate = () => {
        // Create sample Excel template
        const template = [
            ['Nama Pemilik VA', 'Nomor Virtual Account'],
            ['John Doe', '1234567890'],
            ['Jane Smith', '0987654321'],
            ['Bob Johnson', '5555666777']
        ];

        const ws = window.XLSX?.utils.aoa_to_sheet(template);
        const wb = window.XLSX?.utils.book_new();
        window.XLSX?.utils.book_append_sheet(wb, ws, 'Template VA');

        const excelBuffer = window.XLSX?.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Template_Virtual_Account.xlsx';
        link.click();

        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="min-h-screen bg-neutral-100 pt-10">
            <div className="max-w-6xl mx-auto">
                <div className="text-left mb-8">
                    <h1 className="text-xl font-bold text-gray-800 mb-2">QR Generator Virtual Account</h1>
                    <p className="text-gray-600">Generate QR codes untuk multiple virtual account sekaligus</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Input Data Virtual Account</span>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        size="sm"
                                        variant="outline"
                                        className="text-green-700 border-green-700 hover:bg-green-50"
                                    >
                                        <FileSpreadsheet className="w-4 h-4 mr-1" />
                                        Import Excel
                                    </Button>
                                    <Button onClick={addVAInput} size="sm" className="bg-blue-700 hover:bg-blue-600">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Tambah
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Excel Import Instructions */}
            
                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileImport}
                                accept=".xlsx,.xls"
                                className="hidden"
                            />

                            {vaData.map((item, index) => (
                                <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            placeholder="Nama Pemilik VA"
                                            value={item.name}
                                            onChange={(e) => updateVAData(index, 'name', e.target.value)}
                                            className="bg-white"
                                        />
                                        <Input
                                            placeholder="Nomor Virtual Account"
                                            value={item.vaNumber}
                                            onChange={(e) => updateVAData(index, 'vaNumber', e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    {vaData.length > 1 && (
                                        <Button
                                            onClick={() => removeVAInput(index)}
                                            size="sm"
                                            variant="destructive"
                                            className="shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <div className="flex gap-2 pt-4">
                                <Button
                                    onClick={generateQRCodes}
                                    disabled={isGenerating}
                                    className="flex-1"
                                >
                                    {isGenerating ? 'Generating...' : 'Generate QR Codes'}
                                </Button>
                                <Button onClick={resetAll} variant="outline">
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* QR Codes Display */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>QR Codes Generated ({qrCodes.length})</span>
                                {qrCodes.length > 0 && (
                                    <Button
                                        onClick={downloadAll}
                                        disabled={isDownloading}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <DownloadCloud className="w-4 h-4 mr-1" />
                                        {isDownloading ? 'Creating...' :
                                            qrCodes.length === 1 ? 'Download' : 'Download ZIP'}
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {qrCodes.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500">Belum ada QR code yang di-generate</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 max-h-96 overflow-y-auto">
                                    {qrCodes.map((qrCode, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                            <img
                                                src={qrCode.qrImage}
                                                alt={`QR ${qrCode.name}`}
                                                className="w-16 h-16 border rounded"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm">{qrCode.name}</h3>
                                                <p className="text-xs text-gray-600">VA: {qrCode.vaNumber}</p>
                                                <p className="text-xs text-gray-500">{qrCode.fileName}</p>
                                            </div>
                                            <Button
                                                onClick={() => downloadSingle(qrCode)}
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default QRGenerator;