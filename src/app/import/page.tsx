'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/application/auth-store';
import { useCsvImportStore } from '@/features/import/application/csv-import-store';
import { importFields } from '@/features/import/application/csv-import-store';

export default function ImportPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const {
    csvData,
    headers,
    mapping,
    isParsing,
    isImporting,
    progress,
    errors,
    result,
    parseCSV,
    setMapping,
    importData,
    reset,
  } = useCsvImportStore();

  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const handleMappingChange = (fieldKey: string, csvHeader: string) => {
    setMapping({ ...mapping, [fieldKey]: csvHeader });
  };

  const handleImport = async () => {
    await importData();
  };

  const handleReset = () => {
    setFile(null);
    reset();
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/suppliers')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Suppliers
              </button>
              <h1 className="text-2xl font-bold text-gray-900">CSV Import</h1>
            </div>
            <button
              onClick={() => signOut()}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {!file ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload CSV File</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isParsing}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isParsing ? 'Parsing...' : 'Select CSV File'}
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  The first row should contain column headers
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Map CSV Columns
                </h2>
                <button
                  onClick={handleReset}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  Reset
                </button>
              </div>

              {isParsing ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Detected Headers: {headers.join(', ')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {csvData.length} rows found
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    {importFields.map((field: any) => (
                      <div key={field.key} className="flex items-center gap-4">
                        <div className="w-48">
                          <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                        </div>
                        <select
                          value={mapping[field.key] || ''}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">-- Not mapped --</option>
                          {headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                      <h4 className="font-medium mb-2">Errors:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
                      <h4 className="font-medium mb-2">Import Complete!</h4>
                      <p>Suppliers inserted: {result.inserted}</p>
                      <p>Contacts inserted: {result.contactsInserted}</p>
                      <button
                        onClick={() => router.push('/suppliers')}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        View Suppliers
                      </button>
                    </div>
                  )}

                  {isImporting && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Importing...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {!result && (
                    <button
                      onClick={handleImport}
                      disabled={isImporting}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isImporting ? 'Importing...' : 'Import Data'}
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
