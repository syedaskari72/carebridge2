"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, X, CheckCircle, Info, AlertCircle } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "error" | "success" | "warning" | "info";
  details?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  type = "error",
  details,
  actionLabel,
  onAction
}: ErrorModalProps) {
  
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case "info":
        return <Info className="h-6 w-6 text-blue-600" />;
      default:
        return <AlertCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          border: "border-green-200",
          bg: "bg-green-50 dark:bg-green-950",
          text: "text-green-900 dark:text-green-100"
        };
      case "warning":
        return {
          border: "border-yellow-200",
          bg: "bg-yellow-50 dark:bg-yellow-950",
          text: "text-yellow-900 dark:text-yellow-100"
        };
      case "info":
        return {
          border: "border-blue-200",
          bg: "bg-blue-50 dark:bg-blue-950",
          text: "text-blue-900 dark:text-blue-100"
        };
      default:
        return {
          border: "border-red-200",
          bg: "bg-red-50 dark:bg-red-950",
          text: "text-red-900 dark:text-red-100"
        };
    }
  };

  const colors = getColors();
  const defaultTitle = {
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Information"
  }[type];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <Card 
          className={`w-full max-w-md ${colors.border} ${colors.bg} shadow-lg`}
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getIcon()}
                <div>
                  <CardTitle className={`text-lg ${colors.text}`}>
                    {title || defaultTitle}
                  </CardTitle>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <CardDescription className={`text-base ${colors.text} mb-4`}>
              {message}
            </CardDescription>
            
            {details && (
              <div className="mb-4 p-3 bg-background/50 rounded-lg border">
                <p className="text-sm text-muted-foreground font-mono">
                  {details}
                </p>
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {actionLabel && onAction && (
                <Button onClick={onAction} variant="default">
                  {actionLabel}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Hook for easy error modal management
export function useErrorModal() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type?: "error" | "success" | "warning" | "info";
    details?: string;
    actionLabel?: string;
    onAction?: () => void;
  }>({
    isOpen: false,
    message: ""
  });

  const showError = (message: string, details?: string, title?: string) => {
    setModalState({
      isOpen: true,
      type: "error",
      title: title || "Error",
      message,
      details
    });
  };

  const showSuccess = (message: string, title?: string) => {
    setModalState({
      isOpen: true,
      type: "success",
      title: title || "Success",
      message
    });
  };

  const showWarning = (message: string, title?: string) => {
    setModalState({
      isOpen: true,
      type: "warning",
      title: title || "Warning",
      message
    });
  };

  const showInfo = (message: string, title?: string) => {
    setModalState({
      isOpen: true,
      type: "info",
      title: title || "Information",
      message
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const ErrorModalComponent = () => (
    <ErrorModal
      isOpen={modalState.isOpen}
      onClose={closeModal}
      title={modalState.title}
      message={modalState.message}
      type={modalState.type}
      details={modalState.details}
      actionLabel={modalState.actionLabel}
      onAction={modalState.onAction}
    />
  );

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    closeModal,
    ErrorModal: ErrorModalComponent
  };
}

// Import useState
import { useState } from "react";
