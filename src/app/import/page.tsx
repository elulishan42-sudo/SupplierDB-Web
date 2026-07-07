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
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/suppliers')}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Suppliers
              </button>
              <h1 className="text-2xl font-bold text-foreground">CSV Import</h1>
            </div>
            <button
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg border border-border p-8">
          {!file ? (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Upload CSV File</h2>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
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
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isParsing ? 'Parsing...' : 'Select CSV File'}
                </label>
                <p className="mt-2 text-sm text-muted-foreground">
                  The first row should contain column headers
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Map CSV Columns
                </h2>
                <button
                  onClick={handleReset}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                >
                  Reset
                </button>
              </div>

              {isParsing ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Detected Headers: {headers.join(', ')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {csvData.length} rows found
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    {importFields.map((field: any) => (
                      <div key={field.key} className="flex items-center gap-4">
                        <div className="w-48">
                          <label className="block text-sm font-medium text-foreground">
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </label>
                        </div>
                        <select
                          value={mapping[field.key] || ''}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
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
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground px-4 py-3 rounded-md mb-6">
                      <h4 className="font-medium mb-2">Errors:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result && (
                    <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-md mb-6">
                      <h4 className="font-medium mb-2">Import Complete!</h4>
                      <p>Suppliers inserted: {result.inserted}</p>
                      <p>Contacts inserted: {result.contactsInserted}</p>
                      <button
                        onClick={() => router.push('/suppliers')}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        View Suppliers
                      </button>
                    </div>
                  )}

                  {isImporting && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Importing...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {!result && (
                    <button
                      onClick={handleImport}
                      disabled={isImporting}
                      className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
