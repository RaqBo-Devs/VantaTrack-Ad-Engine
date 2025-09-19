import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { apiRequest } from '@/lib/queryClient';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [platform, setPlatform] = useState('google');
  const [clientId, setClientId] = useState('1'); // For demo purposes
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await fetch('/api/upload/process', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadResult(data);
      setSelectedFile(null);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setUploadResult({ error: error.message });
    },
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('platform', platform);
    formData.append('clientId', clientId);

    uploadMutation.mutate(formData);
  };

  const downloadTemplate = async (templateType) => {
    try {
      const response = await fetch(`/api/upload/template/${templateType}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateType}_ads_template.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Campaign Data</h1>
        <p className="mt-2 text-gray-600">
          Upload CSV or Excel files to import Google Ads and Facebook Ads campaign data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Data File</h2>
          
          <div className="space-y-4">
            <Select
              label="Platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="google">Google Ads</option>
              <option value="facebook">Facebook Ads</option>
            </Select>

            {/* Drag & Drop Area */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
                ${dragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-400'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-4">
                <div className="text-4xl">📁</div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports CSV, XLSX, and XLS files (max 10MB)
                  </p>
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              loading={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Processing...' : 'Upload & Process'}
            </Button>
          </div>
        </Card>

        {/* Templates Section */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Download Templates</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Download pre-formatted CSV templates to ensure your data matches the expected format.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <h3 className="font-medium text-green-900">Google Ads Template</h3>
                  <p className="text-sm text-green-700">
                    Campaign data with impressions, clicks, costs
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => downloadTemplate('google')}
                >
                  📥 Download
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div>
                  <h3 className="font-medium text-purple-900">Facebook Ads Template</h3>
                  <p className="text-sm text-purple-700">
                    Campaign objectives, audience data, performance
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => downloadTemplate('facebook')}
                >
                  📥 Download
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Tips for successful uploads:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use the provided templates for best results</li>
                <li>• Ensure all required fields are filled</li>
                <li>• Keep file size under 10MB</li>
                <li>• Use proper date format (YYYY-MM-DD)</li>
                <li>• Currency values should be numeric only</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Results</h2>
          
          {uploadResult.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900 mb-2">❌ Upload Failed</h3>
              <p className="text-red-800">{uploadResult.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">✅ Upload Successful</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-green-700">Records Found:</p>
                    <p className="font-bold text-green-900">{uploadResult.recordsFound}</p>
                  </div>
                  <div>
                    <p className="text-green-700">Platform:</p>
                    <p className="font-bold text-green-900 capitalize">{uploadResult.platform}</p>
                  </div>
                  <div>
                    <p className="text-green-700">File Name:</p>
                    <p className="font-bold text-green-900">{uploadResult.fileName}</p>
                  </div>
                </div>
              </div>

              {uploadResult.data && uploadResult.data.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Preview of imported data:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Campaign Name</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Type</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Budget (USD)</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Impressions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {uploadResult.data.slice(0, 5).map((row, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{row.campaignName}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{row.campaignType || row.campaignObjective}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{row.status}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">${row.budgetUsd || '0'}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{row.impressions || '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {uploadResult.data.length > 5 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Showing 5 of {uploadResult.data.length} records
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}