"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  LucideDownload,
  LucideFileText,
  LucideDatabase,
  LucideCalendar,
  LucideFilter,
  LucideSearch,
  LucideFileJson,
  LucideFile,
  LucideTable,
  LucideEye,
  LucideRefreshCw,
  LucideSettings,
  LucideCloudDownload,
  LucideCheckCircle,
  LucideLoader2,
  LucideFileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

interface DataExport {
  id: string;
  name: string;
  scraper: string;
  format: 'json' | 'csv' | 'excel';
  size: string;
  records: number;
  created: string;
  status: 'completed' | 'processing' | 'failed';
}

interface ScrapedData {
  id: string;
  scraper: string;
  url: string;
  title: string;
  price: string;
  description: string;
  image: string;
  scraped_at: string;
}

const mockExports: DataExport[] = [
  {
    id: '1',
    name: 'Product_Prices_Export_2024-01-15',
    scraper: 'Product Price Monitor',
    format: 'csv',
    size: '2.4 MB',
    records: 1250,
    created: '2024-01-15T10:30:00Z',
    status: 'completed'
  },
  {
    id: '2',
    name: 'Competitor_Analysis_JSON',
    scraper: 'Competitor Analysis',
    format: 'json',
    size: '1.8 MB',
    records: 890,
    created: '2024-01-14T15:45:00Z',
    status: 'completed'
  },
  {
    id: '3',
    name: 'News_Articles_Excel_Report',
    scraper: 'News Scraper',
    format: 'excel',
    size: '3.1 MB',
    records: 2150,
    created: '2024-01-13T09:20:00Z',
    status: 'completed'
  },
  {
    id: '4',
    name: 'Social_Media_Posts_Processing',
    scraper: 'Social Media Monitor',
    format: 'csv',
    size: 'Processing...',
    records: 0,
    created: '2024-01-15T14:00:00Z',
    status: 'processing'
  }
];

const mockData: ScrapedData[] = [
  {
    id: '1',
    scraper: 'Product Price Monitor',
    url: 'https://example-store.com/product/123',
    title: 'Wireless Bluetooth Headphones',
    price: '$89.99',
    description: 'High-quality wireless headphones with noise cancellation',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
    scraped_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    scraper: 'Product Price Monitor',
    url: 'https://example-store.com/product/456',
    title: 'Smart Watch Series 8',
    price: '$299.99',
    description: 'Advanced fitness tracking and health monitoring',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop',
    scraped_at: '2024-01-15T10:25:00Z'
  },
  {
    id: '3',
    scraper: 'Competitor Analysis',
    url: 'https://competitor.com/pricing',
    title: 'Competitor Pricing Strategy Analysis',
    price: 'N/A',
    description: 'Analysis of competitor pricing models and strategies',
    image: '',
    scraped_at: '2024-01-14T15:45:00Z'
  }
];

