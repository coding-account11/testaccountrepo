import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, UserPlus, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

// Mock user ID
const MOCK_USER_ID = "user-1";

interface ClientWithFormatted extends Client {
  formattedLastVisit?: string;
}

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "inactive-30" | "inactive-60" | "high-spend" | "new-clients" | "loyal-clients" | "at-risk">("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", MOCK_USER_ID],
  });

  const uploadCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', MOCK_USER_ID);
      
      const response = await fetch('/api/clients/upload-csv', {
        method: 'POST',
        body: formData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", MOCK_USER_ID] });
      setIsUploadOpen(false);
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload CSV file",
        variant: "destructive",
      });
    },
  });

  const squareImportMutation = useMutation({
    mutationFn: async () => {
      // Redirect to Square OAuth
      window.location.href = '/api/integrations/square/auth';
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to connect to Square",
        variant: "destructive",
      });
    },
  });

  // Format clients data
  const formattedClients: ClientWithFormatted[] = clients.map(client => ({
    ...client,
    formattedLastVisit: client.lastVisit 
      ? new Date(client.lastVisit).toLocaleDateString()
      : "Never",
  }));

  // Filter clients based on search and filter
  const filteredClients = formattedClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (selectedFilter) {
      case "inactive-30":
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return !client.lastVisit || new Date(client.lastVisit) < thirtyDaysAgo;
      case "inactive-60":
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        return !client.lastVisit || new Date(client.lastVisit) < sixtyDaysAgo;
      case "high-spend":
        return client.tags?.includes("high-spend") || client.tags?.includes("vip");
      case "new-clients":
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return client.createdAt && new Date(client.createdAt) > sevenDaysAgo;
      case "loyal-clients":
        return client.tags?.includes("loyal") || client.tags?.includes("regular");
      case "at-risk":
        return client.tags?.includes("at-risk") || client.tags?.includes("churning");
      default:
        return true;
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleCsvUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }
    uploadCsvMutation.mutate(selectedFile);
  };

  const handleSquareImport = () => {
    squareImportMutation.mutate();
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-8"></div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-primary mb-2">Clients</h2>
        <p className="text-muted-foreground">Manage your customer list</p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 items-center space-x-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
            >
              <option value="all">All Clients</option>
              <option value="new-clients">New Clients (7 days)</option>
              <option value="inactive-30">Inactive 30+ Days</option>
              <option value="inactive-60">Inactive 60+ Days</option>
              <option value="loyal-clients">Loyal Clients</option>
              <option value="high-spend">High Spend Clients</option>
              <option value="at-risk">At Risk Clients</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSquareImport}
            disabled={squareImportMutation.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {squareImportMutation.isPending ? "Connecting..." : "Import from Square"}
          </Button>
          
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload CSV Data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with your client data. Our AI will automatically clean and structure the data.
                </p>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {selectedFile ? selectedFile.name : "Click to upload CSV file"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports: Name, Email, Phone, Last Visit columns
                    </p>
                  </label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCsvUpload}
                    disabled={uploadCsvMutation.isPending}
                  >
                    {uploadCsvMutation.isPending ? "Processing..." : "Upload & Clean"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Client Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredClients.length} {filteredClients.length === 1 ? "Client" : "Clients"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No clients found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm || selectedFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Import clients from Square or upload a CSV file to get started."
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.formattedLastVisit}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}