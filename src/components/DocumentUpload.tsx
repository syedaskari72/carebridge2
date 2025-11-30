"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Trash2, Eye, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface Document {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  isVerified: boolean;
  createdAt: string;
  fileSize: number;
}

interface DocumentUploadProps {
  documents: Document[];
  onDocumentUploaded: () => void;
  isVerified: boolean;
}

const documentTypes = [
  { value: "license", label: "Nursing License" },
  { value: "degree", label: "Nursing Degree/Certificate" },
  { value: "cpr", label: "CPR Certification" },
  { value: "id", label: "National ID/CNIC" },
  { value: "experience", label: "Experience Certificate" },
  { value: "background", label: "Background Check" },
  { value: "other", label: "Other Document" }
];

export default function DocumentUpload({ documents, onDocumentUploaded, isVerified }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedType) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", selectedType);

      const response = await fetch("/api/nurse/documents", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Document uploaded successfully!");
        onDocumentUploaded();
        setSelectedType("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/nurse/documents?id=${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Document deleted successfully!");
        onDocumentUploaded();
      } else {
        alert("Failed to delete document");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getVerificationStatus = (doc: Document) => {
    if (doc.isVerified) {
      return <Badge variant="default" className="text-xs"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Professional Documents
        </CardTitle>
        <CardDescription>
          Upload your professional documents for verification. All documents are required for account approval.
        </CardDescription>
        
        {!isVerified && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Please upload all required documents to get your account verified and start accepting bookings.
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <h3 className="font-medium">Upload New Document</h3>
          
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="flex-1 h-10">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedType || uploading}
              size="icon"
              className="h-10 w-10"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <p className="text-xs text-muted-foreground">
            Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
          </p>
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          <h3 className="font-medium">Uploaded Documents ({documents.length})</h3>
          
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your professional documents to get verified</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">
                          {documentTypes.find(t => t.value === doc.type)?.label || doc.type}
                        </h4>
                        {getVerificationStatus(doc)}
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                        title="View Document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {!doc.isVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDocument(doc.id)}
                          title="Delete Document"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Required Documents Checklist */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Required Documents Checklist</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {documentTypes.slice(0, 4).map((type) => {
              const hasDocument = documents.some(doc => doc.type === type.value);
              return (
                <div key={type.value} className="flex items-center gap-2">
                  {hasDocument ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <div className="h-3 w-3 border border-gray-300 rounded-full" />
                  )}
                  <span className={hasDocument ? "text-green-600" : "text-muted-foreground"}>
                    {type.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