export default function DataPage() {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScraper, setSelectedScraper] = useState('all');

  const filteredData = mockData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScraper = selectedScraper === 'all' || item.scraper === selectedScraper;
    return matchesSearch && matchesScraper;
  });

  const handleExport = async (format: string, records?: string[]) => {
    setIsExporting(true);

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const recordCount = records ? records.length : filteredData.length;
      toast.success(`Successfully exported ${recordCount} records as ${format.toUpperCase()}`);

      // Clear selection after export
      setSelectedRecords([]);
    } catch (error) {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRecords(
      selectedRecords.length === filteredData.length
        ? []
        : filteredData.map(item => item.id)
    );
  };

  const formatFileSize = (size: string) => {
    if (size === 'Processing...') return size;
    return size;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <LucideCheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <LucideLoader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <LucideCheckCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json':
        return <LucideFileJson className="w-4 h-4 text-blue-600" />;
      case 'csv':
        return <LucideFile className="w-4 h-4 text-green-600" />;
      case 'excel':
        return <LucideFileSpreadsheet className="w-4 h-4 text-orange-600" />;
      default:
        return <LucideFileText className="w-4 h-4" />;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Data Management</h1>
              <p className="text-muted-foreground">
                Export, view, and manage your scraped data
              </p>
            </div>
            <Button onClick={() => window.location.reload()}>
              <LucideRefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="data" className="space-y-6">
            <TabsList>
              <TabsTrigger value="data">
                <LucideDatabase className="w-4 h-4 mr-2" />
                Browse Data
              </TabsTrigger>
              <TabsTrigger value="exports">
                <LucideDownload className="w-4 h-4 mr-2" />
                Export History
              </TabsTrigger>
              <TabsTrigger value="settings">
                <LucideSettings className="w-4 h-4 mr-2" />
                Export Settings
              </TabsTrigger>
            </TabsList>

            {/* Browse Data Tab */}
            <TabsContent value="data" className="space-y-6">
              {/* Filters and Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LucideFilter className="w-5 h-5" />
                    Filters & Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="search">Search Records</Label>
                      <div className="relative">
                        <LucideSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Search by title or description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="scraper">Filter by Scraper</Label>
                      <Select value={selectedScraper} onValueChange={setSelectedScraper}>
                        <SelectTrigger>
                          <SelectValue placeholder="All scrapers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Scrapers</SelectItem>
                          <SelectItem value="Product Price Monitor">Product Price Monitor</SelectItem>
                          <SelectItem value="Competitor Analysis">Competitor Analysis</SelectItem>
                          <SelectItem value="News Scraper">News Scraper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" className="w-full">
                        <LucideCalendar className="w-4 h-4 mr-2" />
                        Date Range
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LucideCloudDownload className="w-5 h-5" />
                    Quick Export
                  </CardTitle>
                  <CardDescription>
                    Export {selectedRecords.length > 0 ? `${selectedRecords.length} selected` : 'all'} records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleExport('json', selectedRecords.length > 0 ? selectedRecords : undefined)}
                      disabled={isExporting}
                      variant="outline"
                    >
                      <LucideFileJson className="w-4 h-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button
                      onClick={() => handleExport('csv', selectedRecords.length > 0 ? selectedRecords : undefined)}
                      disabled={isExporting}
                      variant="outline"
                    >
                      <LucideFile className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      onClick={() => handleExport('excel', selectedRecords.length > 0 ? selectedRecords : undefined)}
                      disabled={isExporting}
                      variant="outline"
                    >
                      <LucideFileSpreadsheet className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                    {isExporting && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LucideLoader2 className="w-4 h-4 animate-spin" />
                        Preparing export...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Data Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Scraped Data</CardTitle>
                      <CardDescription>
                        {filteredData.length} records found
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedRecords.length === filteredData.length && filteredData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label className="text-sm">Select All</Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="pb-3 w-12"></th>
                          <th className="pb-3">Item</th>
                          <th className="pb-3">Scraper</th>
                          <th className="pb-3">Price</th>
                          <th className="pb-3">Scraped</th>
                          <th className="pb-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredData.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/50">
                            <td className="py-4">
                              <Checkbox
                                checked={selectedRecords.includes(item.id)}
                                onCheckedChange={() => handleSelectRecord(item.id)}
                              />
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                )}
                                <div>
                                  <div className="font-medium text-sm">{item.title}</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-xs">
                                    {item.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <Badge variant="outline" className="text-xs">
                                {item.scraper}
                              </Badge>
                            </td>
                            <td className="py-4 font-medium">
                              {item.price}
                            </td>
                            <td className="py-4 text-sm text-muted-foreground">
                              {new Date(item.scraped_at).toLocaleDateString()}
                            </td>
                            <td className="py-4">
                              <Button variant="ghost" size="sm">
                                <LucideEye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Export History Tab */}
            <TabsContent value="exports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export History</CardTitle>
                  <CardDescription>
                    Previous data exports and downloads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockExports.map((export_item) => (
                      <div key={export_item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getFormatIcon(export_item.format)}
                            {getStatusIcon(export_item.status)}
                          </div>
                          <div>
                            <div className="font-medium">{export_item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {export_item.scraper} • {export_item.records.toLocaleString()} records • {formatFileSize(export_item.size)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created: {new Date(export_item.created).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            export_item.status === 'completed' ? 'default' :
                            export_item.status === 'processing' ? 'secondary' : 'destructive'
                          }>
                            {export_item.status}
                          </Badge>
                          {export_item.status === 'completed' && (
                            <Button size="sm" variant="outline">
                              <LucideDownload className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Export Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Preferences</CardTitle>
                  <CardDescription>
                    Configure default export settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="default-format">Default Export Format</Label>
                    <Select defaultValue="csv">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="excel">Excel (XLSX)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Export Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="include-metadata" defaultChecked />
                        <Label htmlFor="include-metadata">Include metadata (timestamps, URLs)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="include-images" />
                        <Label htmlFor="include-images">Include image URLs</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="compress-export" defaultChecked />
                        <Label htmlFor="compress-export">Compress large exports</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button>Save Preferences</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
